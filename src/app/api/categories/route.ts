import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CATEGORIES, migrateCategory } from "@/lib/constants";
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

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const ecosystemParam = sp.get("ecosystem") as Ecosystem | null;

    // STEP 1: Try fetching categories from the Category table in DB
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
      console.error("[api/categories] Category table query failed, using hardcoded:", dbErr);
    }

    // STEP 2: Get vendor counts per category (for the browse section)
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

    // STEP 3: If DB has categories, use them. Otherwise fall back to hardcoded.
    if (dbCategories.length > 0) {
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
    }

    // FALLBACK: Use hardcoded categories from constants.ts
    const cats = ecosystemParam
      ? CATEGORIES.filter((c) => c.ecosystem === ecosystemParam)
      : CATEGORIES;

    const categories: CategoryWithCount[] = cats.map((c) => ({
      id: c.id,
      ecosystem: c.ecosystem,
      label: c.label,
      description: c.description,
      icon: c.icon,
      image: c.image,
      accent: c.accent,
      count: countMap.get(`${c.ecosystem}:${c.id}`) ?? 0,
    }));

    return NextResponse.json(
      { categories },
      { headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  } catch (err) {
    console.error("[api/categories] GET failed:", err);
    // Graceful fallback — return hardcoded categories with 0 counts
    const sp = req.nextUrl.searchParams;
    const ecosystemParam = sp.get("ecosystem") as Ecosystem | null;
    const cats = ecosystemParam
      ? CATEGORIES.filter((c) => c.ecosystem === ecosystemParam)
      : CATEGORIES;
    return NextResponse.json({
      categories: cats.map((c) => ({
        id: c.id,
        ecosystem: c.ecosystem,
        label: c.label,
        description: c.description,
        icon: c.icon,
        image: c.image,
        accent: c.accent,
        count: 0,
      })),
    });
  }
}
