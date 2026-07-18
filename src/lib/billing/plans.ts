/**
 * Billing Module — Plans
 *
 * Plan definitions (Free / Pro / Business).
 * These are the ONLY plans that exist. No Starter, Premium, Elite, or Enterprise.
 */

import type { PlanTier, PlanName, BillingCycle } from "./types";

export const PLAN_TIERS: PlanTier[] = ["free", "pro", "business"];
export const PLAN_NAMES: PlanName[] = ["vendor-pro", "business"];

export const PLAN_DISPLAY_NAMES: Record<PlanTier, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
};

export const PLAN_DESCRIPTIONS: Record<PlanTier, string> = {
  free: "Get started with a basic listing",
  pro: "Grow your business with premium features",
  business: "Maximize your reach with all features unlocked",
};

export const PLAN_NAME_TO_TIER: Record<PlanName, PlanTier> = {
  "vendor-pro": "pro",
  "business": "business",
};

export const TIER_TO_PLAN_NAME: Record<Exclude<PlanTier, "free">, PlanName> = {
  pro: "vendor-pro",
  business: "business",
};

export const BILLING_CYCLE_DAYS: Record<BillingCycle, number> = {
  monthly: 30,
  yearly: 365,
};

export function getTierFromPlanName(planName: PlanName): PlanTier {
  return PLAN_NAME_TO_TIER[planName];
}

export function getPlanNameFromTier(tier: Exclude<PlanTier, "free">): PlanName {
  return TIER_TO_PLAN_NAME[tier];
}

export function getDisplayName(tier: PlanTier): string {
  return PLAN_DISPLAY_NAMES[tier];
}

export function isValidPlanTier(tier: string): tier is PlanTier {
  return PLAN_TIERS.includes(tier as PlanTier);
}

export function isValidPlanName(name: string): name is PlanName {
  return PLAN_NAMES.includes(name as PlanName);
}

export function isValidBillingCycle(cycle: string): cycle is BillingCycle {
  return cycle === "monthly" || cycle === "yearly";
}
