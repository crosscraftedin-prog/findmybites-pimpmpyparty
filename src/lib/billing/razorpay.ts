/**
 * Billing Module — Razorpay Service
 *
 * Wrapper around the Razorpay SDK for subscription operations.
 * Uses the existing Razorpay client from src/lib/razorpay.ts.
 */

import crypto from "crypto";
import { getRazorpay } from "@/lib/razorpay";
import type { PlanPricingInfo } from "./types";

export { getRazorpay, isRazorpayConfigured, toSmallestUnit, verifyPaymentSignature } from "@/lib/razorpay";

/**
 * Create a Razorpay Plan object (one-time setup).
 * Store the returned plan_id in the PricingPlan table.
 */
export async function createRazorpayPlan(params: {
  amount: number; // minor units
  currency: string;
  plan: "pro" | "business";
  billingCycle: "monthly" | "yearly";
  countryName: string;
}): Promise<{ planId: string; error?: string }> {
  const rzp = getRazorpay();
  if (!rzp) return { planId: "", error: "Razorpay not configured" };

  try {
    const planObj = await rzp.plans.create({
      period: params.billingCycle === "monthly" ? "monthly" : "yearly",
      interval: 1,
      item: {
        name: `FindMyBites ${params.plan === "business" ? "Business" : "Pro"} ${params.billingCycle === "monthly" ? "Monthly" : "Yearly"}`,
        amount: params.amount,
        currency: params.currency,
        description: `${params.countryName} — ${params.plan} plan, ${params.billingCycle} billing`,
      },
      notes: { platform: "FindMyBites", plan: params.plan, cycle: params.billingCycle },
    });
    return planObj?.id ? { planId: planObj.id } : { planId: "", error: "No plan ID returned" };
  } catch (err: any) {
    return { planId: "", error: err?.error?.description || err?.message || "Unknown error" };
  }
}

/**
 * Verify a Razorpay webhook signature.
 *
 * V7: Uses constant-time comparison (crypto.timingSafeEqual) to prevent
 * timing attacks. The previous `===` comparison leaked signature bytes
 * via response timing.
 */
export function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  try {
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    // Length check before timingSafeEqual (it throws on mismatched lengths)
    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
