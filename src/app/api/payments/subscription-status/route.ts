import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveSubscription, getPaymentHistory } from "@/lib/subscription/subscription-service";

/**
 * GET /api/payments/subscription-status
 *
 * V7: Polling endpoint for the frontend to check subscription status after
 * checkout. The Razorpay Checkout handler fires immediately when the customer
 * authenticates, but the webhook (which activates the subscription) may take
 * 1-10 seconds to arrive. The frontend polls this endpoint until the
 * subscription becomes "active" (or times out after 60s).
 *
 * Query params:
 *   - providerSubscriptionId: The Razorpay subscription ID (for AutoPay flow)
 *   - paymentId: The Razorpay payment ID (for Orders flow)
 *
 * Response:
 *   { status: "pending" | "active" | "expired" | "cancelled" | "past_due",
 *     subscription: ActiveSubscriptionInfo | null,
 *     paymentHistory: PaymentHistoryEntry[],
 *     isActivated: boolean }
 *
 * Authorization: vendor is resolved from the Supabase session. The
 * subscription must belong to the authenticated vendor.
 */
export async function GET(req: NextRequest) {
  try {
    // ── Authenticate ──
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

    // ── Resolve vendor from session ──
    const vendor = await db.vendor.findFirst({
      where: { owner_user_id: userId },
      select: { id: true },
    }).catch(() => null);
    if (!vendor) {
      return NextResponse.json({ error: "No vendor listing found" }, { status: 404 });
    }
    const vendorId = vendor.id;

    // ── Parse query params ──
    const url = new URL(req.url);
    const providerSubscriptionId = url.searchParams.get("providerSubscriptionId");
    const paymentId = url.searchParams.get("paymentId");

    // ── Find the subscription row ──
    let dbSub: any = null;

    if (providerSubscriptionId) {
      // AutoPay flow: find by Razorpay subscription ID
      dbSub = await db.vendorSubscription.findFirst({
        where: { providerSubscriptionId, vendorId },
      }).catch(() => null);
    } else if (paymentId) {
      // Orders flow: find via payment history
      const ph = await db.paymentHistory.findUnique({
        where: { paymentId },
        select: { subscriptionId: true, vendorId: true },
      }).catch(() => null);

      if (ph && ph.vendorId === vendorId && ph.subscriptionId) {
        dbSub = await db.vendorSubscription.findUnique({
          where: { id: ph.subscriptionId },
        }).catch(() => null);
      }
    }

    // ── Also get the vendor's latest active subscription ──
    const activeSub = await getActiveSubscription(vendorId);
    const paymentHistory = await getPaymentHistory(vendorId, 10);

    // ── Determine status ──
    let status = "pending";
    let isActivated = false;

    if (dbSub) {
      status = dbSub.status; // "pending" | "active" | "expired" | "cancelled" | "past_due"
      isActivated = dbSub.status === "active";
    }

    // If there's an active subscription (even a different row), consider it activated
    if (activeSub && activeSub.status === "active" && !activeSub.isExpired) {
      isActivated = true;
      if (status === "pending") status = "active";
    }

    return NextResponse.json({
      status,
      isActivated,
      subscription: activeSub,
      pendingSubscription: dbSub ? {
        id: dbSub.id,
        status: dbSub.status,
        providerSubscriptionId: dbSub.providerSubscriptionId,
        planName: dbSub.planName,
        billingCycle: dbSub.billingCycle,
        createdAt: dbSub.createdAt,
      } : null,
      paymentHistory: paymentHistory.slice(0, 5),
    });
  } catch (error: any) {
    console.error("[subscription-status] Error:", error.message);
    return NextResponse.json(
      { error: `Failed to check subscription status: ${error.message}` },
      { status: 500 }
    );
  }
}
