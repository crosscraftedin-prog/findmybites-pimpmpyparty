import { NextRequest, NextResponse } from "next/server";
import { getAllPricingPlans, upsertPricingPlan, invalidatePricingCache } from "@/lib/billing";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * GET /api/admin/billing/pricing
 * Returns all pricing plans from the database.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const plans = await getAllPricingPlans();
  return NextResponse.json({ plans });
}

/**
 * PUT /api/admin/billing/pricing
 * Create or update a pricing plan.
 * Body: { countryCode, countryName, currency, currencySymbol, plan, billingCycle, displayPrice, razorpayPlanId?, active? }
 */
export async function PUT(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await req.json();
    const { countryCode, countryName, currency, currencySymbol, plan, billingCycle, displayPrice, razorpayPlanId, active } = body;

    if (!countryCode || !plan || !billingCycle || displayPrice == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await upsertPricingPlan({
      countryCode,
      countryName: countryName || countryCode,
      currency: currency || "USD",
      currencySymbol: currencySymbol || "$",
      plan,
      billingCycle,
      displayPrice: Number(displayPrice),
      razorpayPlanId: razorpayPlanId || null,
      active: active ?? true,
    });

    return NextResponse.json({ success: true, message: "Pricing plan updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
