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
 * V7.1 PATCH (this file only):
 *   The Prisma queries now filter `status = "active"` AND `planExpiresAt > now`
 *   at the DATABASE level. Previously these filters were applied in JavaScript
 *   after fetching all rows, which caused a bug where a cancelled subscription
 *   with a future planExpiresAt could be selected over an active subscription
 *   with an earlier planExpiresAt (because the query ordered by
 *   planExpiresAt desc and deduplicated in JS).
 *
 *   Now the DB returns ONLY active, non-expired rows. The JS checks remain
 *   as defense-in-depth but will never encounter a cancelled/expired row.
 *
 * Usage (in API routes):
 *   const planInfo = await resolveVendorPlan(vendorId);
 *   // planInfo.planTier: "free" | "pro" | "business"
 *   // planInfo.planName: "vendor-pro" | "business" | null
 *   // planInfo.subscriptionStatus: "active" | "expired" | ... | null
 *   // planInfo.planExpiresAt: Date | null
 */

import { db } from "@/lib/db";

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
 * The Prisma query filters at the DATABASE level:
 *   - status = "active"    (excludes expired, cancelled, past_due, pending)
 *   - planExpiresAt > now  (excludes time-expired active subscriptions)
 *
 * Falls back to "free" if:
 *   - No VendorSubscription row matches (no active subscription)
 *   - The query throws (DB error → graceful degradation)
 *
 * This function reads from VendorSubscription ONLY — it never inspects
 * Vendor.featured or Vendor.verified for billing state.
 */
export async function resolveVendorPlan(vendorId: string): Promise<VendorPlanInfo> {
  try {
    const now = new Date();

    // ── DB-level filter: ONLY active + non-expired subscriptions ──
    const sub = await db.vendorSubscription.findFirst({
      where: {
        vendorId,
        status: "active",
        planExpiresAt: { gt: now },
      },
      orderBy: { planExpiresAt: "desc" },
    });

    // ── Defense-in-depth: re-verify in JS (should always pass) ──
    if (!sub || sub.status !== "active" || sub.planExpiresAt < now) {
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
 * The Prisma query filters at the DATABASE level:
 *   - status = "active"    (excludes expired, cancelled, past_due, pending)
 *   - planExpiresAt > now  (excludes time-expired active subscriptions)
 *
 * Because the DB only returns active rows, the deduplication by
 * planExpiresAt desc will always select an active subscription — never a
 * cancelled or expired one. This fixes the edge case where a cancelled
 * subscription with a future planExpiresAt was preferred over an active
 * subscription with an earlier planExpiresAt.
 *
 * Returns a Map<vendorId, VendorPlanInfo> for O(1) lookups.
 */
export async function resolveVendorPlansBatch(
  vendorIds: string[]
): Promise<Map<string, VendorPlanInfo>> {
  const result = new Map<string, VendorPlanInfo>();

  if (vendorIds.length === 0) return result;

  try {
    const now = new Date();

    // ── DB-level filter: ONLY active + non-expired subscriptions ──
    const subs = await db.vendorSubscription.findMany({
      where: {
        vendorId: { in: vendorIds },
        status: "active",
        planExpiresAt: { gt: now },
      },
      orderBy: [{ vendorId: "asc" }, { planExpiresAt: "desc" }],
    });

    // Keep only the latest active subscription per vendor
    // (if a vendor somehow has two active rows, the one with the latest
    //  planExpiresAt wins — this is the longest-running active subscription)
    const latestByVendor = new Map<string, (typeof subs)[number]>();
    for (const sub of subs) {
      if (!latestByVendor.has(sub.vendorId)) {
        latestByVendor.set(sub.vendorId, sub);
      }
    }

    // ── Defense-in-depth: re-verify in JS (should always pass) ──
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
