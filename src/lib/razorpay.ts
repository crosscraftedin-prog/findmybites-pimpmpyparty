import Razorpay from "razorpay";
import crypto from "crypto";

/**
 * Server-side Razorpay client.
 *
 * Requires these env vars on Vercel:
 *   RAZORPAY_KEY_ID     — from Razorpay dashboard → API Keys
 *   RAZORPAY_KEY_SECRET — from Razorpay dashboard → API Keys
 *   NEXT_PUBLIC_RAZORPAY_KEY_ID — same as RAZORPAY_KEY_ID (needed client-side for checkout)
 *
 * If keys aren't set, functions return null and the UI shows a friendly
 * "payments not configured" message instead of crashing.
 */

let _instance: Razorpay | null = null;

export function getRazorpay(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  if (!_instance) {
    _instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return _instance;
}

export function isRazorpayConfigured(): boolean {
  return !!(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  );
}

/**
 * Amount in paise (Razorpay requires the smallest currency unit).
 * For INR: ₹299 → 29900 paise.
 * For AED: AED 18 → 1800 (fils).
 * For USD: $5 → 500 (cents).
 */
export function toSmallestUnit(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Create a Razorpay order for a subscription payment.
 * Returns the order object (id, amount, currency, etc.) or null on failure.
 */
export async function createSubscriptionOrder(params: {
  amount: number; // in the currency's main unit (e.g. 299 for ₹299)
  currency: string; // ISO code: INR, AED, USD, etc.
  planKey: "pro" | "business";
  billingCycle: "monthly" | "yearly";
  vendorSlug: string;
  vendorName: string;
  vendorEmail?: string;
  vendorPhone?: string;
}): Promise<{ orderId: string; amount: number; currency: string } | null> {
  const rzp = getRazorpay();
  if (!rzp) return null;

  try {
    const amountPaise = toSmallestUnit(params.amount);
    const order = await rzp.orders.create({
      amount: amountPaise,
      currency: params.currency,
      receipt: `sub_${params.planKey}_${params.billingCycle}_${Date.now()}`,
      notes: {
        planKey: params.planKey,
        billingCycle: params.billingCycle,
        vendorSlug: params.vendorSlug,
        vendorName: params.vendorName,
        platform: "FindMyBites",
      },
    });

    return {
      orderId: order.id,
      amount: amountPaise,
      currency: params.currency,
    };
  } catch (err) {
    console.error("[razorpay] createSubscriptionOrder failed:", err);
    return null;
  }
}

/**
 * Verify the Razorpay payment signature to confirm the payment is genuine.
 * Uses HMAC SHA256: signature = HMAC_SHA256(order_id|payment_id, key_secret)
 */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;

  try {
    const body = `${params.orderId}|${params.paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    return expectedSignature === params.signature;
  } catch (err) {
    console.error("[razorpay] verifyPaymentSignature failed:", err);
    return false;
  }
}
