import { NextRequest, NextResponse } from "next/server";
import { getActiveSubscription, getPaymentHistory } from "@/lib/subscription/subscription-service";
import { requireAdmin } from "@/lib/admin-guard";
import { resolveVendorFromSession } from "@/lib/vendor-session";

/**
 * GET /api/subscriptions/[vendorId]
 *
 * Returns the vendor's active subscription + payment history.
 * Used by the vendor dashboard (Step 2) and billing history page (Step 6).
 *
 * Authorization: admin can view any vendor's subscription; vendors can only
 * view their own (URL vendorId must match their session vendor id).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;

    if (!vendorId) {
      return NextResponse.json({ error: "vendorId required" }, { status: 400 });
    }

    // ── Authorization ──
    const adminGuard = await requireAdmin();
    if (adminGuard) {
      // Not admin — must be the vendor themselves
      const vendor = await resolveVendorFromSession();
      if (!vendor) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      if (vendor.id !== vendorId) {
        return NextResponse.json({ error: "Not authorized to view this subscription" }, { status: 403 });
      }
    }

    const [subscription, paymentHistory] = await Promise.all([
      getActiveSubscription(vendorId),
      getPaymentHistory(vendorId, 50),
    ]);

    return NextResponse.json({
      subscription,
      paymentHistory,
    });
  } catch (error: any) {
    console.error("[subscriptions] GET failed:", error.message);
    return NextResponse.json(
      { error: `Failed to load subscription: ${error.message}` },
      { status: 500 }
    );
  }
}
