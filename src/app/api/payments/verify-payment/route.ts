import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

/**
 * POST /api/payments/verify-payment
 * Verifies Razorpay signature (HMAC-SHA256) and upgrades vendor plan.
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, vendorId, planName }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, vendorId, planName } = body as {
      razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string;
      vendorId: string; planName: string;
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return NextResponse.json({ error: "Razorpay not configured" }, { status: 503 });

    // Verify signature: HMAC-SHA256(order_id|payment_id, key_secret)
    const hmac = crypto.createHmac("sha256", keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");

    if (hmac !== razorpay_signature) {
      console.error("[verify-payment] Signature mismatch");
      return NextResponse.json({ error: "Payment verification failed — signature mismatch" }, { status: 400 });
    }

    console.log("[verify-payment] Signature valid for vendor:", vendorId, "plan:", planName);

    // Update vendor: set plan, featured, verified, + planExpiresAt
    // Monthly plan → 30 days, Yearly plan → 365 days
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (planName === "vendor-pro" ? 30 : 365));

      const updateData: Record<string, unknown> = {
        featured: true,
        planExpiresAt: expiryDate,
      };
      if (planName === "business") updateData.verified = true;

      await db.vendor.update({ where: { id: vendorId }, data: updateData });
      console.log("[verify-payment] Vendor updated:", vendorId, "| plan:", planName, "| expires:", expiryDate.toISOString());
    } catch (e) {
      console.error("[verify-payment] DB update failed:", (e as Error)?.message?.slice(0, 100));
    }

    return NextResponse.json({
      success: true,
      message: `✅ Payment successful! Your ${planName === "vendor-pro" ? "Vendor Pro" : "Business"} plan is now active.`,
      plan: planName, paymentId: razorpay_payment_id,
    });
  } catch (error: any) {
    console.error("[verify-payment] Error:", error.message);
    return NextResponse.json({ error: `Verification failed: ${error.message}` }, { status: 500 });
  }
}
