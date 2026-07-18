/**
 * Billing Module — Permissions
 *
 * Server-side feature enforcement.
 * Every API that accesses premium features MUST call one of these functions.
 * Never trust the frontend for feature access.
 */

import { db } from "@/lib/db";
import { getActiveSubscription } from "@/lib/subscription/subscription-service";
import { getFeatureLimits, canAccess, getLimit } from "./features";
import { getTierFromPlanName } from "./plans";
import type { PlanTier, FeatureLimit } from "./types";

export interface VendorPlanInfo {
  tier: PlanTier;
  isActive: boolean;
  subscriptionId: string | null;
  planExpiresAt: Date | null;
  daysRemaining: number;
}

/**
 * Get the vendor's current plan tier from their active subscription.
 * Returns "free" if no active subscription.
 */
export async function getVendorPlan(vendorId: string): Promise<VendorPlanInfo> {
  const sub = await getActiveSubscription(vendorId);

  if (!sub || sub.isExpired || sub.status !== "active") {
    return {
      tier: "free",
      isActive: false,
      subscriptionId: sub?.subscriptionId ?? null,
      planExpiresAt: sub?.planExpiresAt ?? null,
      daysRemaining: sub?.daysRemaining ?? 0,
    };
  }

  return {
    tier: sub.planTier as PlanTier,
    isActive: true,
    subscriptionId: sub.subscriptionId,
    planExpiresAt: sub.planExpiresAt,
    daysRemaining: sub.daysRemaining,
  };
}

/**
 * Check if a vendor can access a specific feature.
 * Server-side only — never call from client components.
 */
export async function checkFeatureAccess(
  vendorId: string,
  feature: keyof FeatureLimit
): Promise<{ allowed: boolean; tier: PlanTier; limit?: number }> {
  const plan = await getVendorPlan(vendorId);
  const allowed = canAccess(plan.tier, feature);
  const limit = typeof getFeatureLimits(plan.tier)[feature] === "number"
    ? getLimit(plan.tier, feature)
    : undefined;
  return { allowed, tier: plan.tier, limit };
}

/**
 * Check if a vendor can create more products.
 * Throws if the limit is reached.
 */
export async function checkProductLimit(vendorId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const plan = await getVendorPlan(vendorId);
  const limit = getLimit(plan.tier, "maxProducts");
  const current = await db.product.count({ where: { vendorId } }).catch(() => 0);
  return { allowed: current < limit, current, limit };
}

/**
 * Check if a vendor can upload more gallery images.
 */
export async function checkGalleryLimit(vendorId: string, currentCount: number): Promise<{ allowed: boolean; current: number; limit: number }> {
  const plan = await getVendorPlan(vendorId);
  const limit = getLimit(plan.tier, "maxGalleryImages");
  return { allowed: currentCount < limit, current: currentCount, limit };
}

/**
 * Check if a vendor can use AI tools.
 */
export async function checkAiAccess(vendorId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const plan = await getVendorPlan(vendorId);
  const allowed = canAccess(plan.tier, "aiTools");
  const limit = getLimit(plan.tier, "maxAiRequestsPerDay");
  // Actual rate limiting is handled by the AI rate limiter
  return { allowed, remaining: limit, limit };
}

/**
 * Check if a vendor can access analytics.
 */
export async function checkAnalyticsAccess(vendorId: string): Promise<boolean> {
  const plan = await getVendorPlan(vendorId);
  return canAccess(plan.tier, "analytics");
}

/**
 * Check if a vendor can access marketing tools.
 */
export async function checkMarketingAccess(vendorId: string): Promise<boolean> {
  const plan = await getVendorPlan(vendorId);
  return canAccess(plan.tier, "marketingTools");
}

/**
 * Check if a vendor has the verified badge.
 */
export async function checkVerifiedBadge(vendorId: string): Promise<boolean> {
  const plan = await getVendorPlan(vendorId);
  return canAccess(plan.tier, "verifiedBadge");
}

/**
 * Check if a vendor can upload videos.
 */
export async function checkVideoUploadAccess(vendorId: string): Promise<boolean> {
  const plan = await getVendorPlan(vendorId);
  return canAccess(plan.tier, "videoUpload");
}
