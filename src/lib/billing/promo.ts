/**
 * Billing Module — Promo Codes
 *
 * Validate and apply promo codes for subscription discounts.
 * Supports percentage and fixed-amount discounts.
 */

import { db } from "@/lib/db";
import type { PromoCodeInfo, DiscountType } from "./types";

/**
 * Validate a promo code for a specific country + plan + billing cycle.
 * Returns the promo code info if valid, or { valid: false, reason } if invalid.
 */
export async function validatePromoCode(params: {
  code: string;
  countryCode: string;
  plan: "pro" | "business";
  billingCycle: "monthly" | "yearly";
}): Promise<PromoCodeInfo> {
  const promo = await db.promoCode.findUnique({
    where: { code: params.code.toUpperCase() },
  }).catch(() => null);

  if (!promo || !promo.active) {
    return { id: "", code: params.code, description: "", discountType: "percentage", discountValue: 0, valid: false, reason: "Invalid or expired promo code" };
  }

  // Check expiry
  if (promo.expiresAt && promo.expiresAt < new Date()) {
    return { id: promo.id, code: promo.code, description: promo.description, discountType: promo.discountType as DiscountType, discountValue: promo.discountValue, valid: false, reason: "This promo code has expired" };
  }

  // Check usage limit
  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
    return { id: promo.id, code: promo.code, description: promo.description, discountType: promo.discountType as DiscountType, discountValue: promo.discountValue, valid: false, reason: "This promo code has reached its usage limit" };
  }

  // Check country restriction
  if (promo.countryCode && promo.countryCode !== params.countryCode) {
    return { id: promo.id, code: promo.code, description: promo.description, discountType: promo.discountType as DiscountType, discountValue: promo.discountValue, valid: false, reason: "This promo code is not valid in your country" };
  }

  // Check plan restriction
  if (promo.plan && promo.plan !== params.plan) {
    return { id: promo.id, code: promo.code, description: promo.description, discountType: promo.discountType as DiscountType, discountValue: promo.discountValue, valid: false, reason: `This promo code is only valid for the ${promo.plan} plan` };
  }

  // Check billing cycle restriction
  if (promo.billingCycle && promo.billingCycle !== params.billingCycle) {
    return { id: promo.id, code: promo.code, description: promo.description, discountType: promo.discountType as DiscountType, discountValue: promo.discountValue, valid: false, reason: `This promo code is only valid for ${promo.billingCycle} billing` };
  }

  return {
    id: promo.id,
    code: promo.code,
    description: promo.description,
    discountType: promo.discountType as DiscountType,
    discountValue: promo.discountValue,
    valid: true,
  };
}

/**
 * Calculate the discount amount for a promo code.
 * Returns the discount in minor currency units.
 */
export function calculateDiscount(
  amountMinor: number,
  promo: PromoCodeInfo
): number {
  if (!promo.valid) return 0;

  if (promo.discountType === "percentage") {
    return Math.round((amountMinor * promo.discountValue) / 100);
  }

  // Fixed amount — convert to minor units
  return Math.round(promo.discountValue * 100);
}

/**
 * Increment the usage count for a promo code.
 * Called after a successful payment with the promo code applied.
 */
export async function incrementPromoUsage(code: string): Promise<void> {
  await db.promoCode.update({
    where: { code: code.toUpperCase() },
    data: { usedCount: { increment: 1 } },
  }).catch(() => {});
}

/**
 * Create a new promo code (admin only).
 */
export async function createPromoCode(params: {
  code: string;
  description?: string;
  countryCode?: string | null;
  plan?: string | null;
  billingCycle?: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxUses?: number;
  expiresAt?: Date | null;
}): Promise<{ id: string; code: string }> {
  const promo = await db.promoCode.create({
    data: {
      code: params.code.toUpperCase(),
      description: params.description || "",
      countryCode: params.countryCode || null,
      plan: params.plan || null,
      billingCycle: params.billingCycle || null,
      discountType: params.discountType,
      discountValue: params.discountValue,
      maxUses: params.maxUses || 0,
      expiresAt: params.expiresAt || null,
      active: true,
    },
  });
  return { id: promo.id, code: promo.code };
}

/**
 * Get all promo codes (admin only).
 */
export async function getAllPromoCodes(): Promise<any[]> {
  return db.promoCode.findMany({
    orderBy: { createdAt: "desc" },
  }).catch(() => []);
}
