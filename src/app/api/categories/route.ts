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
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const ecosystemParam = sp.get("ecosystem") as Ecosystem | null;

    const cats = ecosystemParam
      ? CATEGORIES.filter((c) => c.ecosystem === ecosystemParam)
      : CATEGORIES;

    // SINGLE groupBy query instead of N+1 sequential counts.
    // Groups by ecosystem+category and returns counts in one DB call.
    let groupCounts: { ecosystem: string; category: string; count: bigint }[] = [];
    try {
      const groups = await db.vendor.groupBy({
        by: ["ecosystem", "category"],
        where: { approved: true },
        _count: { _all: true },
      });
      // Convert to a lookup map (apply migrateCategory so old slugs count too)
      groupCounts = groups.map((g) => ({
        ecosystem: g.ecosystem,
        category: migrateCategory(g.category),
        count: BigInt(g._count._all),
      }));
    } catch {
      // DB unavailable — return all categories with count 0
    }

    // Build a lookup: `${ecosystem}:${migratedCategory}` → count
    const countMap = new Map<string, number>();
    for (const g of groupCounts) {
      const key = `${g.ecosystem}:${g.category}`;
      const prev = countMap.get(key) ?? 0;
      countMap.set(key, prev + Number(g.count));
    }

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

    return NextResponse.json({ categories }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
  } catch (err) {
    console.error("[api/categories] GET failed:", err);
    // Graceful fallback — return categories with 0 counts
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
