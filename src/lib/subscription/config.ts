/**
 * Subscription System V2 — Central Configuration
 *
 * This is the SINGLE source of truth for:
 * - Plan definitions (Free / Pro / Business)
 * - Pricing by country (9 countries)
 * - Feature limits per plan tier
 * - Razorpay Plan ID mapping
 *
 * No other file should hardcode plan amounts, feature limits, or pricing.
 * All subscription-related code must import from this file.
 *
 * ── Razorpay Plan IDs ──
 * Plan IDs are set via environment variables (one per country+plan+cycle).
 * In development/testing, they fall back to empty strings and the system
 * uses the legacy Orders flow automatically.
 *
 * To configure for production:
 * 1. Create Razorpay Plan objects via the Razorpay Dashboard or API
 * 2. Set the environment variables (see PLAN_ID_ENV_VARS below)
 * 3. The system automatically uses Subscriptions API when Plan IDs are present
 */

// ── Types ────────────────────────────────────────────────────────────────

export type PlanTier = "free" | "pro" | "business";
export type PlanName = "vendor-pro" | "business";
export type BillingCycle = "monthly" | "yearly";

export interface PlanPricing {
  /** Monthly price in the country's currency (main unit, e.g. 299 for ₹299) */
  monthly: number;
  /** Yearly total in the country's currency (main unit, ~20% off 12×monthly) */
  yearly: number;
  /** Currency symbol for display */
  symbol: string;
  /** ISO 4217 currency code */
  currency: string;
  /** Human-readable label */
  label: string;
  /** Optional note shown in the pricing card */
  note?: string;
}

export interface CountryPricing {
  symbol: string;
  currency: string;
  pro: { monthly: number; yearly: number };
  business: { monthly: number; yearly: number };
  label: string;
  note?: string;
}

export interface FeatureLimit {
  maxProducts: number;
  maxGalleryImages: number;
  maxFeaturedProducts: number;
  maxAiRequestsPerDay: number;
  analytics: boolean;
  aiTools: boolean;
  prioritySearch: boolean;
  verifiedBadge: boolean;
  marketingTools: boolean;
  homepagePromotion: boolean;
  videoUpload: boolean;
  leads: boolean;
  reviews: boolean;
  businessFeatures: boolean;
  advancedAnalytics: boolean;
  unlimitedGallery: boolean;
}

export interface PlanDefinition {
  tier: PlanTier;
  planName: PlanName | null; // null for free
  displayName: string;
  description: string;
  features: string[];
  limits: FeatureLimit;
}

// ── Country Pricing Configuration ────────────────────────────────────────
//
// This is the fallback pricing. The database `Pricing` model can override
// these at runtime (admin-managed). The SubscriptionModal fetches from
// /api/pricing and falls back to this table.

export const PRICING_BY_COUNTRY: Record<string, CountryPricing> = {
  IN: {
    symbol: "₹",
    currency: "INR",
    pro: { monthly: 299, yearly: 2870 },
    business: { monthly: 499, yearly: 4790 },
    label: "India — prices in ₹",
    note: "Prices in Indian Rupees. No transaction fees. Cancel anytime.",
  },
  US: {
    symbol: "$",
    currency: "USD",
    pro: { monthly: 5, yearly: 48 },
    business: { monthly: 9, yearly: 86 },
    label: "United States — prices in $",
    note: "Prices in USD. No transaction fees. Cancel anytime.",
  },
  GB: {
    symbol: "£",
    currency: "GBP",
    pro: { monthly: 4, yearly: 38 },
    business: { monthly: 7, yearly: 67 },
    label: "United Kingdom — prices in £",
    note: "Prices in GBP. No transaction fees. Cancel anytime.",
  },
  AU: {
    symbol: "A$",
    currency: "AUD",
    pro: { monthly: 8, yearly: 77 },
    business: { monthly: 13, yearly: 125 },
    label: "Australia — prices in A$",
    note: "Prices in AUD. No transaction fees. Cancel anytime.",
  },
  AE: {
    symbol: "AED",
    currency: "AED",
    pro: { monthly: 18, yearly: 173 },
    business: { monthly: 33, yearly: 317 },
    label: "UAE — prices in AED",
    note: "Prices in AED. No transaction fees. Cancel anytime.",
  },
  SG: {
    symbol: "S$",
    currency: "SGD",
    pro: { monthly: 7, yearly: 67 },
    business: { monthly: 12, yearly: 115 },
    label: "Singapore — prices in S$",
    note: "Prices in SGD. No transaction fees. Cancel anytime.",
  },
  NG: {
    symbol: "₦",
    currency: "NGN",
    pro: { monthly: 2000, yearly: 19200 },
    business: { monthly: 3500, yearly: 33600 },
    label: "Nigeria — prices in ₦",
    note: "Prices in NGN. No transaction fees. Cancel anytime.",
  },
  CA: {
    symbol: "CA$",
    currency: "CAD",
    pro: { monthly: 7, yearly: 67 },
    business: { monthly: 12, yearly: 115 },
    label: "Canada — prices in CA$",
    note: "Prices in CAD. No transaction fees. Cancel anytime.",
  },
  ZA: {
    symbol: "R",
    currency: "ZAR",
    pro: { monthly: 90, yearly: 864 },
    business: { monthly: 160, yearly: 1536 },
    label: "South Africa — prices in R",
    note: "Prices in ZAR. No transaction fees. Cancel anytime.",
  },
};

export const FALLBACK_COUNTRY = "US";
export const FALLBACK_PRICING = PRICING_BY_COUNTRY[FALLBACK_COUNTRY];

// ── Plan Definitions ─────────────────────────────────────────────────────

export const PLAN_DEFINITIONS: Record<PlanTier, PlanDefinition> = {
  free: {
    tier: "free",
    planName: null,
    displayName: "Free",
    description: "Get started with a basic listing",
    features: [
      "Basic listing (name, city, category)",
      "WhatsApp booking link",
      "Up to 5 products",
      "Up to 6 gallery photos",
      "Customer reviews",
    ],
    limits: {
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
  },
  pro: {
    tier: "pro",
    planName: "vendor-pro",
    displayName: "Pro",
    description: "Grow your business with premium features",
    features: [
      "Everything in Free",
      "Up to 100 products",
      "Up to 20 gallery photos",
      "Basic analytics dashboard",
      "Customer reviews enabled",
      "AI-powered suggestions",
      "Marketing tools",
      "Priority search placement",
      "Curated leads (food vendors)",
    ],
    limits: {
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
  },
  business: {
    tier: "business",
    planName: "business",
    displayName: "Business",
    description: "Maximize your reach with all features unlocked",
    features: [
      "Everything in Pro",
      "Unlimited products",
      "Unlimited gallery photos",
      "Advanced analytics",
      "Verified badge",
      "Homepage spotlight feature",
      "Ad banner slot access",
      "Video upload support",
      "Priority support",
    ],
    limits: {
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
  },
};

// ── Razorpay Plan ID Mapping ─────────────────────────────────────────────
//
// Razorpay Plan IDs are stored in environment variables.
// Format: RAZORPAY_PLAN_{COUNTRY}_{PLAN}_{CYCLE}
// Example: RAZORPAY_PLAN_IN_PRO_MONTHLY
//
// When a Plan ID is configured, the system creates a Razorpay Subscription
// (auto-renewal). When not configured, it falls back to the legacy Orders
// flow (one-time payment, manual renewal).

const PLAN_ID_ENV_VARS: Record<string, string> = {
  // India
  "IN-pro-monthly": "RAZORPAY_PLAN_IN_PRO_MONTHLY",
  "IN-pro-yearly": "RAZORPAY_PLAN_IN_PRO_YEARLY",
  "IN-business-monthly": "RAZORPAY_PLAN_IN_BUSINESS_MONTHLY",
  "IN-business-yearly": "RAZORPAY_PLAN_IN_BUSINESS_YEARLY",
  // USA
  "US-pro-monthly": "RAZORPAY_PLAN_US_PRO_MONTHLY",
  "US-pro-yearly": "RAZORPAY_PLAN_US_PRO_YEARLY",
  "US-business-monthly": "RAZORPAY_PLAN_US_BUSINESS_MONTHLY",
  "US-business-yearly": "RAZORPAY_PLAN_US_BUSINESS_YEARLY",
  // UK
  "GB-pro-monthly": "RAZORPAY_PLAN_GB_PRO_MONTHLY",
  "GB-pro-yearly": "RAZORPAY_PLAN_GB_PRO_YEARLY",
  "GB-business-monthly": "RAZORPAY_PLAN_GB_BUSINESS_MONTHLY",
  "GB-business-yearly": "RAZORPAY_PLAN_GB_BUSINESS_YEARLY",
  // UAE
  "AE-pro-monthly": "RAZORPAY_PLAN_AE_PRO_MONTHLY",
  "AE-pro-yearly": "RAZORPAY_PLAN_AE_PRO_YEARLY",
  "AE-business-monthly": "RAZORPAY_PLAN_AE_BUSINESS_MONTHLY",
  "AE-business-yearly": "RAZORPAY_PLAN_AE_BUSINESS_YEARLY",
  // Australia
  "AU-pro-monthly": "RAZORPAY_PLAN_AU_PRO_MONTHLY",
  "AU-pro-yearly": "RAZORPAY_PLAN_AU_PRO_YEARLY",
  "AU-business-monthly": "RAZORPAY_PLAN_AU_BUSINESS_MONTHLY",
  "AU-business-yearly": "RAZORPAY_PLAN_AU_BUSINESS_YEARLY",
  // Singapore
  "SG-pro-monthly": "RAZORPAY_PLAN_SG_PRO_MONTHLY",
  "SG-pro-yearly": "RAZORPAY_PLAN_SG_PRO_YEARLY",
  "SG-business-monthly": "RAZORPAY_PLAN_SG_BUSINESS_MONTHLY",
  "SG-business-yearly": "RAZORPAY_PLAN_SG_BUSINESS_YEARLY",
  // Nigeria
  "NG-pro-monthly": "RAZORPAY_PLAN_NG_PRO_MONTHLY",
  "NG-pro-yearly": "RAZORPAY_PLAN_NG_PRO_YEARLY",
  "NG-business-monthly": "RAZORPAY_PLAN_NG_BUSINESS_MONTHLY",
  "NG-business-yearly": "RAZORPAY_PLAN_NG_BUSINESS_YEARLY",
  // Canada
  "CA-pro-monthly": "RAZORPAY_PLAN_CA_PRO_MONTHLY",
  "CA-pro-yearly": "RAZORPAY_PLAN_CA_PRO_YEARLY",
  "CA-business-monthly": "RAZORPAY_PLAN_CA_BUSINESS_MONTHLY",
  "CA-business-yearly": "RAZORPAY_PLAN_CA_BUSINESS_YEARLY",
  // South Africa
  "ZA-pro-monthly": "RAZORPAY_PLAN_ZA_PRO_MONTHLY",
  "ZA-pro-yearly": "RAZORPAY_PLAN_ZA_PRO_YEARLY",
  "ZA-business-monthly": "RAZORPAY_PLAN_ZA_BUSINESS_MONTHLY",
  "ZA-business-yearly": "RAZORPAY_PLAN_ZA_BUSINESS_YEARLY",
};

/**
 * Get the Razorpay Plan ID for a given country + plan + billing cycle.
 * Returns null if not configured (system falls back to Orders flow).
 */
export function getRazorpayPlanId(
  countryCode: string,
  plan: "pro" | "business",
  cycle: "monthly" | "yearly"
): string | null {
  const key = `${countryCode}-${plan}-${cycle}`;
  const envVar = PLAN_ID_ENV_VARS[key];
  if (!envVar) return null;
  const planId = process.env[envVar];
  return planId || null;
}

/**
 * Check if Razorpay Subscriptions (AutoPay) are available for a given
 * country + plan + cycle. If not, the system uses the legacy Orders flow.
 */
export function isSubscriptionAvailable(
  countryCode: string,
  plan: "pro" | "business",
  cycle: "monthly" | "yearly"
): boolean {
  return !!getRazorpayPlanId(countryCode, plan, cycle);
}

// ── Helper Functions ─────────────────────────────────────────────────────

/**
 * Get pricing for a specific country. Falls back to US pricing if the
 * country is not configured.
 */
export function getPricingForCountry(countryCode: string): CountryPricing {
  return PRICING_BY_COUNTRY[countryCode] ?? FALLBACK_PRICING;
}

/**
 * Get the display price for a plan + billing cycle in a specific country.
 */
export function getDisplayPrice(
  countryCode: string,
  plan: "pro" | "business",
  cycle: "monthly" | "yearly"
): { amount: number; symbol: string; currency: string; label: string } {
  const pricing = getPricingForCountry(countryCode);
  const amount = pricing[plan][cycle];
  return {
    amount,
    symbol: pricing.symbol,
    currency: pricing.currency,
    label: pricing.label,
  };
}

/**
 * Get the amount in smallest currency unit (paise/cents/fils) for Razorpay.
 */
export function getRazorpayAmount(
  countryCode: string,
  plan: "pro" | "business",
  cycle: "monthly" | "yearly"
): number {
  const { amount } = getDisplayPrice(countryCode, plan, cycle);
  return Math.round(amount * 100);
}

/**
 * Get feature limits for a plan tier.
 */
export function getFeatureLimits(tier: PlanTier): FeatureLimit {
  return PLAN_DEFINITIONS[tier].limits;
}

/**
 * Get the plan tier from a plan name.
 */
export function getTierFromPlanName(planName: PlanName): PlanTier {
  return planName === "business" ? "business" : "pro";
}

/**
 * Map a country code to its currency.
 */
export function getCurrencyForCountry(countryCode: string): string {
  return getPricingForCountry(countryCode).currency;
}

/**
 * Check if a feature is accessible for a given tier.
 */
export function canAccessFeature(tier: PlanTier, feature: keyof FeatureLimit): boolean {
  const limits = getFeatureLimits(tier);
  const value = limits[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  return false;
}

/**
 * Get the numeric limit for a feature (e.g., maxProducts).
 */
export function getFeatureLimitValue(tier: PlanTier, feature: keyof FeatureLimit): number {
  const limits = getFeatureLimits(tier);
  return limits[feature] as number;
}
