/**
 * Billing Module — Subscriptions (V7 — Production-Ready AutoPay)
 *
 * Creates and manages Razorpay Subscriptions using DB-driven pricing.
 *
 * V7 CHANGES (Master Production Fix):
 *   1. Creates a Razorpay Customer BEFORE the subscription (fixes empty Customers page)
 *   2. Saves a "pending" VendorSubscription row immediately after subscription creation
 *      (fixes lifecycle webhooks finding no matching DB row)
 *   3. Passes providerSubscriptionId through the webhook → activateSubscription chain
 *   4. Falls back to Orders flow ONLY when no Razorpay Plan ID is configured
 *
 * Architecture:
 *   PricingPlan (DB) → getPricing() → createSubscription()
 *     → razorpay.customers.create()
 *     → razorpay.subscriptions.create({ customer_id, plan_id })
 *     → VendorSubscription row saved (status="pending")
 *     → Webhook subscription.charged → activateSubscription() (status="active")
 */

import { getRazorpay } from "@/lib/razorpay";
import { db } from "@/lib/db";
import { getPricing } from "./pricing";
import {
  activateSubscription as activateDbSub,
  cancelSubscription as cancelDbSub,
  getActiveSubscription,
} from "@/lib/subscription/subscription-service";
import { logger } from "@/lib/logger";
import type { PlanName, BillingCycle, PaymentProvider } from "./types";

export interface CreateSubscriptionResult {
  subscriptionId: string;            // Razorpay subscription ID
  razorpaySubscriptionId: string;    // Alias (same value)
  razorpayCustomerId: string;        // Razorpay customer ID
  planId: string;                    // Razorpay plan ID
  status: string;                    // "created" | "authenticated" | "active" | ...
  shortUrl?: string;                 // Razorpay hosted auth page (not used in checkout flow)
  amount: number;                    // minor units
  currency: string;
  provider: PaymentProvider;
  dbSubscriptionId: string;          // Internal VendorSubscription row ID
}

/**
 * Create or fetch a Razorpay Customer for the vendor.
 *
 * Razorpay Customers are required for Subscriptions — without a customer_id,
 * the subscription is anonymous and won't appear in the Customers dashboard.
 *
 * Idempotent: if the vendor already has a razorpayCustomerId saved, reuses it.
 */
async function ensureRazorpayCustomer(params: {
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  vendorPhone?: string;
}): Promise<{ customerId: string; error?: string }> {
  const rzp = getRazorpay();
  if (!rzp) return { customerId: "", error: "Razorpay not configured" };

  // ── Check if we already saved a customer ID on the vendor's latest subscription ──
  const existingSub = await db.vendorSubscription.findFirst({
    where: { vendorId: params.vendorId, razorpayCustomerId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { razorpayCustomerId: true },
  }).catch(() => null);

  if (existingSub?.razorpayCustomerId) {
    // Verify the customer still exists in Razorpay
    try {
      const customer = await rzp.customers.fetch(existingSub.razorpayCustomerId);
      if (customer?.id) {
        return { customerId: customer.id };
      }
    } catch {
      // Customer was deleted in Razorpay — fall through to create a new one
    }
  }

  // ── Create a new Razorpay Customer ──
  try {
    const customer = await rzp.customers.create({
      name: params.vendorName || "Vendor",
      email: params.vendorEmail || undefined,
      contact: params.vendorPhone || undefined,
      notes: {
        vendorId: params.vendorId,
        platform: "FindMyBites",
      },
    });

    if (!customer?.id) {
      return { customerId: "", error: "Razorpay returned no customer ID" };
    }

    logger.info("subscription", "Created Razorpay customer", {
      vendorId: params.vendorId,
      customerId: customer.id,
    });

    return { customerId: customer.id };
  } catch (err: any) {
    const errMsg = err?.error?.description || err?.message || "Unknown Razorpay error";
    logger.error("subscription", "Failed to create Razorpay customer", { error: errMsg });
    return { customerId: "", error: errMsg };
  }
}

/**
 * Create a Razorpay Subscription for a vendor.
 *
 * Flow:
 *   1. Get pricing from DB (falls back to USD, then to hardcoded fallback)
 *   2. If no razorpayPlanId → return { fallbackToOrders: true }
 *   3. Create/reuse a Razorpay Customer
 *   4. Create a Razorpay Subscription with the customer_id + plan_id
 *   5. Save a "pending" VendorSubscription row with providerSubscriptionId
 *   6. Return the subscription details for Razorpay Checkout
 *
 * The subscription is activated (status → "active") when the
 * subscription.charged webhook arrives.
 */
export async function createSubscription(params: {
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  vendorPhone?: string;
  countryCode: string;
  planName: PlanName;
  billingCycle: BillingCycle;
}): Promise<CreateSubscriptionResult | { error: string; fallbackToOrders?: boolean }> {
  const rzp = getRazorpay();
  if (!rzp) return { error: "Razorpay not configured" };

  const { vendorId, vendorName, vendorEmail, vendorPhone, countryCode, planName, billingCycle } = params;
  const plan = planName === "business" ? "business" : "pro";

  // ── 1. Get pricing from DB ──
  const pricing = await getPricing(countryCode, plan, billingCycle);

  // ── 2. If no Razorpay Plan ID, fall back to Orders flow ──
  if (!pricing.razorpayPlanId) {
    logger.warn("subscription", "No Razorpay Plan ID — falling back to Orders", {
      vendorId, countryCode, plan, billingCycle,
    });
    return { error: "No Razorpay Plan ID configured — use Orders flow", fallbackToOrders: true };
  }

  // ── 3. Create/reuse a Razorpay Customer ──
  const customerResult = await ensureRazorpayCustomer({
    vendorId,
    vendorName,
    vendorEmail,
    vendorPhone,
  });

  if (customerResult.error || !customerResult.customerId) {
    return { error: customerResult.error || "Failed to create customer" };
  }

  const razorpayCustomerId = customerResult.customerId;

  // ── 4. Create the Razorpay Subscription ──
  // total_count: number of billing cycles. 120 monthly = 10 years, 10 yearly = 10 years.
  // This effectively means "indefinite" (like Netflix/Spotify) while satisfying
  // Razorpay's requirement for total_count OR expire_by.
  const totalCount = billingCycle === "yearly" ? 10 : 120;

  let subscription: any;
  try {
    // Note: customer_id is required by Razorpay's Subscriptions API but
    // the @types/razorpay definition may not include it. We cast to any
    // to avoid TypeScript errors while passing the correct payload.
    subscription = await rzp.subscriptions.create({
      plan_id: pricing.razorpayPlanId,
      total_count: totalCount,
      customer_id: razorpayCustomerId,
      customer_notify: 1,
      notes: {
        vendorId,
        vendorName,
        vendorEmail,
        platform: "FindMyBites",
        planName,
        billingCycle,
        countryCode,
        razorpayCustomerId,
      },
    } as any);

    if (!subscription?.id) {
      return { error: "Razorpay returned no subscription ID" };
    }

    logger.info("subscription", "Created Razorpay subscription", {
      vendorId,
      subscriptionId: subscription.id,
      customerId: razorpayCustomerId,
      planId: pricing.razorpayPlanId,
    });
  } catch (err: any) {
    const errMsg = err?.error?.description || err?.message || "Unknown Razorpay error";
    logger.error("subscription", "razorpay.subscriptions.create failed", { error: errMsg });
    return { error: errMsg };
  }

  // ── 5. Save a "pending" VendorSubscription row immediately ──
  // This ensures lifecycle webhooks (cancel, halt, complete) can always find
  // the subscription by providerSubscriptionId, even before the first charge.
  const now = new Date();
  const placeholderExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h placeholder

  let dbSubRow: any;
  try {
    // Check if a row already exists for this Razorpay subscription (idempotency)
    const existing = await db.vendorSubscription.findFirst({
      where: { providerSubscriptionId: subscription.id },
      select: { id: true },
    }).catch(() => null);

    if (existing) {
      dbSubRow = existing;
    } else {
      dbSubRow = await db.vendorSubscription.create({
        data: {
          vendorId,
          planName,
          planTier: plan,
          billingCycle,
          status: "pending",   // ← NEW status: created but not yet charged
          planStartedAt: now,
          planExpiresAt: placeholderExpiry,  // updated on activation
          nextRenewalDate: null,             // set on activation
          provider: "razorpay_subscriptions",
          providerSubscriptionId: subscription.id,
          razorpayCustomerId,                // ← NEW: save customer ID for reuse
          amountPaid: pricing.amountMinor,
          currency: pricing.currency,
        },
      });

      logger.info("subscription", "Saved pending VendorSubscription row", {
        dbSubId: dbSubRow.id,
        providerSubscriptionId: subscription.id,
      });
    }
  } catch (err: any) {
    // Non-fatal: the webhook can still activate by vendorId from notes
    logger.error("subscription", "Failed to save pending subscription row", {
      error: err.message,
      providerSubscriptionId: subscription.id,
    });
  }

  // ── 6. Return the subscription details ──
  return {
    subscriptionId: subscription.id,
    razorpaySubscriptionId: subscription.id,
    razorpayCustomerId,
    planId: pricing.razorpayPlanId,
    status: subscription.status,
    shortUrl: subscription.short_url,
    amount: pricing.amountMinor,
    currency: pricing.currency,
    provider: "razorpay_subscriptions",
    dbSubscriptionId: dbSubRow?.id || "",
  };
}

/**
 * Cancel a Razorpay Subscription.
 */
export async function cancelSubscription(
  razorpaySubscriptionId: string,
  cancelAtCycleEnd: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const rzp = getRazorpay();
  if (!rzp) return { success: false, error: "Razorpay not configured" };

  try {
    await rzp.subscriptions.cancel(razorpaySubscriptionId, cancelAtCycleEnd);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.error?.description || err?.message || "Unknown error" };
  }
}

/**
 * Pause a Razorpay Subscription (via notes update).
 */
export async function pauseSubscription(
  razorpaySubscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  const rzp = getRazorpay();
  if (!rzp) return { success: false, error: "Razorpay not configured" };

  try {
    await rzp.subscriptions.update(razorpaySubscriptionId, {
      notes: { paused: "true", pausedAt: new Date().toISOString() },
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.error?.description || err?.message || "Unknown error" };
  }
}

/**
 * Resume a paused Razorpay Subscription.
 */
export async function resumeSubscription(
  razorpaySubscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  const rzp = getRazorpay();
  if (!rzp) return { success: false, error: "Razorpay not configured" };

  try {
    await rzp.subscriptions.update(razorpaySubscriptionId, {
      notes: { paused: "false", resumedAt: new Date().toISOString() },
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.error?.description || err?.message || "Unknown error" };
  }
}

/**
 * Fetch subscription details from Razorpay.
 */
export async function fetchSubscriptionDetails(razorpaySubscriptionId: string): Promise<any | null> {
  const rzp = getRazorpay();
  if (!rzp) return null;

  try {
    return await rzp.subscriptions.fetch(razorpaySubscriptionId);
  } catch {
    return null;
  }
}

/**
 * Check if AutoPay is available for a vendor's country + plan + cycle.
 * Returns true only if a Razorpay Plan ID is configured in the DB.
 */
export async function isAutoPayAvailable(
  countryCode: string,
  planName: PlanName,
  billingCycle: BillingCycle
): Promise<boolean> {
  const plan = planName === "business" ? "business" : "pro";
  const pricing = await getPricing(countryCode, plan, billingCycle);
  return !!pricing.razorpayPlanId;
}

/**
 * Activate a subscription after webhook confirmation (subscription.charged).
 *
 * V7: Now passes providerSubscriptionId so activateSubscription() can find
 * the existing "pending" row and update it (instead of creating a duplicate).
 */
export async function activateSubscriptionFromWebhook(params: {
  vendorId: string;
  planName: PlanName;
  billingCycle: BillingCycle;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  providerSubscriptionId: string;  // ← NEW: Razorpay subscription ID
  razorpayCustomerId?: string;     // ← NEW: for customer reuse
}): Promise<{ subscription: any; paymentType: string; created: boolean }> {
  const result = await activateDbSub({
    vendorId: params.vendorId,
    planName: params.planName,
    billingCycle: params.billingCycle,
    orderId: params.orderId,
    paymentId: params.paymentId,
    signature: undefined,
    amount: params.amount,
    currency: params.currency,
    provider: "razorpay_subscriptions",
    paymentMethod: params.paymentMethod,
    providerSubscriptionId: params.providerSubscriptionId,  // ← passed through
    razorpayCustomerId: params.razorpayCustomerId,          // ← passed through
  });

  return {
    subscription: result.subscription,
    paymentType: result.paymentType,
    created: result.created,
  };
}
