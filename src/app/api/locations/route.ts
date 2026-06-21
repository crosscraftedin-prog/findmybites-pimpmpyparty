import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CATEGORIES, migrateCategory } from "@/lib/constants";

/**
 * GET /api/locations
 * Returns location hierarchy (countries → states → cities) with vendor counts
 * for SEO page generation. Optional ?ecosystem=FINDMYBITES|PIMPMYPARTY filter.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const ecosystem = sp.get("ecosystem");

    const where = {
      approved: true,
      ...(ecosystem ? { ecosystem } : {}),
    };

    const [countries, states, cities, cityCategories] = await Promise.all([
      db.vendor.groupBy({ by: ["country", "countryCode"], where, _count: { id: true }, orderBy: { _count: { id: "desc" } } }).catch(() => []),
      db.vendor.groupBy({ by: ["country", "state"], where: { ...where, state: { not: null } }, _count: { id: true }, orderBy: { _count: { id: "desc" } } }).catch(() => []),
      db.vendor.groupBy({ by: ["country", "state", "city"], where, _count: { id: true }, orderBy: { _count: { id: "desc" } } }).catch(() => []),
      db.vendor.groupBy({ by: ["country", "city", "category"], where, _count: { id: true } }).catch(() => []),
    ]);

    const cityCategoryMap = new Map<string, number>();
    for (const cc of cityCategories) {
      const migrated = migrateCategory(cc.category);
      const key = `${cc.country}:${cc.city}:${migrated}`;
      cityCategoryMap.set(key, (cityCategoryMap.get(key) ?? 0) + cc._count.id);
    }

    return NextResponse.json({
      countries: countries.map((c) => ({
        country: c.country,
        countryCode: c.countryCode,
        slug: slugify(c.country),
        count: c._count.id,
      })),
      states: states.filter((s) => s.state).map((s) => ({
        country: s.country,
        state: s.state!,
        slug: slugify(s.state!),
        count: s._count.id,
      })),
      cities: cities.map((c) => ({
        country: c.country,
        state: c.state ?? "",
        city: c.city,
        slug: slugify(c.city),
        count: c._count.id,
      })),
      categories: CATEGORIES.map((cat) => ({
        id: cat.id,
        label: cat.label,
        ecosystem: cat.ecosystem,
        slug: cat.id,
      })),
      cityCategoryCounts: Object.fromEntries(cityCategoryMap),
    });
  } catch {
    return NextResponse.json({ countries: [], states: [], cities: [], categories: [], cityCategoryCounts: {} });
  }
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
