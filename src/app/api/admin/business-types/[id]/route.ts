/**
 * PUT    /api/admin/business-types/[id] — update a business type
 * DELETE /api/admin/business-types/[id] — delete a business type
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const data: any = {};
    if (body.categoryId !== undefined) data.categoryId = body.categoryId;
    if (body.value !== undefined) data.value = body.value;
    if (body.label !== undefined) data.label = body.label;
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);
    if (body.active !== undefined) data.active = body.active;
    const bt = await db.businessType.update({ where: { id }, data });
    return NextResponse.json({ businessType: bt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { id } = await ctx.params;
  try {
    await db.businessType.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
