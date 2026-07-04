/**
 * Admin inventory management.
 * GET  /api/admin/inventory                 — global inventory overview + filters
 * PUT  /api/admin/inventory?id=PID          — force-hide / feature / archive / set status
 *
 * Admin-only. Vendors cannot reach these endpoints.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getAdminInventoryOverview } from "@/lib/inventory/inventory-service";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const sp = req.nextUrl.searchParams;
  try {
    const data = await getAdminInventoryOverview({
      status: sp.get("status") || undefined,
      ecosystem: sp.get("ecosystem") || undefined,
      outOfStockOnly: sp.get("outOfStock") === "true",
      seasonalOnly: sp.get("seasonal") === "true",
      forceHiddenOnly: sp.get("forceHidden") === "true",
      limit: sp.get("limit") ? Number(sp.get("limit")) : 200,
    });
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[admin/inventory] GET failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id query param required" }, { status: 400 });
  }

  const body = await req.json();
  const updates: any = {};

  // Admin-only fields
  if (typeof body.forceHidden === "boolean") updates.forceHidden = body.forceHidden;
  if (typeof body.isFeatured === "boolean") updates.isFeatured = body.isFeatured;
  if (typeof body.featured === "boolean") updates.featured = body.featured;
  if (typeof body.status === "string") updates.status = body.status;
  if (typeof body.adminNotes === "string") updates.adminNotes = body.adminNotes || null;
  if (typeof body.sortOrder === "number") updates.sortOrder = body.sortOrder;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const updated = await db.product.update({ where: { id }, data: updates });
    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    console.error("[admin/inventory] PUT failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
