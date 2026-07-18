/**
 * V7: Shared plan-tier resolver for API routes.
 *
 * This module provides a single function that fetches a vendor's active
 * VendorSubscription and returns the authoritative plan tier + status.
 *
 * WHY THIS EXISTS:
 *   Previously, plan tier was inferred from Vendor.featured / Vendor.verified
 *   booleans. This was incorrect because activateSubscription() sets
 *   featured=true for BOTH "vendor-pro" AND "business", making the two
 *   indistinguishable. The admin dashboard showed "Business" for Baker Pro
 *   vendors.
 *
 *   Now, the plan tier comes ONLY from VendorSubscription.planTier, which is
 *   set explicitly during activation and is never ambiguous.
 *
 * Usage (in API routes):
 *   const planInfo = await resolveVendorPlan(vendorId);
 *   // planInfo.planTier: "free" | "pro" | "business"
 *   // planInfo.planName: "vendor-pro" | "business" | null
 *   // planInfo.subscriptionStatus: "active" | "expired" | ... | null
 *   // planInfo.planExpiresAt: Date | null
 */

import { db } from "@/lib/db";
import { getActiveSubscription } from "@/lib/subscription/subscription-service";

export interface VendorPlanInfo {
  /** "free" | "pro" | "business" — the authoritative plan tier */
  planTier: "free" | "pro" | "business";
  /** "vendor-pro" | "business" | null — the internal plan name */
  planName: string | null;
  /** "active" | "expired" | "cancelled" | "past_due" | "pending" | null */
  subscriptionStatus: string | null;
  /** When the current billing cycle ends (ISO Date or null) */
  planExpiresAt: Date | null;
}

const FREE_PLAN: VendorPlanInfo = {
  planTier: "free",
  planName: null,
  subscriptionStatus: null,
  planExpiresAt: null,
};

/**
 * Resolve a single vendor's plan tier from their active VendorSubscription.
 *
 * Falls back to "free" if:
 *   - No VendorSubscription row exists
 *   - The subscription is expired, cancelled, or past_due
 *   - The subscription is still "pending" (not yet charged)
 *
 * This function reads from VendorSubscription ONLY — it never inspects
 * Vendor.featured or Vendor.verified for billing state.
 */
export async function resolveVendorPlan(vendorId: string): Promise<VendorPlanInfo> {
  try {
    const sub = await getActiveSubscription(vendorId);

    if (!sub || sub.isExpired || sub.status !== "active") {
      return FREE_PLAN;
    }

    return {
      planTier: sub.planTier as "free" | "pro" | "business",
      planName: sub.planName,
      subscriptionStatus: sub.status,
      planExpiresAt: sub.planExpiresAt,
    };
  } catch {
    return FREE_PLAN;
  }
}

/**
 * Batch-resolve plan tiers for multiple vendors.
 *
 * More efficient than calling resolveVendorPlan() in a loop because it
 * fetches all active subscriptions in a single query.
 *
 * Returns a Map<vendorId, VendorPlanInfo> for O(1) lookups.
 */
export async function resolveVendorPlansBatch(
  vendorIds: string[]
): Promise<Map<string, VendorPlanInfo>> {
  const result = new Map<string, VendorPlanInfo>();

  if (vendorIds.length === 0) return result;

  try {
    // Fetch the latest subscription for each vendor (active or otherwise).
    // We order by planExpiresAt desc so the most recent subscription wins.
    const subs = await db.vendorSubscription.findMany({
      where: { vendorId: { in: vendorIds } },
      orderBy: [{ vendorId: "asc" }, { planExpiresAt: "desc" }],
    });

    // Keep only the latest subscription per vendor
    const latestByVendor = new Map<string, (typeof subs)[number]>();
    for (const sub of subs) {
      if (!latestByVendor.has(sub.vendorId)) {
        latestByVendor.set(sub.vendorId, sub);
      }
    }

    const now = new Date();
    for (const vendorId of vendorIds) {
      const sub = latestByVendor.get(vendorId);
      if (!sub || sub.status !== "active" || sub.planExpiresAt < now) {
        result.set(vendorId, FREE_PLAN);
      } else {
        result.set(vendorId, {
          planTier: sub.planTier as "free" | "pro" | "business",
          planName: sub.planName,
          subscriptionStatus: sub.status,
          planExpiresAt: sub.planExpiresAt,
        });
      }
    }
  } catch {
    // On any error, default all to free
    for (const vendorId of vendorIds) {
      result.set(vendorId, FREE_PLAN);
    }
  }

  return result;
}
