import { NextRequest, NextResponse } from "next/server";
import { Prisma, type Vendor as DbVendor } from "@prisma/client";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import {
  searchVendors,
  searchIndexHasRows,
  sanitizeFtsQuery,
} from "@/lib/search";
import type { Vendor as ApiVendor } from "@/lib/types";

function transformVendor(v: DbVendor): ApiVendor {
  return {
    id: v.id,
    name: v.name,
    slug: v.slug,
    ecosystem: v.ecosystem as ApiVendor["ecosystem"],
    category: v.category,
    tagline: v.tagline,
    description: v.description,
    city: v.city,
    country: v.country,
    countryCode: v.countryCode,
    continent: v.continent,
    currency: v.currency,
    priceRange: v.priceRange,
    basePrice: v.basePrice,
    rating: v.rating,
    reviewCount: v.reviewCount,
    heroImage: v.heroImage,
    avatarImage: v.avatarImage,
    gallery: parseJsonArray<string>(v.gallery),
    tags: parseJsonArray<string>(v.tags),
    featured: v.featured,
    verified: v.verified,
    responseTime: v.responseTime,
    yearsActive: v.yearsActive,
    completedBookings: v.completedBookings,
    createdAt: v.createdAt.toISOString(),
  };
}

function resolveOrderBy(
  sort: string
):
  | Prisma.VendorOrderByWithRelationInput[]
  | Prisma.VendorOrderByWithRelationInput {
  switch (sort) {
    case "rating":
      return { rating: "desc" };
    case "reviews":
      return { reviewCount: "desc" };
    case "price-asc":
      return { basePrice: "asc" };
    case "price-desc":
      return { basePrice: "desc" };
    case "newest":
      return { createdAt: "desc" };
    case "featured":
    default:
      return [{ featured: "desc" }, { rating: "desc" }];
  }
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const ecosystem = sp.get("ecosystem") ?? undefined;
    const category = sp.get("category") ?? undefined;
    const continent = sp.get("continent") ?? undefined;
    const search = sp.get("search") ?? undefined;
    const priceRange = sp.get("priceRange") ?? undefined;
    const minRatingRaw = sp.get("minRating");
    const minRating = minRatingRaw ? Number(minRatingRaw) || 0 : 0;
    const sort = sp.get("sort") ?? "featured";
    const featured = sp.get("featured") === "true";
    const limitRaw = sp.get("limit");
    const limit = limitRaw ? Math.max(1, Number(limitRaw) || 60) : 60;

    // Structured (non-search) filters — always applied via Prisma.
    const where: Prisma.VendorWhereInput = {};
    if (ecosystem) where.ecosystem = ecosystem;
    if (category) where.category = category;
    if (continent) where.continent = continent;
    if (priceRange) where.priceRange = priceRange;
    if (featured) where.featured = true;
    if (minRating > 0) where.rating = { gte: minRating };

    // ── Search path ──────────────────────────────────────────────────────
    // When a search term is present we hand it to the FTS5 index, which returns
    // a ranked list of candidate vendor IDs. We then intersect with the
    // structured filters via Prisma. Sorting:
    //   - default ("featured") + search  → order by FTS relevance (rank)
    //   - explicit sort (rating/price/…) + search → honour the user's sort
    //   - no search → pure structured query with the user's sort
    //
    // If the FTS index is unavailable (not built yet, e.g. fresh DB before
    // seed), we transparently fall back to the legacy `contains` LIKE query so
    // the API never 500s.
    const hasFts = search ? await searchIndexHasRows() : false;
    const ftsQuery = search ? sanitizeFtsQuery(search) : "";

    if (search && hasFts && ftsQuery) {
      const hits = await searchVendors(search, ecosystem, 500);
      if (hits.length === 0) {
        // FTS index exists and found nothing → genuinely no matches.
        return NextResponse.json({ vendors: [], total: 0 });
      }
      const rankMap = new Map(hits.map((h) => [h.vendorId, h.rank]));
      where.id = { in: hits.map((h) => h.vendorId) };

      const rows = await db.vendor.findMany({ where, take: 500 });

      let ordered: DbVendor[];
      if (sort === "featured" || sort === "") {
        // Relevance ranking: lower FTS rank = more relevant.
        ordered = rows.sort(
          (a, b) =>
            (rankMap.get(a.id) ?? Infinity) - (rankMap.get(b.id) ?? Infinity)
        );
      } else {
        // User picked an explicit sort — apply it via Prisma-style orderBy on
        // the in-memory array, since we already fetched the candidates.
        ordered = sortInMemory(rows, sort);
      }
      const sliced = ordered.slice(0, limit);
      return NextResponse.json({
        vendors: sliced.map(transformVendor),
        total: ordered.length,
      });
    }

    // Fallback path: no search, OR search but FTS unavailable → LIKE search.
    if (search) {
      // legacy LIKE fallback (kept for resilience if FTS isn't built yet)
      where.OR = [
        { name: { contains: search } },
        { tagline: { contains: search } },
        { city: { contains: search } },
        { country: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const orderBy = resolveOrderBy(sort);
    const [total, rows] = await Promise.all([
      db.vendor.count({ where }),
      db.vendor.findMany({ where, orderBy, take: limit }),
    ]);

    const vendors = rows.map(transformVendor);
    return NextResponse.json({ vendors, total });
  } catch (err) {
    console.error("[api/vendors] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}

/**
 * In-memory sort that mirrors `resolveOrderBy` for the FTS-relevance path
 * where we've already fetched candidate rows and want to apply the user's
 * explicit sort on top of the search matches.
 */
function sortInMemory(rows: DbVendor[], sort: string): DbVendor[] {
  switch (sort) {
    case "rating":
      return rows.sort((a, b) => b.rating - a.rating);
    case "reviews":
      return rows.sort((a, b) => b.reviewCount - a.reviewCount);
    case "price-asc":
      return rows.sort((a, b) => a.basePrice - b.basePrice);
    case "price-desc":
      return rows.sort((a, b) => b.basePrice - a.basePrice);
    case "newest":
      return rows.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    default:
      return rows.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) || b.rating - a.rating
      );
  }
}
