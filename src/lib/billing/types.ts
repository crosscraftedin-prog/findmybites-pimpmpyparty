/**
 * Billing Module — Central Types
 *
 * Shared types used across all billing service files.
 * No billing logic should exist outside src/lib/billing/.
 */

export type PlanTier = "free" | "pro" | "business";
export type PlanName = "vendor-pro" | "business";
export type BillingCycle = "monthly" | "yearly";
export type PaymentProvider = "razorpay_orders" | "razorpay_subscriptions";
export type SubscriptionStatus = "active" | "expired" | "cancelled" | "past_due";
export type PaymentStatus = "captured" | "failed" | "refunded" | "pending";
export type DiscountType = "percentage" | "fixed";

export interface PricingPlanRecord {
  id: string;
  countryCode: string;
  countryName: string;
  currency: string;
  currencySymbol: string;
  plan: "pro" | "business";
  billingCycle: BillingCycle;
  displayPrice: number;
  amountMinor: number;
  razorpayPlanId: string | null;
  active: boolean;
}

export interface PlanPricingInfo {
  displayPrice: number;
  amountMinor: number;
  currency: string;
  currencySymbol: string;
  countryName: string;
  razorpayPlanId: string | null;
  isAutoPay: boolean;
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

export interface PromoCodeInfo {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  valid: boolean;
  reason?: string;
}

export interface InvoiceInfo {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  planName: string;
  billingCycle: BillingCycle;
  currency: string;
  currencySymbol: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  promoCode: string | null;
  status: string;
  filePath: string | null;
  razorpayPaymentId: string | null;
}

export interface BillingAnalytics {
  mrr: number;
  arr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  newThisMonth: number;
  renewalsThisMonth: number;
  churnRate: number;
  failedPayments: number;
  recoveredPayments: number;
  topCountries: { country: string; count: number; revenue: number }[];
  topPlans: { plan: string; count: number; revenue: number }[];
}
