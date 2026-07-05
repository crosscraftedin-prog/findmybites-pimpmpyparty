/**
 * GET  /api/admin/business-types — list ALL business types (admin only)
 * POST /api/admin/business-types — create a business type
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;
  try {
    const types = await db.businessType.findMany({ orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }], take: 500 });
    return NextResponse.json({ businessTypes: types });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;
  try {
    const body = await req.json();
    const { categoryId, value, label, sortOrder } = body;
    if (!categoryId || !value || !label) {
      return NextResponse.json({ error: "categoryId, value, and label are required" }, { status: 400 });
    }
    const bt = await db.businessType.create({
      data: { categoryId, value, label, sortOrder: Number(sortOrder) || 0, active: true },
    });
    return NextResponse.json({ businessType: bt }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
