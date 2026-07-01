import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { migrateCategory } from "@/lib/constants";

/**
 * GET /api/categories/subcategories?category=<slug>
 * Returns all active subcategories for a given category slug.
 * Applies migration map so old category slugs (cake-artists, bakers, etc.)
 * still resolve to the correct new category.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const rawCategory = sp.get("category");

    if (!rawCategory) {
      return NextResponse.json([]);
    }

    // Apply migration map so old slugs resolve to new categories
    const categorySlug = migrateCategory(rawCategory);

    const cat = await db.category.findFirst({
      where: { slug: categorySlug, active: true },
      select: { id: true },
    });

    if (!cat) return NextResponse.json([]);

    const subcategories = await db.subcategory.findMany({
      where: { categoryId: cat.id, active: true },
      orderBy: [{ isPending: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
      select: { id: true, slug: true, label: true },
    });

    return NextResponse.json(
      subcategories.map((s) => ({ id: s.id, name: s.label, slug: s.slug })),
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[api/categories/subcategories] GET failed:", err);
    return NextResponse.json([]);
  }
}
