import { NextRequest, NextResponse } from "next/server";
import { getActiveSubscription, getPaymentHistory } from "@/lib/subscription/subscription-service";

/**
 * GET /api/subscriptions/[vendorId]
 *
 * Returns the vendor's active subscription + payment history.
 * Used by the vendor dashboard (Step 2) and billing history page (Step 6).
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
