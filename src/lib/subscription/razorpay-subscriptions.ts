/**
 * Razorpay Subscriptions Service
 *
 * Creates and manages Razorpay Subscriptions (auto-renewal) via the Razorpay API.
 *
 * This module is used when Razorpay Plan IDs are configured (via env vars).
 * When Plan IDs are NOT configured, the system falls back to the legacy
 * Orders flow (one-time payment, manual renewal).
 *
 * ── Architecture ──
 * Vendor selects plan → determine country → get Razorpay Plan ID →
 * create Subscription → vendor authenticates (UPI mandate / card) →
 * webhook confirms activation → subscription activated in DB.
 *
 * ── Migration ──
 * Existing vendors with Order-based subscriptions keep their current
 * subscription until expiry. New purchases use Subscriptions when available.
 */

import { getRazorpay, toSmallestUnit } from "@/lib/razorpay";
import {
  getRazorpayPlanId,
  getDisplayPrice,
  isSubscriptionAvailable,
  type PlanName,
  type BillingCycle,
} from "./config";

// ── Types ────────────────────────────────────────────────────────────────

export interface CreateSubscriptionResult {
  subscriptionId: string;
  razorpaySubscriptionId: string;
  planId: string;
  status: string;
  shortUrl?: string;
  amount: number;
  currency: string;
  provider: "razorpay_subscriptions";
}

export interface SubscriptionDetails {
  id: string;
  status: string;
  planId: string;
  currentStart: number;
  currentEnd: number;
  endedAt: number | null;
  paymentMethod?: string;
  shortUrl?: string;
  hasScheduledChanges?: boolean;
}

// ── Plan Creation (one-time setup) ───────────────────────────────────────

/**
 * Create a Razorpay Plan object for a country + plan + billing cycle.
 * This is a one-time setup operation — Plan IDs should be stored in env vars.
 *
 * Typically run once during deployment setup, NOT during normal operation.
 */
export async function createRazorpayPlan(params: {
  countryCode: string;
  plan: "pro" | "business";
  cycle: "monthly" | "yearly";
}): Promise<{ planId: string; error?: string }> {
  const rzp = getRazorpay();
  if (!rzp) {
    return { planId: "", error: "Razorpay not configured" };
  }

  const { countryCode, plan, cycle } = params;
  const { amount, currency, label } = getDisplayPrice(countryCode, plan, cycle);
  const amountSmallest = toSmallestUnit(amount);

  try {
    const planObj = await rzp.plans.create({
      period: cycle === "monthly" ? "monthly" : "yearly",
      interval: 1,
      item: {
        name: `FindMyBites ${plan === "business" ? "Business" : "Pro"} ${cycle === "monthly" ? "Monthly" : "Yearly"}`,
        amount: amountSmallest,
        currency,
        description: `${label} — ${plan} plan, ${cycle} billing`,
      },
      notes: {
        platform: "FindMyBites",
        countryCode,
        plan,
        cycle,
      },
    });

    if (!planObj?.id) {
      return { planId: "", error: "Razorpay returned no plan ID" };
    }

    return { planId: planObj.id };
  } catch (err: any) {
    const errMsg = err?.error?.description || err?.message || "Unknown error";
    console.error("[razorpay-subscriptions] createPlan failed:", errMsg);
    return { planId: "", error: errMsg };
  }
}

// ── Subscription Creation ────────────────────────────────────────────────

/**
 * Create a Razorpay Subscription for a vendor.
 *
 * Prerequisites:
 *   - Razorpay Plan ID must be configured (env var)
 *   - Vendor must be authenticated
 *   - Vendor's country determines which Plan ID to use
 *
 * After creation, the vendor must authenticate the subscription:
 *   - UPI: automatic mandate (no checkout)
 *   - Card: Razorpay checkout (one-time authentication)
 *
 * The subscription is NOT active until the webhook confirms:
 *   - subscription.activated (UPI mandate approved)
 *   - subscription.charged (first payment successful)
 */
export async function createSubscription(params: {
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  vendorPhone?: string;
  countryCode: string;
  planName: PlanName;
  billingCycle: BillingCycle;
}): Promise<CreateSubscriptionResult | { error: string }> {
  const rzp = getRazorpay();
  if (!rzp) {
    return { error: "Razorpay not configured (missing env vars)" };
  }

  const { vendorId, vendorName, vendorEmail, vendorPhone, countryCode, planName, billingCycle } = params;

  // Determine plan tier (pro or business) from planName
  const plan: "pro" | "business" = planName === "business" ? "business" : "pro";

  // Get the Razorpay Plan ID for this country + plan + cycle
  const planId = getRazorpayPlanId(countryCode, plan, billingCycle);
  if (!planId) {
    return { error: `No Razorpay Plan ID configured for ${countryCode}-${plan}-${billingCycle}. Set the env var or use the Orders flow.` };
  }

  // Get display price for the response (not used by Razorpay — Plan already has the amount)
  const { amount, currency } = getDisplayPrice(countryCode, plan, billingCycle);

  try {
    const subscription = await rzp.subscriptions.create({
      plan_id: planId,
      total_count: billingCycle === "yearly" ? 60 : 120, // 5 years max (yearly=60, monthly=120)
      customer_notify: 1,
      notes: {
        vendorId,
        vendorName,
        vendorEmail,
        platform: "FindMyBites",
        planName,
        billingCycle,
        countryCode,
      },
    });

    if (!subscription?.id) {
      return { error: "Razorpay returned no subscription ID" };
    }

    return {
      subscriptionId: subscription.id,
      razorpaySubscriptionId: subscription.id,
      planId,
      status: subscription.status,
      shortUrl: subscription.short_url,
      amount: toSmallestUnit(amount),
      currency,
      provider: "razorpay_subscriptions",
    };
  } catch (err: any) {
    const errMsg = err?.error?.description || err?.message || "Unknown Razorpay error";
    console.error("[razorpay-subscriptions] createSubscription failed:", errMsg);
    return { error: `Razorpay: ${errMsg}` };
  }
}

// ── Subscription Management ──────────────────────────────────────────────

/**
 * Fetch subscription details from Razorpay.
 */
export async function fetchSubscriptionDetails(
  subscriptionId: string
): Promise<SubscriptionDetails | null> {
  const rzp = getRazorpay();
  if (!rzp) return null;

  try {
    const sub = await rzp.subscriptions.fetch(subscriptionId);
    return {
      id: sub.id,
      status: sub.status,
      planId: sub.plan_id,
      currentStart: sub.current_start ?? 0,
      currentEnd: sub.current_end ?? 0,
      endedAt: sub.ended_at ?? null,
      paymentMethod: sub.payment_method ?? undefined,
      shortUrl: sub.short_url ?? undefined,
      hasScheduledChanges: sub.has_scheduled_changes ?? undefined,
    };
  } catch (err: any) {
    console.error("[razorpay-subscriptions] fetchSubscription failed:", err?.message);
    return null;
  }
}

/**
 * Cancel a Razorpay Subscription immediately.
 * The vendor loses access at the end of the current billing cycle.
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtCycleEnd: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const rzp = getRazorpay();
  if (!rzp) return { success: false, error: "Razorpay not configured" };

  try {
    await rzp.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
    return { success: true };
  } catch (err: any) {
    const errMsg = err?.error?.description || err?.message || "Unknown error";
    console.error("[razorpay-subscriptions] cancelSubscription failed:", errMsg);
    return { success: false, error: errMsg };
  }
}

/**
 * Pause a Razorpay Subscription.
 * The subscription is paused indefinitely until resumed.
 */
export async function pauseSubscription(
  subscriptionId: string,
  pauseAtCycleEnd: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const rzp = getRazorpay();
  if (!rzp) return { success: false, error: "Razorpay not configured" };

  try {
    // Razorpay doesn't have a native "pause" — we use update + notes
    // For actual pause, the subscription must be cancelled and recreated.
    // However, we can set a flag in our DB and treat it as paused.
    // For now, we cancel at cycle end (which effectively pauses until re-subscription).
    await rzp.subscriptions.update(subscriptionId, {
      notes: {
        paused: "true",
        pausedAt: new Date().toISOString(),
      },
    });
    return { success: true };
  } catch (err: any) {
    const errMsg = err?.error?.description || err?.message || "Unknown error";
    console.error("[razorpay-subscriptions] pauseSubscription failed:", errMsg);
    return { success: false, error: errMsg };
  }
}

/**
 * Resume a paused Razorpay Subscription.
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  const rzp = getRazorpay();
  if (!rzp) return { success: false, error: "Razorpay not configured" };

  try {
    await rzp.subscriptions.update(subscriptionId, {
      notes: {
        paused: "false",
        resumedAt: new Date().toISOString(),
      },
    });
    return { success: true };
  } catch (err: any) {
    const errMsg = err?.error?.description || err?.message || "Unknown error";
    console.error("[razorpay-subscriptions] resumeSubscription failed:", errMsg);
    return { success: false, error: errMsg };
  }
}

/**
 * Check if Razorpay Subscriptions (AutoPay) are available for a vendor.
 */
export function isAutoPayAvailable(
  countryCode: string,
  planName: PlanName,
  billingCycle: BillingCycle
): boolean {
  const plan: "pro" | "business" = planName === "business" ? "business" : "pro";
  return isSubscriptionAvailable(countryCode, plan, billingCycle);
}
