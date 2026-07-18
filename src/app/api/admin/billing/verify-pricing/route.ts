import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getPricing, SUPPORTED_COUNTRIES } from "@/lib/billing";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/billing/verify-pricing
 *
 * V7: Verifies that getPricing() returns a valid razorpayPlanId from the
 * database for every supported country + plan + billing cycle combination.
 *
 * This route is used to confirm the system is ready for the Subscription
 * (AutoPay) flow BEFORE changing any checkout behavior.
 *
 * Response:
 *   {
 *     razorpayConfigured: boolean,
 *     total: number,              // total combinations checked
 *     valid: number,              // combinations with a valid razorpayPlanId
 *     invalid: number,            // combinations missing a razorpayPlanId
 *     autoPayReady: boolean,      // true if ALL combinations are valid
 *     results: [{
 *       countryCode, countryName, plan, billingCycle,
 *       displayPrice, currency, razorpayPlanId,
 *       isValid: boolean,
 *       willUseAutoPay: boolean,  // true if Subscription flow will be used
 *       willFallbackToOrders: boolean,
 *     }]
 *   }
 */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const razorpayConfigured = isRazorpayConfigured();
    const results: any[] = [];

    for (const country of SUPPORTED_COUNTRIES) {
      for (const plan of ["pro", "business"] as const) {
        for (const billingCycle of ["monthly", "yearly"] as const) {
          const pricing = await getPricing(country.code, plan, billingCycle);

          // Also fetch the raw DB row to confirm the source
          const dbRow = await db.pricingPlan.findUnique({
            where: {
              countryCode_plan_billingCycle: {
                countryCode: country.code,
                plan,
                billingCycle,
              },
            },
            select: { razorpayPlanId: true, displayPrice: true, active: true },
          }).catch(() => null);

          const isValid = !!pricing.razorpayPlanId && typeof pricing.razorpayPlanId === "string" && pricing.razorpayPlanId.startsWith("plan_");

          results.push({
            countryCode: country.code,
            countryName: country.name,
            plan,
            billingCycle,
            displayPrice: pricing.displayPrice,
            amountMinor: pricing.amountMinor,
            currency: pricing.currency,
            currencySymbol: pricing.currencySymbol,
            razorpayPlanId: pricing.razorpayPlanId,
            isValid,
            willUseAutoPay: isValid,
            willFallbackToOrders: !isValid,
            dbSource: dbRow ? {
              razorpayPlanId: dbRow.razorpayPlanId,
              displayPrice: dbRow.displayPrice,
              active: dbRow.active,
            } : null,
            // Flag if getPricing() returned a fallback (not from DB)
            isFromFallback: !dbRow,
          });
        }
      }
    }

    const total = results.length;
    const valid = results.filter(r => r.isValid).length;
    const invalid = total - valid;
    const autoPayReady = invalid === 0 && razorpayConfigured;

    logger.info("verify-pricing", "Pricing verification completed", {
      razorpayConfigured, total, valid, invalid, autoPayReady,
    });

    return NextResponse.json({
      razorpayConfigured,
      total,
      valid,
      invalid,
      autoPayReady,
      message: autoPayReady
        ? "✅ All pricing tiers have valid Razorpay Plan IDs. The Subscription (AutoPay) flow is ready."
        : invalid > 0
          ? `⚠️ ${invalid} pricing tier(s) are missing Razorpay Plan IDs. Those tiers will use the Orders fallback flow.`
          : "⚠️ Razorpay keys are not configured. Set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET + NEXT_PUBLIC_RAZORPAY_KEY_ID.",
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
