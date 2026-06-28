import { NextRequest, NextResponse } from "next/server";
import { createSubscriptionOrder, isRazorpayConfigured } from "@/lib/razorpay";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { PRICING_BY_COUNTRY, FALLBACK_PRICING } from "@/components/SubscriptionModal";

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
export async function POST(req: NextRequest) {
  try {
    // ── Check Razorpay is configured FIRST (before auth) ────────────────
    if (!isRazorpayConfigured()) {
      console.error("[api/payments/create-order] Razorpay not configured — missing env vars");
      return NextResponse.json(
        { error: "Payments are not configured yet. Please contact support@findmybites.com to upgrade your plan." },
        { status: 503 }
      );
    }

    // ── Auth check ──────────────────────────────────────────────────────
    let session: any = null;
    let user: any = null;
    try {
      const supabase = await createSupabaseServerClient();
      // Use getUser() — it verifies the JWT server-side (more reliable on
      // Vercel serverless where cookies may not propagate correctly).
      const userResult = await supabase.auth.getUser();
      user = userResult.data?.user;
      if (!user) {
        // Fallback to getSession()
        const sessionResult = await supabase.auth.getSession();
        session = sessionResult.data?.session;
        user = session?.user;
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
      planKey: "pro" | "business";
      billingCycle: "monthly" | "yearly";
    };

    if (!planKey || !["pro", "business"].includes(planKey)) {
      return NextResponse.json(
        { error: "Invalid plan. Choose 'pro' or 'business'." },
        { status: 400 }
      );
    }
    if (!billingCycle || !["monthly", "yearly"].includes(billingCycle)) {
      return NextResponse.json(
        { error: "Invalid billing cycle." },
        { status: 400 }
      );
    }

    // ── Fetch vendor (don't require approved — they might be upgrading
    //    to get approved faster) ──────────────────────────────────────────
    let vendor: { id: string; name: string; slug: string; countryCode: string; currency: string } | null = null;
    try {
      vendor = await db.vendor.findFirst({
        where: {
          OR: [
            { owner_user_id: user.id },
            { userEmail: user.email ?? "" },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          countryCode: true,
          currency: true,
        },
      });
    } catch (e) {
      console.error("[api/payments/create-order] Vendor query failed:", (e as Error)?.message?.slice(0, 150));
    }

    // If vendor not found in DB, use session data as fallback so payment
    // can still proceed (the vendor record may exist in Supabase but not
    // Prisma's view, or the DB might be temporarily unavailable).
    const vendorName = vendor?.name || user.email?.split("@")[0] || "Vendor";
    const vendorSlug = vendor?.slug || "unknown";
    const countryCode = vendor?.countryCode || "IN";

    if (!vendor) {
      console.log("[api/payments/create-order] Vendor not found in DB — proceeding with session data. User:", user.email);
    }

    // ── Determine price ─────────────────────────────────────────────────
    const pricing = PRICING_BY_COUNTRY[countryCode] ?? FALLBACK_PRICING;
    const amount = pricing[planKey][billingCycle];

    // ALWAYS use INR for Razorpay — test mode only supports INR, and live
    // mode supports INR globally. Pricing display shows local currency,
    // but the actual charge is in INR (Razorpay handles FX conversion).
    const currency = "INR";

    console.log("[api/payments/create-order] Creating order:", {
      planKey, billingCycle, amount, currency, vendorSlug, vendorName
    });

    // ── Create Razorpay order ───────────────────────────────────────────
    const order = await createSubscriptionOrder({
      amount,
      currency,
      planKey,
      billingCycle,
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
    return NextResponse.json(
      { error: "Payment initialization failed. Please try again or contact support@findmybites.com." },
      { status: 500 }
    );
  }
}
