import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/filters/vendor?vendorId=xxx
 * Returns all filter values selected by a vendor.
 *
 * POST /api/filters/vendor
 * Saves vendor's filter value selections.
 * Body: { vendorId, filterValueIds: string[] }
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const vendorId = sp.get("vendorId");

    if (!vendorId) {
      return NextResponse.json({ error: "vendorId required" }, { status: 400 });
    }

    const selections = await db.vendorFilterValue.findMany({
      where: { vendorId },
      include: {
        filterValue: {
          include: {
            group: true,
          },
        },
      },
    });

    // Group by filter group name
    const grouped: Record<string, string[]> = {};
    for (const sel of selections) {
      const groupName = sel.filterValue.group.name;
      if (!grouped[groupName]) grouped[groupName] = [];
      grouped[groupName].push(sel.filterValue.value);
    }

    return NextResponse.json({
      vendorId,
      selections: grouped,
      filterValueIds: selections.map((s) => s.filterValueId),
    });
  } catch {
    return NextResponse.json({ vendorId: "", selections: {}, filterValueIds: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { vendorId, filterValueIds } = await req.json() as {
      vendorId: string;
      filterValueIds: string[];
    };

    if (!vendorId) {
      return NextResponse.json({ error: "vendorId required" }, { status: 400 });
    }

    // Delete existing selections
    await db.vendorFilterValue.deleteMany({
      where: { vendorId },
    });

    // Insert new selections
    if (filterValueIds.length > 0) {
      await db.vendorFilterValue.createMany({
        data: filterValueIds.map((id: string) => ({
          vendorId,
          filterValueId: id,
        })),
      });
    }

    return NextResponse.json({ success: true, count: filterValueIds.length });
  } catch (error: any) {
    console.error("[api/filters/vendor] POST failed:", error.message);
    return NextResponse.json({ error: "Failed to save filters" }, { status: 500 });
  }
}
