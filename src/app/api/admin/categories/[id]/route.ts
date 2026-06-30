import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * PATCH /api/admin/categories/[id]
 * Update a category (label, description, icon, image, accent, active).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;
  try {
    const { id } = await params;
    const body = await req.json();
    const { label, description, icon, image, accent, active } = body;

    const data: Record<string, unknown> = {};
    if (typeof label === "string") data.label = label;
    if (description !== undefined) data.description = description;
    if (icon !== undefined) data.icon = icon;
    if (image !== undefined) data.image = image;
    if (accent !== undefined) data.accent = accent;
    if (typeof active === "boolean") data.active = active;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
    }

    const category = await db.category.update({
      where: { id },
      data,
    });

    return NextResponse.json({ category });
  } catch (err) {
    console.error("[api/admin/categories/[id]] PATCH failed:", err);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/categories/[id]
 * Delete a category (cascades to subcategories).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;
  try {
    const { id } = await params;
    await db.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/admin/categories/[id]] DELETE failed:", err);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
