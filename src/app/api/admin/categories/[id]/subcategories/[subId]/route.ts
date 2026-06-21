import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * PATCH /api/admin/categories/[id]/subcategories/[subId]
 * Update a subcategory (label, active).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  try {
    const { subId } = await params;
    const body = await req.json();
    const { label, active } = body;

    const data: Record<string, unknown> = {};
    if (typeof label === "string") data.label = label;
    if (typeof active === "boolean") data.active = active;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const subcategory = await db.subcategory.update({
      where: { id: subId },
      data,
    });

    return NextResponse.json({ subcategory });
  } catch (err) {
    console.error("[api/admin/categories/[id]/subcategories/[subId]] PATCH failed:", err);
    return NextResponse.json({ error: "Failed to update subcategory" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/categories/[id]/subcategories/[subId]
 * Delete a subcategory.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  try {
    const { subId } = await params;
    await db.subcategory.delete({ where: { id: subId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/admin/categories/[id]/subcategories/[subId]] DELETE failed:", err);
    return NextResponse.json({ error: "Failed to delete subcategory" }, { status: 500 });
  }
}
