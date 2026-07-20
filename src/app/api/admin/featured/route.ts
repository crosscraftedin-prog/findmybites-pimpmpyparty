import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

/**
 * GET /api/admin/featured — list featured vendors (max 6)
 * POST /api/admin/featured — add a vendor to featured slots
 * DELETE /api/admin/featured — remove a vendor from featured slots
 *
 * All operations require admin auth.
 */
const MAX_SLOTS = 6;

export async function GET(_req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const vendors = await db.vendor.findMany({
      where: { featured: true, approved: true },
      select: {
        id: true,
        name: true,
        category: true,
        city: true,
        country: true,
        heroImage: true,
        avatarImage: true,
        featured: true,
        ecosystem: true,
        rating: true,
        reviewCount: true,
      },
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
      take: MAX_SLOTS,
    });

    return NextResponse.json({ vendors });
  } catch (error: any) {
    console.error("[admin/featured] GET failed:", error.message);
    return NextResponse.json({ vendors: [] }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { vendorId } = await req.json();
    if (!vendorId) {
      return NextResponse.json({ error: "vendorId is required" }, { status: 400 });
    }

    // Check slot count
    const currentCount = await db.vendor.count({
      where: { featured: true, approved: true },
    });
    if (currentCount >= MAX_SLOTS) {
      return NextResponse.json(
        { error: `All ${MAX_SLOTS} featured slots are full. Remove one first.` },
        { status: 400 }
      );
    }

    await db.vendor.update({
      where: { id: vendorId },
      data: { featured: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[admin/featured] POST failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { vendorId } = await req.json();
    if (!vendorId) {
      return NextResponse.json({ error: "vendorId is required" }, { status: 400 });
    }

    await db.vendor.update({
      where: { id: vendorId },
      data: { featured: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[admin/featured] DELETE failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
