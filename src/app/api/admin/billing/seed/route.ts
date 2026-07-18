import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { SUPPORTED_COUNTRIES } from "@/lib/billing/countries";
import { toMinorUnits } from "@/lib/billing/currency";
import { invalidatePricingCache } from "@/lib/billing/pricing";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/billing/seed
 *
 * Seeds the PricingPlan table with all 9 countries × 2 plans × 2 cycles = 36 records.
 *
 * V7 (revised per production requirements):
 *   - This route ONLY populates the database. It does NOT create Razorpay Plans.
 *   - Production Razorpay Plan IDs already exist in the Razorpay Dashboard.
 *   - Admin can pass existing Plan IDs via the `planIds` field in the request body.
 *   - If `planIds` is not provided, rows are seeded with razorpayPlanId = null
 *     (the system falls back to the Orders flow until IDs are added).
 *   - Plan IDs can also be added/updated later via PUT /api/admin/billing/pricing.
 *
 * Body:
 *   {
 *     confirm: true,                    // required — prevents accidental overwrites
 *     planIds?: {                       // optional — existing Razorpay Plan IDs
 *       "IN_pro_monthly": "plan_abc123",
 *       "IN_pro_yearly": "plan_def456",
 *       ...                             // 36 entries (9 countries × 2 plans × 2 cycles)
 *     }
 *   }
 *
 * The planIds key format is: `${countryCode}_${plan}_${billingCycle}`
 * e.g. "IN_pro_monthly", "US_business_yearly"
 *
 * Response: { success, created, updated, total, withPlanId, withoutPlanId }
 */

const SEED_PRICING: Record<string, { pro: { monthly: number; yearly: number }; business: { monthly: number; yearly: number } }> = {
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

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  // Require explicit confirmation to prevent accidental overwrites
  const body = await req.json().catch(() => ({}));
  if (!body?.confirm) {
    return NextResponse.json({
      error: "Confirmation required. Send { confirm: true } to proceed.",
      warning: "This will overwrite existing pricing. Use Admin Billing Center to edit individual prices instead.",
    }, { status: 400 });
  }

  // Optional map of existing Razorpay Plan IDs
  // Key format: `${countryCode}_${plan}_${billingCycle}` → plan_id
  const planIds: Record<string, string> = body.planIds && typeof body.planIds === "object"
    ? body.planIds
    : {};

  try {
    let created = 0;
    let updated = 0;
    let withPlanId = 0;
    let withoutPlanId = 0;

    for (const country of SUPPORTED_COUNTRIES) {
      const prices = SEED_PRICING[country.code];
      if (!prices) continue;

      for (const plan of ["pro", "business"] as const) {
        for (const cycle of ["monthly", "yearly"] as const) {
          const displayPrice = prices[plan][cycle];
          const amountMinor = toMinorUnits(displayPrice);

          // Look up the existing Razorpay Plan ID from the request body
          const planIdKey = `${country.code}_${plan}_${cycle}`;
          const razorpayPlanId = planIds[planIdKey] || null;

          // Check if a Plan ID already exists in the DB — don't overwrite with null
          const existing = await db.pricingPlan.findUnique({
            where: {
              countryCode_plan_billingCycle: {
                countryCode: country.code,
                plan,
                billingCycle: cycle,
              },
            },
            select: { razorpayPlanId: true },
          }).catch(() => null);

          // Preserve existing Plan ID if no new one is provided
          const finalPlanId = razorpayPlanId || existing?.razorpayPlanId || null;

          if (finalPlanId) {
            withPlanId++;
          } else {
            withoutPlanId++;
          }

          const result = await db.pricingPlan.upsert({
            where: {
              countryCode_plan_billingCycle: {
                countryCode: country.code,
                plan,
                billingCycle: cycle,
              },
            },
            create: {
              countryCode: country.code,
              countryName: country.name,
              currency: country.currency,
              currencySymbol: country.currencySymbol,
              plan,
              billingCycle: cycle,
              displayPrice,
              amountMinor,
              razorpayPlanId: finalPlanId,
              active: true,
            },
            update: {
              countryName: country.name,
              currency: country.currency,
              currencySymbol: country.currencySymbol,
              displayPrice,
              amountMinor,
              // Only overwrite Plan ID if a new one is provided
              ...(razorpayPlanId ? { razorpayPlanId } : {}),
            },
          });

          if (result.createdAt.getTime() === result.updatedAt.getTime()) {
            created++;
          } else {
            updated++;
          }
        }
      }
    }

    // Invalidate the pricing cache so the new plans take effect immediately
    invalidatePricingCache();

    logger.info("seed", "PricingPlan table seeded", {
      created, updated, withPlanId, withoutPlanId,
    });

    const summary: any = {
      success: true,
      message: `Pricing seeded: ${created} created, ${updated} updated`,
      total: created + updated,
      withPlanId,
      withoutPlanId,
      autoPayReady: withoutPlanId === 0,
      razorpayConfigured: isRazorpayConfigured(),
    };

    if (withoutPlanId > 0) {
      summary.warning =
        `${withoutPlanId} pricing tiers are missing Razorpay Plan IDs. ` +
        "Those tiers will use the Orders (one-time payment) fallback flow. " +
        "Add Plan IDs via PUT /api/admin/billing/pricing or re-run seed with { planIds: {...} }.";
    }

    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/admin/billing/seed
 * Returns the current state of the PricingPlan table (for verification).
 */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const plans = await db.pricingPlan.findMany({
      where: { active: true },
      orderBy: [{ countryCode: "asc" }, { plan: "asc" }, { billingCycle: "asc" }],
      select: {
        countryCode: true,
        countryName: true,
        currency: true,
        plan: true,
        billingCycle: true,
        displayPrice: true,
        amountMinor: true,
        razorpayPlanId: true,
        active: true,
      },
    });

    const total = plans.length;
    const withPlanId = plans.filter(p => p.razorpayPlanId).length;
    const withoutPlanId = total - withPlanId;

    return NextResponse.json({
      total,
      withPlanId,
      withoutPlanId,
      autoPayReady: withoutPlanId === 0,
      razorpayConfigured: isRazorpayConfigured(),
      plans,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
