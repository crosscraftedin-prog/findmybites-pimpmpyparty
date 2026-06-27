import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * PUT /api/admin/subcategories/[id]
 * Update a subcategory (approve, rename, deactivate).
 * Body: { isPending?, active?, label? }
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;
    const body = await req.json();

    const data: any = {};
    if (typeof body.isPending === "boolean") data.isPending = body.isPending;
    if (typeof body.active === "boolean") data.active = body.active;
    if (typeof body.label === "string" && body.label.trim()) {
      data.label = body.label.trim();
      data.slug = body.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }

    const updated = await db.subcategory.update({ where: { id }, data });
    return NextResponse.json({ subcategory: updated });
  } catch (err) {
    console.error("[api/admin/subcategories/[id]] PUT failed:", err);
    return NextResponse.json({ error: "Failed to update subcategory" }, { status: 500 });
  }
}
