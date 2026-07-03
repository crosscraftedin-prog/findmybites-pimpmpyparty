/**
 * Ranking Algorithm — Weighted vendor ranking for marketplace search.
 * Factors: subscription tier, verified, rating, reviews, completion,
 * response rate, booking completion, popularity, freshness.
 */

export interface RankingFactors {
  subscriptionTier: "free" | "pro" | "business";
  verified: boolean;
  featured: boolean;
  rating: number;
  reviewCount: number;
  profileCompletion: number;
  responseRate: number;
  bookingCompletion: number;
  views: number;
  recentActivity: number;
  yearsActive: number;
}

const WEIGHTS = {
  subscriptionTier: 25, verified: 15, featured: 20, rating: 15,
  reviewCount: 10, profileCompletion: 10, responseRate: 5,
  bookingCompletion: 5, views: 5, recentActivity: 5, yearsActive: 5,
};

export function calculateRankingScore(f: RankingFactors): number {
  let s = 0;
  s += f.subscriptionTier === "business" ? WEIGHTS.subscriptionTier : f.subscriptionTier === "pro" ? WEIGHTS.subscriptionTier * 0.6 : WEIGHTS.subscriptionTier * 0.2;
  if (f.verified) s += WEIGHTS.verified;
  if (f.featured) s += WEIGHTS.featured;
  s += (f.rating / 5) * WEIGHTS.rating;
  s += Math.min(1, Math.log10(f.reviewCount + 1) / 2) * WEIGHTS.reviewCount;
  s += (f.profileCompletion / 100) * WEIGHTS.profileCompletion;
  s += (f.responseRate / 100) * WEIGHTS.responseRate;
  s += Math.min(1, f.bookingCompletion / 50) * WEIGHTS.bookingCompletion;
  s += Math.min(1, Math.log10(f.views + 1) / 4) * WEIGHTS.views;
  s += f.recentActivity * WEIGHTS.recentActivity;
  s += Math.min(1, f.yearsActive / 5) * WEIGHTS.yearsActive;
  return Math.round(Math.min(s, 100));
}

export function rankVendors<T extends { _rankingScore?: number; rating?: number }>(vendors: T[]): T[] {
  return vendors.sort((a, b) => {
    const d = (b._rankingScore ?? 0) - (a._rankingScore ?? 0);
    return d !== 0 ? d : (b.rating ?? 0) - (a.rating ?? 0);
  });
}

export const PLAN_LIMITS = {
  free: { maxProducts: 5, maxGalleryImages: 6, featuredProducts: 0, analytics: false, aiTools: false, prioritySearch: false, verifiedBadge: false, marketingTools: false },
  pro: { maxProducts: 100, maxGalleryImages: 20, featuredProducts: 10, analytics: true, aiTools: true, prioritySearch: true, verifiedBadge: false, marketingTools: true },
  business: { maxProducts: Infinity, maxGalleryImages: Infinity, featuredProducts: Infinity, analytics: true, aiTools: true, prioritySearch: true, verifiedBadge: true, marketingTools: true },
} as const;

export type PlanTier = keyof typeof PLAN_LIMITS;

export function canAccess(plan: PlanTier, feature: keyof typeof PLAN_LIMITS.free): boolean {
  return PLAN_LIMITS[plan][feature] !== false && PLAN_LIMITS[plan][feature] !== 0;
}

export function getLimit(plan: PlanTier, feature: keyof typeof PLAN_LIMITS.free): number {
  return PLAN_LIMITS[plan][feature] as number;
}
