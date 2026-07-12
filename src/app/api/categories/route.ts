import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { migrateCategory } from "@/lib/constants";
import type { Ecosystem } from "@/lib/types";

// PERFORMANCE: In-memory cache for categories (5-minute TTL).
// IMPORTANT: Cache is keyed by ecosystem so FindMyBites and PimpMyParty
// categories are cached SEPARATELY. This prevents cross-marketplace
// category leakage (the bug where switching marketplaces showed the
// previous marketplace's categories).
let _cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes (was 5 min)

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
 * Normalize the ecosystem parameter from either `ecosystem` or `marketplace`
 * query param. Accepts case-insensitive values:
 *   - "findmybites" / "FINDMYBITES" → "FINDMYBITES"
 *   - "pimpmyparty" / "PIMPMYPARTY" → "PIMPMYPARTY"
 */
function resolveEcosystem(sp: URLSearchParams): Ecosystem | null {
  const raw = sp.get("ecosystem") || sp.get("marketplace");
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper === "FINDMYBITES" || upper === "PIMPMYPARTY") return upper;
  return null;
}

/**
 * GET /api/categories?ecosystem=FINDMYBITES|PIMPMYPARTY
 * GET /api/categories?marketplace=findmybites|pimpmyparty
 *
 * SINGLE SOURCE OF TRUTH: the Category table in the database (managed via
 * Admin Panel). No hardcoded fallback — if the DB is unavailable, returns
 * an empty array so the frontend shows a loading state instead of legacy
 * categories.
 *
 * Categories are ALWAYS filtered by ecosystem at the database level.
 * FindMyBites only returns food categories; PimpMyParty only returns event
 * categories. There is no way to get cross-marketplace categories from
 * this endpoint.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const ecosystemParam = resolveEcosystem(sp);

    // Cache key includes ecosystem so each marketplace has its own cache entry.
    // If no ecosystem is specified, use "_all" as the key (returns all active
    // categories regardless of ecosystem — used by admin panels).
    const cacheKey = ecosystemParam || "_all";

    // Check in-memory cache (keyed by ecosystem)
    const cached = _cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return NextResponse.json(
        { categories: cached.data },
        { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } }
      );
    }

    // Fetch categories from the Category table (admin-managed).
    // ALWAYS filter by ecosystem when specified — this is the backend
    // enforcement that prevents cross-marketplace category leakage.
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

    // Store in cache (keyed by ecosystem)
    _cache.set(cacheKey, { data: categories, expiry: Date.now() + CACHE_TTL_MS });

    return NextResponse.json(
      { categories },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } }
    );
  } catch (err) {
    console.error("[api/categories] GET failed:", err);
    // Return empty array — frontend will show loading/empty state.
    // Do NOT fall back to hardcoded categories.
    return NextResponse.json({ categories: [] });
  }
}
