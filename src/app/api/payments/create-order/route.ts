import { NextRequest, NextResponse } from "next/server";
import { createSubscriptionOrder, isRazorpayConfigured } from "@/lib/razorpay";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

/**
 * POST /api/payments/create-order
 *
 * Creates a Razorpay order for a subscription upgrade. Requires the vendor
 * to be authenticated. Returns the order ID which the client uses to open
 * the Razorpay checkout modal.
 *
 * Body:
 *   { planKey: "pro" | "business", billingCycle: "monthly" | "yearly" }
 */

// ── Plan pricing (INR — always charged in INR for Razorpay) ────────────────
// Defined inline here (not imported from the client component) to avoid
// SSR/client import issues on Vercel serverless.
const PLAN_PRICES: Record<string, { monthly: number; yearly: number; name: string }> = {
  pro: { monthly: 299, yearly: 239, name: "Vendor Pro" },
  business: { monthly: 499, yearly: 399, name: "Business" },
};

export async function POST(req: NextRequest) {
  try {
    // ── Check Razorpay is configured FIRST ───────────────────────────────
    if (!isRazorpayConfigured()) {
      console.error("[api/payments/create-order] Razorpay not configured — missing env vars");
      return NextResponse.json(
        { error: "Payments are not configured yet. Please contact support@findmybites.com to upgrade your plan." },
        { status: 503 }
      );
    }

    // ── Auth check ──────────────────────────────────────────────────────
    let user: any = null;
    try {
      const supabase = await createSupabaseServerClient();
      const userResult = await supabase.auth.getUser();
      user = userResult.data?.user;
      if (!user) {
        const sessionResult = await supabase.auth.getSession();
        user = sessionResult.data?.session?.user;
      }
    } catch (e) {
      console.error("[api/payments/create-order] Supabase auth error:", (e as Error)?.message?.slice(0, 100));
    }

    if (!user?.id) {
      return NextResponse.json(
        { error: "Please sign in to upgrade your plan." },
        { status: 401 }
      );
    }

    // ── Parse body ──────────────────────────────────────────────────────
    const body = await req.json();
    const { planKey, billingCycle } = body as {
      planKey: string;
      billingCycle: string;
    };

    // ── Validate plan ───────────────────────────────────────────────────
    if (!planKey || !PLAN_PRICES[planKey]) {
      return NextResponse.json(
        { error: `Invalid plan: '${planKey}'. Choose 'pro' or 'business'.` },
        { status: 400 }
      );
    }
    if (!billingCycle || !["monthly", "yearly"].includes(billingCycle)) {
      return NextResponse.json(
        { error: `Invalid billing cycle: '${billingCycle}'. Choose 'monthly' or 'yearly'.` },
        { status: 400 }
      );
    }

    // ── Get price (always INR) ──────────────────────────────────────────
    const amount = PLAN_PRICES[planKey][billingCycle as "monthly" | "yearly"];

    // Validate minimum amount (Razorpay requires >= 100 paise = ₹1)
    const amountPaise = Math.round(amount * 100);
    if (amountPaise < 100) {
      return NextResponse.json(
        { error: `Amount too small: ${amountPaise} paise (minimum is 100)` },
        { status: 400 }
      );
    }

    // ── Fetch vendor (optional — for metadata) ──────────────────────────
    let vendorName = user.email?.split("@")[0] || "Vendor";
    let vendorSlug = "unknown";
    try {
      const vendor = await db.vendor.findFirst({
        where: {
          OR: [
            { owner_user_id: user.id },
            { userEmail: user.email ?? "" },
          ],
        },
        select: { name: true, slug: true },
      });
      if (vendor) {
        vendorName = vendor.name;
        vendorSlug = vendor.slug;
      }
    } catch (e) {
      console.error("[api/payments/create-order] Vendor query failed:", (e as Error)?.message?.slice(0, 100));
    }

    console.log("[api/payments/create-order] Creating order:", {
      planKey, billingCycle, amount, amountPaise, vendorSlug, vendorName
    });

    // ── Create Razorpay order ───────────────────────────────────────────
    const order = await createSubscriptionOrder({
      amount,
      currency: "INR",
      planKey: planKey as "pro" | "business",
      billingCycle: billingCycle as "monthly" | "yearly",
      vendorSlug,
      vendorName,
      vendorEmail: user.email,
    });

    if (!order || !order.orderId) {
      const errMsg = order?.error || "Could not create payment order.";
      console.error("[api/payments/create-order] Order creation failed:", errMsg);
      return NextResponse.json(
        { error: errMsg },
        { status: 500 }
      );
    }

    console.log("[api/payments/create-order] Order created:", order.orderId);

    return NextResponse.json({
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      planKey,
      billingCycle,
      vendorName,
      vendorEmail: user.email,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("[api/payments/create-order] POST failed:", err);
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Payment initialization failed: ${errMsg}` },
      { status: 500 }
    );
  }
}
