import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { migrateCategory } from "@/lib/constants";
import type { Ecosystem } from "@/lib/types";

interface CategoryWithCount {
  id: string;
  ecosystem: Ecosystem;
  label: string;
  description: string;
  icon: string;
  image: string;
  accent: string;
  count: number;
  subcategories?: { id: string; slug: string; label: string }[];
}

/**
 * GET /api/categories?ecosystem=FINDMYBITES|PIMPMYPARTY
 *
 * SINGLE SOURCE OF TRUTH: the Category table in the database (managed via
 * Admin Panel). No hardcoded fallback — if the DB is unavailable, returns
 * an empty array so the frontend shows a loading state instead of legacy
 * categories.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const ecosystemParam = sp.get("ecosystem") as Ecosystem | null;

    // Fetch categories from the Category table (admin-managed)
    let dbCategories: any[] = [];
    try {
      dbCategories = await db.category.findMany({
        where: {
          ...(ecosystemParam ? { ecosystem: ecosystemParam } : {}),
          active: true,
        },
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
        include: {
          subcategories: {
            where: { active: true },
            orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
          },
        },
      });
    } catch (dbErr) {
      console.error("[api/categories] Category table query failed:", dbErr);
    }

    // Get vendor counts per category (for the browse section)
    let countMap = new Map<string, number>();
    try {
      const groups = await db.$queryRaw`
        SELECT ecosystem, category, COUNT(*) as cnt
        FROM vendor_listings
        WHERE approved = true
        GROUP BY ecosystem, category
      ` as { ecosystem: string; category: string; cnt: bigint }[];

      for (const g of groups) {
        const migrated = migrateCategory(g.category);
        const key = `${g.ecosystem}:${migrated}`;
        const prev = countMap.get(key) ?? 0;
        countMap.set(key, prev + Number(g.cnt));
      }
    } catch (countErr) {
      console.error("[api/categories] Vendor count query failed:", countErr);
    }

    // Build response from DB categories only — no hardcoded fallback.
    // If DB is unavailable, dbCategories is empty → frontend shows loading state.
    const categories: CategoryWithCount[] = dbCategories.map((c) => ({
      id: c.slug,
      ecosystem: c.ecosystem as Ecosystem,
      label: c.label,
      description: c.description ?? "",
      icon: c.icon ?? "UtensilsCrossed",
      image: c.image ?? "",
      accent: c.accent ?? "from-amber-400 to-orange-500",
      count: countMap.get(`${c.ecosystem}:${c.slug}`) ?? 0,
      subcategories: c.subcategories?.map((s: any) => ({
        id: s.slug,
        slug: s.slug,
        label: s.label,
      })),
    }));

    return NextResponse.json(
      { categories },
      { headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  } catch (err) {
    console.error("[api/categories] GET failed:", err);
    // Return empty array — frontend will show loading/empty state.
    // Do NOT fall back to hardcoded categories.
    return NextResponse.json({ categories: [] });
  }
}

