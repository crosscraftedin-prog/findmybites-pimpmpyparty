import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * PUT /api/pricing/[id] — update pricing (admin)
 * DELETE /api/pricing/[id] — deactivate pricing (admin, soft delete)
 */

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;
    const data = await req.json();

    const pricing = await db.pricing.update({
      where: { id },
      data: {
        proMonthly: data.proMonthly !== undefined ? Number(data.proMonthly) : undefined,
        proYearly: data.proYearly !== undefined ? Number(data.proYearly) : undefined,
        businessMonthly: data.businessMonthly !== undefined ? Number(data.businessMonthly) : undefined,
        businessYearly: data.businessYearly !== undefined ? Number(data.businessYearly) : undefined,
        note: data.note,
        countryLabel: data.countryLabel,
        symbol: data.symbol,
      },
    });

    return NextResponse.json(pricing);
  } catch (error: any) {
    console.error("[api/pricing] PUT failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;
    await db.pricing.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[api/pricing] DELETE failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
