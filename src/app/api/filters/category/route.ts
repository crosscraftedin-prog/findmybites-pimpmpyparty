import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/filters/category?category=caterers
 * Returns all filter groups + values assigned to a category.
 * Used by the vendor form to display dynamic filters.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const category = sp.get("category");

    if (!category) {
      return NextResponse.json({ error: "Category required" }, { status: 400 });
    }

    // Find all CategoryFilter entries for this category
    const categoryFilters = await db.categoryFilter.findMany({
      where: { categoryId: category },
      include: {
        filterGroup: {
          include: {
            values: {
              where: { active: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    // Format for frontend
    const filters = categoryFilters.map((cf) => ({
      id: cf.filterGroup.id,
      name: cf.filterGroup.name,
      type: cf.filterGroup.type,
      unit: cf.filterGroup.unit,
      required: cf.required,
      values: cf.filterGroup.values.map((v) => ({
        id: v.id,
        value: v.value,
      })),
    }));

    return NextResponse.json(filters);
  } catch {
    return NextResponse.json([]);
  }
}
