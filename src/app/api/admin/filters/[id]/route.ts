import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * PUT /api/admin/filters/[id] — update filter group (name, type, unit, active)
 * DELETE /api/admin/filters/[id] — deactivate filter group
 */

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;
    const { name, type, unit, active } = await req.json();

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (type !== undefined) data.type = type;
    if (unit !== undefined) data.unit = unit;
    if (active !== undefined) data.active = active;

    const updated = await db.filterGroup.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
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
    // Soft delete — set active=false
    await db.filterGroup.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
