import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { invalidatePricingCache } from "@/lib/billing/pricing";
import { logger } from "@/lib/logger";

/**
 * PUT /api/admin/billing/plan-ids
 *
 * Bulk-update Razorpay Plan IDs for existing PricingPlan rows.
 *
 * This route is used to load EXISTING Razorpay Plan IDs (created in the
 * Razorpay Dashboard) into the database. It does NOT create new Plans in
 * Razorpay — it only references existing ones.
 *
 * Body:
 *   {
 *     planIds: {
 *       "IN_pro_monthly": "plan_abc123",
 *       "IN_pro_yearly": "plan_def456",
 *       "IN_business_monthly": "plan_ghi789",
 *       ...                           // up to 36 entries
 *     }
 *   }
 *
 * The planIds key format is: `${countryCode}_${plan}_${billingCycle}`
 * e.g. "IN_pro_monthly", "US_business_yearly"
 *
 * Response: { success, updated, skipped, notFound }
 */
export async function PUT(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await req.json();
    const planIds: Record<string, string> = body?.planIds;

    if (!planIds || typeof planIds !== "object") {
      return NextResponse.json(
        { error: "Body must include { planIds: { ... } }" },
        { status: 400 }
      );
    }

    let updated = 0;
    let skipped = 0;
    const notFound: string[] = [];
    const errors: { key: string; error: string }[] = [];

    for (const [key, planId] of Object.entries(planIds)) {
      // Parse key: `${countryCode}_${plan}_${billingCycle}`
      const parts = key.split("_");
      if (parts.length !== 3) {
        errors.push({ key, error: "Invalid key format. Expected: countryCode_plan_billingCycle" });
        continue;
      }

      const [countryCode, plan, billingCycle] = parts;

      if (plan !== "pro" && plan !== "business") {
        errors.push({ key, error: `Invalid plan: '${plan}'. Must be 'pro' or 'business'.` });
        continue;
      }
      if (billingCycle !== "monthly" && billingCycle !== "yearly") {
        errors.push({ key, error: `Invalid billingCycle: '${billingCycle}'. Must be 'monthly' or 'yearly'.` });
        continue;
      }

      try {
        const result = await db.pricingPlan.updateMany({
          where: {
            countryCode: countryCode.toUpperCase(),
            plan,
            billingCycle,
          },
          data: { razorpayPlanId: planId || null },
        });

        if (result.count > 0) {
          updated++;
        } else {
          notFound.push(key);
        }
      } catch (err: any) {
        errors.push({ key, error: err.message });
        skipped++;
      }
    }

    // Invalidate the pricing cache so the new Plan IDs take effect immediately
    invalidatePricingCache();

    logger.info("plan-ids", "Bulk-updated Razorpay Plan IDs", { updated, skipped, notFound: notFound.length });

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} pricing plan(s) with Razorpay Plan IDs`,
      updated,
      skipped,
      notFound,
      errors,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/admin/billing/plan-ids
 * Returns a summary of which pricing tiers have Plan IDs configured.
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
        plan: true,
        billingCycle: true,
        razorpayPlanId: true,
      },
    });

    // Build a map: `${countryCode}_${plan}_${billingCycle}` → planId
    const planIdMap: Record<string, string | null> = {};
    for (const p of plans) {
      planIdMap[`${p.countryCode}_${p.plan}_${p.billingCycle}`] = p.razorpayPlanId;
    }

    const total = plans.length;
    const withPlanId = plans.filter(p => p.razorpayPlanId).length;
    const withoutPlanId = total - withPlanId;

    return NextResponse.json({
      total,
      withPlanId,
      withoutPlanId,
      autoPayReady: withoutPlanId === 0,
      planIds: planIdMap,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
