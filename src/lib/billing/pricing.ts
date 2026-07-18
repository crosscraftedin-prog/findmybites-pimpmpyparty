/**
 * Billing Module — Pricing (Database-Driven)
 *
 * All pricing comes from the PricingPlan database table.
 * No hardcoded pricing anywhere else.
 *
 * If a country is not configured, falls back to USD pricing.
 * Never fails checkout — always returns a valid price.
 */

import { db } from "@/lib/db";
import { FALLBACK_COUNTRY, getCountryInfo } from "./countries";
import { toMinorUnits } from "./currency";
import type { PlanPricingInfo } from "./types";

// ── In-memory cache (30-second TTL to avoid DB hit on every request) ──────

let _cache: { data: Map<string, any>; expiry: number } | null = null;
const CACHE_TTL_MS = 30_000;

async function getCachedPricingPlans(): Promise<Map<string, any>> {
  const now = Date.now();
  if (_cache && _cache.expiry > now) {
    return _cache.data;
  }

  const plans = await db.pricingPlan.findMany({
    where: { active: true },
  }).catch(() => []);

  const map = new Map<string, any>();
  for (const plan of plans) {
    const key = `${plan.countryCode}_${plan.plan}_${plan.billingCycle}`;
    map.set(key, plan);
  }

  _cache = { data: map, expiry: now + CACHE_TTL_MS };
  return map;
}

/**
 * Invalidate the pricing cache (call after admin edits pricing).
 */
export function invalidatePricingCache(): void {
  _cache = null;
}

/**
 * Get pricing for a specific country + plan + billing cycle.
 * Falls back to USD if the country is not configured.
 * Falls back to hardcoded fallback if DB is empty (first-run).
 */
export async function getPricing(
  countryCode: string,
  plan: "pro" | "business",
  billingCycle: "monthly" | "yearly"
): Promise<PlanPricingInfo> {
  const cache = await getCachedPricingPlans();

  // Try exact country match
  let record = cache.get(`${countryCode}_${plan}_${billingCycle}`);

  // Fallback to USD
  if (!record) {
    record = cache.get(`${FALLBACK_COUNTRY}_${plan}_${billingCycle}`);
  }

  // Fallback to hardcoded (first-run before DB is seeded)
  if (!record) {
    return getFallbackPricing(countryCode, plan, billingCycle);
  }

  return {
    displayPrice: record.displayPrice,
    amountMinor: record.amountMinor,
    currency: record.currency,
    currencySymbol: record.currencySymbol,
    countryName: record.countryName,
    razorpayPlanId: record.razorpayPlanId,
    isAutoPay: !!record.razorpayPlanId,
  };
}

/**
 * Get all pricing for a country (both plans, both cycles).
 */
export async function getPricingForCountry(countryCode: string): Promise<{
  symbol: string;
  currency: string;
  pro: { monthly: number; yearly: number };
  business: { monthly: number; yearly: number };
  label: string;
}> {
  const [proMonthly, proYearly, businessMonthly, businessYearly] = await Promise.all([
    getPricing(countryCode, "pro", "monthly"),
    getPricing(countryCode, "pro", "yearly"),
    getPricing(countryCode, "business", "monthly"),
    getPricing(countryCode, "business", "yearly"),
  ]);

  const country = getCountryInfo(countryCode);

  return {
    symbol: proMonthly.currencySymbol,
    currency: proMonthly.currency,
    pro: { monthly: proMonthly.displayPrice, yearly: proYearly.displayPrice },
    business: { monthly: businessMonthly.displayPrice, yearly: businessYearly.displayPrice },
    label: `${country.name} — prices in ${proMonthly.currencySymbol}`,
  };
}

/**
 * Get all active pricing plans from the database (for admin panel).
 */
export async function getAllPricingPlans(): Promise<any[]> {
  return db.pricingPlan.findMany({
    where: { active: true },
    orderBy: [{ countryCode: "asc" }, { plan: "asc" }, { billingCycle: "asc" }],
  }).catch(() => []);
}

/**
 * Create or update a pricing plan (admin only).
 */
export async function upsertPricingPlan(params: {
  countryCode: string;
  countryName: string;
  currency: string;
  currencySymbol: string;
  plan: "pro" | "business";
  billingCycle: "monthly" | "yearly";
  displayPrice: number;
  razorpayPlanId?: string | null;
  active?: boolean;
}): Promise<void> {
  const amountMinor = toMinorUnits(params.displayPrice);
  await db.pricingPlan.upsert({
    where: {
      countryCode_plan_billingCycle: {
        countryCode: params.countryCode,
        plan: params.plan,
        billingCycle: params.billingCycle,
      },
    },
    create: {
      countryCode: params.countryCode,
      countryName: params.countryName,
      currency: params.currency,
      currencySymbol: params.currencySymbol,
      plan: params.plan,
      billingCycle: params.billingCycle,
      displayPrice: params.displayPrice,
      amountMinor,
      razorpayPlanId: params.razorpayPlanId ?? null,
      active: params.active ?? true,
    },
    update: {
      countryName: params.countryName,
      currency: params.currency,
      currencySymbol: params.currencySymbol,
      displayPrice: params.displayPrice,
      amountMinor,
      razorpayPlanId: params.razorpayPlanId ?? null,
      active: params.active ?? true,
    },
  });
  invalidatePricingCache();
}

// ── Fallback pricing (used when DB is empty — first run before seeding) ───

const FALLBACK_PRICES: Record<string, Record<string, { monthly: number; yearly: number }>> = {
  IN: { pro: { monthly: 299, yearly: 2870 }, business: { monthly: 499, yearly: 4790 } },
  US: { pro: { monthly: 5, yearly: 48 }, business: { monthly: 9, yearly: 86 } },
  GB: { pro: { monthly: 4, yearly: 38 }, business: { monthly: 7, yearly: 67 } },
  AE: { pro: { monthly: 18, yearly: 173 }, business: { monthly: 33, yearly: 317 } },
  AU: { pro: { monthly: 8, yearly: 77 }, business: { monthly: 13, yearly: 125 } },
  SG: { pro: { monthly: 7, yearly: 67 }, business: { monthly: 12, yearly: 115 } },
  CA: { pro: { monthly: 7, yearly: 67 }, business: { monthly: 12, yearly: 115 } },
  NG: { pro: { monthly: 2000, yearly: 19200 }, business: { monthly: 3500, yearly: 33600 } },
  ZA: { pro: { monthly: 90, yearly: 864 }, business: { monthly: 160, yearly: 1536 } },
};

function getFallbackPricing(
  countryCode: string,
  plan: "pro" | "business",
  billingCycle: "monthly" | "yearly"
): PlanPricingInfo {
  const country = getCountryInfo(countryCode);
  const countryPrices = FALLBACK_PRICES[countryCode] || FALLBACK_PRICES[FALLBACK_COUNTRY];
  const price = countryPrices[plan][billingCycle];

  return {
    displayPrice: price,
    amountMinor: toMinorUnits(price),
    currency: country.currency,
    currencySymbol: country.currencySymbol,
    countryName: country.name,
    razorpayPlanId: null, // No Plan ID in fallback — uses Orders flow
    isAutoPay: false,
  };
}
