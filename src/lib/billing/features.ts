/**
 * Billing Module — Feature Configuration
 *
 * Central definition of what each plan tier can access.
 * Every API must check this configuration server-side via permissions.ts.
 *
 * This is the SINGLE source of truth for feature limits.
 * No other file should define plan features.
 */

import type { PlanTier, FeatureLimit } from "./types";

export const PLAN_FEATURES: Record<PlanTier, FeatureLimit> = {
  free: {
    maxProducts: 5,
    maxGalleryImages: 6,
    maxFeaturedProducts: 0,
    maxAiRequestsPerDay: 5,
    analytics: false,
    aiTools: false,
    prioritySearch: false,
    verifiedBadge: false,
    marketingTools: false,
    homepagePromotion: false,
    videoUpload: false,
    leads: false,
    reviews: true,
    businessFeatures: false,
    advancedAnalytics: false,
    unlimitedGallery: false,
  },
  pro: {
    maxProducts: 100,
    maxGalleryImages: 20,
    maxFeaturedProducts: 10,
    maxAiRequestsPerDay: 50,
    analytics: true,
    aiTools: true,
    prioritySearch: true,
    verifiedBadge: false,
    marketingTools: true,
    homepagePromotion: true,
    videoUpload: false,
    leads: true,
    reviews: true,
    businessFeatures: false,
    advancedAnalytics: true,
    unlimitedGallery: false,
  },
  business: {
    maxProducts: Infinity,
    maxGalleryImages: Infinity,
    maxFeaturedProducts: Infinity,
    maxAiRequestsPerDay: 200,
    analytics: true,
    aiTools: true,
    prioritySearch: true,
    verifiedBadge: true,
    marketingTools: true,
    homepagePromotion: true,
    videoUpload: true,
    leads: true,
    reviews: true,
    businessFeatures: true,
    advancedAnalytics: true,
    unlimitedGallery: true,
  },
};

export function getFeatureLimits(tier: PlanTier): FeatureLimit {
  return PLAN_FEATURES[tier];
}

export function canAccess(tier: PlanTier, feature: keyof FeatureLimit): boolean {
  const limits = PLAN_FEATURES[tier];
  const value = limits[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  return false;
}

export function getLimit(tier: PlanTier, feature: keyof FeatureLimit): number {
  return PLAN_FEATURES[tier][feature] as number;
}
