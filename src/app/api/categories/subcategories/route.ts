import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { migrateCategory } from "@/lib/constants";
import type { Ecosystem } from "@/lib/types";

/**
 * GET /api/categories/subcategories?category=<slug>&ecosystem=FINDMYBITES
 * GET /api/categories/subcategories?category=<slug>&marketplace=pimpmyparty
 *
 * Returns all active subcategories for a given category slug.
 * Applies migration map so old category slugs (cake-artists, bakers, etc.)
 * still resolve to the correct new category.
 *
 * When `ecosystem` (or `marketplace`) is provided, the category lookup is
 * ALSO filtered by ecosystem. This prevents cross-marketplace subcategory
 * leakage — e.g., a PimpMyParty request can never return subcategories
 * belonging to a FindMyBites category (even if slugs collide).
 */
function resolveEcosystem(sp: URLSearchParams): Ecosystem | null {
  const raw = sp.get("ecosystem") || sp.get("marketplace");
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper === "FINDMYBITES" || upper === "PIMPMYPARTY") return upper;
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const rawCategory = sp.get("category");

    if (!rawCategory) {
      return NextResponse.json([]);
    }

    // Apply migration map so old slugs resolve to new categories
    const categorySlug = migrateCategory(rawCategory);
    const ecosystemParam = resolveEcosystem(sp);

    // Look up the category — filter by ecosystem when provided so a
    // PimpMyParty request can never match a FindMyBites category (and
    // vice versa), even if two categories share the same slug.
    const cat = await db.category.findFirst({
      where: {
        slug: categorySlug,
        active: true,
        ...(ecosystemParam ? { ecosystem: ecosystemParam } : {}),
      },
      select: { id: true, ecosystem: true },
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
