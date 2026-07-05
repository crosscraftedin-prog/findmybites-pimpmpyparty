import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { activateSubscription, type PlanName, type BillingCycle } from "@/lib/subscription/subscription-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/payments/verify-payment
 *
 * Verifies the Razorpay payment signature (HMAC-SHA256) and activates the
 * vendor's subscription via the provider-agnostic SubscriptionService.
 *
 * Security:
 *   - NEVER trusts frontend vendorId — resolves from Supabase session
 *   - Signature is ALWAYS verified server-side
 *   - Idempotent: duplicate paymentId returns the existing subscription
 *   - Plan activation ONLY happens after successful signature verification
 *   - Vendor ownership verified: the authenticated user MUST own the vendor
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, planName, billingCycle?, amount, currency? }
 * Note: vendorId is NO LONGER accepted from the body — resolved from session.
 */
export async function POST(req: NextRequest) {
  try {
    // ── 0. Authenticate the user and resolve vendor ownership ──
    const supabase = await createSupabaseServerClient();
    let userId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch {}
    if (!userId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) userId = session.user.id;
      } catch {}
    }
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Resolve vendor from session — NEVER trust frontend vendorId
    const vendor = await db.vendor.findFirst({
      where: { owner_user_id: userId },
      select: { id: true, name: true },
    }).catch(() => null);
    if (!vendor) {
      return NextResponse.json({ error: "No vendor listing found for this account" }, { status: 404 });
    }
    const vendorId = vendor.id;

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planName,
      billingCycle = "monthly",
      amount,
      currency = "INR",
    } = body as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      planName: string;
      billingCycle?: string;
      amount?: number;
      currency?: string;
    };

    // ── 1. Validate required fields ──
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
    }
    if (planName !== "vendor-pro" && planName !== "business") {
      return NextResponse.json({ error: `Invalid plan: '${planName}'. Choose 'vendor-pro' or 'business'.` }, { status: 400 });
    }

    // ── 2. Verify Razorpay is configured ──
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error("[verify-payment] RAZORPAY_KEY_SECRET not configured");
      return NextResponse.json({ error: "Razorpay not configured" }, { status: 503 });
    }

    // ── 3. Verify the signature (NEVER trust the frontend) ──
    // signature = HMAC_SHA256(order_id|payment_id, key_secret)
    const hmac = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (hmac !== razorpay_signature) {
      console.error("[verify-payment] Signature mismatch for order:", razorpay_order_id);
      return NextResponse.json(
        { error: "Payment verification failed — signature mismatch" },
        { status: 400 }
      );
    }

    console.log("[verify-payment] Signature valid for vendor:", vendorId, "plan:", planName);

    // ── 4. Activate the subscription (idempotent — prevents duplicate processing) ──
    const result = await activateSubscription({
      vendorId,
      planName: planName as PlanName,
      billingCycle: (billingCycle === "yearly" ? "yearly" : "monthly") as BillingCycle,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      amount: amount ?? 0,
      currency,
      provider: "razorpay_orders",
    });

    const planLabel = planName === "vendor-pro" ? "Baker Pro" : "Business";
    const actionLabel = result.paymentType === "renewal" ? "renewed" : "activated";

    return NextResponse.json({
      success: true,
      message: `✅ Payment successful! Your ${planLabel} plan has been ${actionLabel}.`,
      plan: planName,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      subscriptionId: result.subscription.subscriptionId,
      paymentType: result.paymentType,
      planExpiresAt: result.subscription.planExpiresAt,
      daysRemaining: result.subscription.daysRemaining,
    });
  } catch (error: any) {
    console.error("[verify-payment] Error:", error.message);
    return NextResponse.json(
      { error: `Verification failed: ${error.message}` },
      { status: 500 }
    );
  }
}
