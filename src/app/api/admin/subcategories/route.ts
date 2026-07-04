import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * GET /api/admin/subcategories?pending=true
 * Returns all subcategories, optionally filtered by isPending.
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const sp = req.nextUrl.searchParams;
    const pendingOnly = sp.get("pending") === "true";

    const where = pendingOnly ? { isPending: true } : {};
    const subs = await db.subcategory.findMany({
      where,
      include: { category: { select: { label: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    });

    // Get vendor names for addedByVendorId
    const vendorIds = [...new Set(subs.map(s => s.addedByVendorId).filter(Boolean))] as string[];
    let vendorMap: Record<string, string> = {};
    if (vendorIds.length > 0) {
      const vendors = await db.vendor.findMany({
        where: { id: { in: vendorIds } },
        select: { id: true, name: true },
      });
      vendorMap = Object.fromEntries(vendors.map(v => [v.id, v.name]));
    }

    return NextResponse.json({
      subcategories: subs.map(s => ({
        id: s.id,
        slug: s.slug,
        label: s.label,
        isPending: s.isPending,
        active: s.active,
        categoryLabel: s.category?.label ?? "—",
        addedByVendor: s.addedByVendorId ? vendorMap[s.addedByVendorId] ?? "—" : null,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[api/admin/subcategories] GET failed:", err);
    return NextResponse.json({ subcategories: [] });
  }
}
