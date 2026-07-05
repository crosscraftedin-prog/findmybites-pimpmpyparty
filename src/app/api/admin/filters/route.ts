import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * GET /api/admin/filters — list all filter groups + values
 * POST /api/admin/filters — create a new filter group
 */

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const groups = await db.filterGroup.findMany({
      include: {
        values: { orderBy: { sortOrder: "asc" } },
        categories: true,
      },
      orderBy: { name: "asc" },
      take: 200,
    });

    return NextResponse.json(groups);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { name, type, unit, values, categoryIds } = await req.json() as {
      name: string;
      type?: string;
      unit?: string;
      values?: string[];
      categoryIds?: string[];
    };

    if (!name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    // Create filter group
    const group = await db.filterGroup.create({
      data: {
        name,
        type: type || "multi",
        unit: unit || null,
      },
    });

    // Create filter values
    if (values && values.length > 0) {
      await db.filterValue.createMany({
        data: values.map((v: string, i: number) => ({
          groupId: group.id,
          value: v,
          sortOrder: i,
        })),
      });
    }

    // Assign to categories
    if (categoryIds && categoryIds.length > 0) {
      await db.categoryFilter.createMany({
        data: categoryIds.map((catId: string) => ({
          categoryId: catId,
          filterGroupId: group.id,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ success: true, id: group.id });
  } catch (error: any) {
    console.error("[admin/filters] POST failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
