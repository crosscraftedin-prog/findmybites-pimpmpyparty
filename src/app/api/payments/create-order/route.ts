import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getPricing, type BillingCycle } from "@/lib/billing";

/**
 * POST /api/payments/create-order
 *
 * Creates a Razorpay Order (one-time payment, legacy flow).
 *
 * This route is used when:
 *   - Razorpay Plan IDs are NOT configured for the vendor's country, OR
 *   - The vendor's country doesn't support AutoPay yet
 *
 * For auto-renewal subscriptions, use /api/payments/create-subscription instead.
 *
 * Security: vendorId is resolved ONLY from the authenticated Supabase session.
 * The frontend cannot specify vendorId — if no authenticated vendor exists,
 * the route returns 401.
 *
 * Body: { planName: "vendor-pro" | "business", billingCycle: "monthly" | "yearly" }
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planName, billingCycle = "monthly" } = body as { planName: string; billingCycle?: string };

    if (planName !== "vendor-pro" && planName !== "business") {
      return NextResponse.json({ error: `Invalid plan: '${planName}'. Choose 'vendor-pro' or 'business'.` }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return NextResponse.json({ error: "Razorpay not configured" }, { status: 503 });

    // ── Resolve vendor from authenticated session ONLY ──
    // Never trust vendorId from the request body.
    const supabase = await createSupabaseServerClient();
    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { userId = user.id; userEmail = user.email ?? null; }
    } catch {}
    if (!userId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) { userId = session.user.id; userEmail = session.user.email ?? null; }
      } catch {}
    }
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const vendor = await db.vendor.findFirst({
      where: { OR: [{ owner_user_id: userId }, ...(userEmail ? [{ userEmail }] : [])] },
      select: { id: true, name: true, slug: true, countryCode: true },
    }).catch(() => null);
    if (!vendor) {
      return NextResponse.json({ error: "No vendor listing found for this account" }, { status: 404 });
    }

    // ── Determine pricing from DB (billing module) based on vendor's country ──
    const countryCode = vendor.countryCode || "US";
    const cycle: BillingCycle = billingCycle === "yearly" ? "yearly" : "monthly";
    const plan = planName === "business" ? "business" : "pro";
    const pricing = await getPricing(countryCode, plan, cycle);

    // SECURITY: Always use the server-defined plan amount — NEVER trust client-supplied amount.
    const amount = pricing.amountMinor;
    const currency = pricing.currency;
    if (amount < 100) return NextResponse.json({ error: "Amount too small" }, { status: 400 });

    const vendorName = vendor.name;
    const actualVendorId = vendor.id;
    const actualEmail = userEmail || "";

    logger.info("create-order", "Creating Razorpay order", { planName, amount, vendorId: actualVendorId });

    const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": authHeader },
      body: JSON.stringify({
        amount, currency,
        receipt: `V${Date.now().toString().slice(-8)}`,
        notes: { vendorId: actualVendorId, planName, billingCycle: cycle, countryCode, userEmail: actualEmail, platform: "FindMyBites" },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      logger.error("create-order", "Razorpay order creation failed", { status: response.status, error });
      return NextResponse.json({ error: error?.error?.description || `Razorpay error: ${response.status}` }, { status: response.status });
    }

    const order = await response.json();
    logger.info("create-order", "Order created successfully", { orderId: order.id });

    return NextResponse.json({
      orderId: order.id, amount: order.amount, currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId,
      planName, vendorName,
    });
  } catch (error: any) {
    logger.error("create-order", "Unexpected error", { message: error.message });
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}
