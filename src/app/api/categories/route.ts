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

    // Use raw SQL with a timeout to avoid Prisma connection pool issues on Vercel.
    // Group by ecosystem+category and count approved vendors in one query.
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
    } catch (dbErr) {
      console.error("[api/categories] DB query failed, returning 0 counts:", dbErr);
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
