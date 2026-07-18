import { NextRequest, NextResponse } from "next/server";
import { getAllPromoCodes, createPromoCode } from "@/lib/billing";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * GET /api/admin/billing/promo-codes
 * Returns all promo codes.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const codes = await getAllPromoCodes();
  return NextResponse.json({ promoCodes: codes });
}

/**
 * POST /api/admin/billing/promo-codes
 * Create a new promo code.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await req.json();
    const { code, description, countryCode, plan, billingCycle, discountType, discountValue, maxUses, expiresAt } = body;

    if (!code || !discountType || discountValue == null) {
      return NextResponse.json({ error: "Missing required fields: code, discountType, discountValue" }, { status: 400 });
    }

    const result = await createPromoCode({
      code,
      description,
      countryCode: countryCode || null,
      plan: plan || null,
      billingCycle: billingCycle || null,
      discountType,
      discountValue: Number(discountValue),
      maxUses: maxUses || 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    return NextResponse.json({ success: true, id: result.id, code: result.code });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
