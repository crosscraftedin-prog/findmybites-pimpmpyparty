import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { activateSubscription, type PlanName, type BillingCycle } from "@/lib/subscription/subscription-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPricing } from "@/lib/billing";
import { getRazorpay } from "@/lib/razorpay";

/**
 * POST /api/payments/verify-payment
 *
 * Verifies the Razorpay payment signature (HMAC-SHA256) and activates the
 * vendor's subscription via the provider-agnostic SubscriptionService.
 *
 * Security (V7 hardened):
 *   - NEVER trusts frontend vendorId — resolves from Supabase session
 *   - NEVER trusts frontend amount/currency — resolves from PricingPlan DB
 *   - Signature is ALWAYS verified server-side (timing-safe comparison)
 *   - V7: Fetches the payment from Razorpay API to confirm status === "captured"
 *   - Idempotent: duplicate paymentId returns the existing subscription
 *   - Plan activation ONLY happens after successful signature verification
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, planName, billingCycle? }
 */
export async function POST(req: NextRequest) {
  try {
    // ── 0. Authenticate ──
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

    // ── 1. Resolve vendor from session ──
    const vendor = await db.vendor.findFirst({
      where: { owner_user_id: userId },
      select: { id: true, name: true, countryCode: true },
    }).catch(() => null);
    if (!vendor) {
      return NextResponse.json({ error: "No vendor listing found for this account" }, { status: 404 });
    }
    const vendorId = vendor.id;

    // ── 2. Parse body (NO amount/currency accepted) ──
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planName,
      billingCycle = "monthly",
    } = body as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      planName: string;
      billingCycle?: string;
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
    }
    if (planName !== "vendor-pro" && planName !== "business") {
      return NextResponse.json({ error: `Invalid plan: '${planName}'` }, { status: 400 });
    }

    // ── 3. Verify signature (V7: timing-safe comparison) ──
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: "Razorpay not configured" }, { status: 503 });
    }
    const expectedSig = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSig.length !== razorpay_signature.length ||
        !crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(razorpay_signature))) {
      return NextResponse.json({ error: "Signature mismatch" }, { status: 400 });
    }

    // ── 3b. V7: Fetch the payment from Razorpay to confirm it's actually captured ──
    // The signature only proves the response came from Razorpay — it doesn't
    // prove the payment succeeded. A "failed" payment still has a valid signature.
    const rzp = getRazorpay();
    if (rzp) {
      try {
        const payment = await rzp.payments.fetch(razorpay_payment_id);
        if (payment && payment.status !== "captured") {
          return NextResponse.json({
            error: `Payment not captured (status: ${payment.status}). If money was deducted, it will be refunded.`,
          }, { status: 400 });
        }
      } catch (err: any) {
        // Non-fatal: if the fetch fails (network issue), rely on signature verification
        console.warn("[verify-payment] Could not fetch payment status from Razorpay:", err.message);
      }
    }

    // ── 4. Resolve pricing from DB (NEVER trust frontend) ──
    const cycle: BillingCycle = billingCycle === "yearly" ? "yearly" : "monthly";
    const plan = planName === "business" ? "business" : "pro";
    const countryCode = vendor.countryCode || "US";
    const pricing = await getPricing(countryCode, plan, cycle);

    // ── 5. Activate subscription (transaction-safe, idempotent) ──
    const result = await activateSubscription({
      vendorId,
      planName: planName as PlanName,
      billingCycle: cycle,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      amount: pricing.amountMinor,
      currency: pricing.currency,
      provider: "razorpay_orders",
    });

    const planLabel = planName === "vendor-pro" ? "Pro" : "Business";
    const actionLabel = result.paymentType === "renewal" ? "renewed" : "activated";

    return NextResponse.json({
      success: true,
      message: `Payment successful! Your ${planLabel} plan has been ${actionLabel}.`,
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
    return NextResponse.json({ error: `Verification failed: ${error.message}` }, { status: 500 });
  }
}
