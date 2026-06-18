import { NextRequest, NextResponse } from "next/server";
import { Prisma, type Vendor as DbVendor } from "@prisma/client";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import { COUNTRIES, getCategory, SUBCATEGORIES } from "@/lib/constants";
import {
  isValidEcosystem,
  isValidPriceRange,
  sanitizeInstagram,
  sanitizeWebsite,
  sanitizeWhatsApp,
  resolveSubcategory,
  isSafeUploadUrl,
} from "@/lib/vendor-sanitize";
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
    subcategory: v.subcategory,
    state: v.state,
    address: v.address,
    zipCode: v.zipCode,
    instagram: v.instagram,
    website: v.website,
    whatsapp: v.whatsapp,
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

// ── POST: vendor self-listing ("List your business") ──────────────────────

interface CreateVendorBody {
  name?: unknown;
  ecosystem?: unknown;
  category?: unknown;
  tagline?: unknown;
  description?: unknown;
  city?: unknown;
  countryCode?: unknown;
  currency?: unknown;
  priceRange?: unknown;
  basePrice?: unknown;
  tags?: unknown;
  responseTime?: unknown;
  yearsActive?: unknown;
  logoUrl?: unknown;
  bannerUrl?: unknown;
  subcategory?: unknown;
  state?: unknown;
  address?: unknown;
  zipCode?: unknown;
  instagram?: unknown;
  website?: unknown;
  whatsapp?: unknown;
}

const VALID_ECOSYSTEMS = new Set(["FINDMYBITES", "PIMPMYPARTY"]);
const VALID_PRICE_RANGES = new Set(["$", "$$", "$$$", "$$$$"]);
void VALID_ECOSYSTEMS;
void VALID_PRICE_RANGES;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateVendorBody;

    // --- validate & coerce ---
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const tagline = typeof body.tagline === "string" ? body.tagline.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";

    const ecosystem = isValidEcosystem(body.ecosystem) ? body.ecosystem : "";
    const category = typeof body.category === "string" ? body.category : "";
    const countryCode =
      typeof body.countryCode === "string" ? body.countryCode.toUpperCase() : "";
    const currency =
      typeof body.currency === "string" ? body.currency.toUpperCase() : "";
    const priceRange = isValidPriceRange(body.priceRange) ? body.priceRange : "";

    const basePriceNum = Number(body.basePrice);
    const basePrice = Number.isFinite(basePriceNum) && basePriceNum >= 0
      ? Math.round(basePriceNum)
      : 0;

    const yearsActiveNum = Number(body.yearsActive);
    const yearsActive =
      Number.isFinite(yearsActiveNum) && yearsActiveNum >= 0
        ? Math.round(yearsActiveNum)
        : 1;

    const responseTime =
      typeof body.responseTime === "string" && body.responseTime.trim()
        ? body.responseTime.trim()
        : "under 24 hours";

    // --- optional contact + location fields (sanitized) ---
    const subcategory = resolveSubcategory(body.subcategory, category);

    const state =
      typeof body.state === "string" && body.state.trim()
        ? body.state.trim().slice(0, 80)
        : null;

    const address =
      typeof body.address === "string" && body.address.trim()
        ? body.address.trim().slice(0, 200)
        : null;

    const zipCode =
      typeof body.zipCode === "string" && body.zipCode.trim()
        ? body.zipCode.trim().slice(0, 20)
        : null;

    const instagram = sanitizeInstagram(body.instagram) || null;
    const website = sanitizeWebsite(body.website) || null;
    const whatsapp = sanitizeWhatsApp(body.whatsapp) || null;

    // tags: accept string[] or comma-separated string
    let tags: string[] = [];
    if (Array.isArray(body.tags)) {
      tags = body.tags
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim())
        .filter(Boolean);
    } else if (typeof body.tags === "string") {
      tags = body.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }
    tags = tags.slice(0, 10);

    // --- required-field check ---
    const missing: string[] = [];
    if (!name) missing.push("name");
    if (!ecosystem) missing.push("ecosystem");
    if (!category) missing.push("category");
    if (!tagline) missing.push("tagline");
    if (!description) missing.push("description");
    if (!city) missing.push("city");
    if (!countryCode) missing.push("country");
    if (!currency) missing.push("currency");
    if (!priceRange) missing.push("priceRange");
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // --- derive country + continent from the country code ---
    const countryDef = COUNTRIES.find((c) => c.code === countryCode);
    if (!countryDef) {
      return NextResponse.json(
        { error: `Unsupported country code: ${countryCode}` },
        { status: 400 }
      );
    }
    const countryName = countryDef.name;
    const continent = countryDef.continent;

    // --- derive a unique slug ---
    const base = `${name}-${city}`
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    let slug = base || `vendor-${Date.now()}`;
    let suffix = 1;
    while (await db.vendor.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }

    // --- images: prefer uploaded banner/logo, fall back to category default ---
    const cat = getCategory(category);
    const fallbackImage = cat?.image ?? "/vendors/baker.png";

    const bannerUrl = isSafeUploadUrl(body.bannerUrl) ? body.bannerUrl : "";
    const logoUrl = isSafeUploadUrl(body.logoUrl) ? body.logoUrl : "";

    const heroImage = bannerUrl || fallbackImage;
    const avatarImage = logoUrl || bannerUrl || fallbackImage;
    const gallery = [heroImage, logoUrl].filter(Boolean);

    // --- create ---
    const created = await db.vendor.create({
      data: {
        name,
        slug,
        ecosystem,
        category,
        tagline,
        description,
        city,
        country: countryName,
        countryCode,
        continent,
        currency,
        priceRange,
        basePrice,
        rating: 0,
        reviewCount: 0,
        heroImage,
        avatarImage,
        gallery: JSON.stringify(
          gallery.length > 0 ? gallery : [fallbackImage]
        ),
        tags: JSON.stringify(tags),
        featured: false,
        verified: true,
        responseTime,
        yearsActive,
        completedBookings: 0,
        subcategory,
        state,
        address,
        zipCode,
        instagram,
        website,
        whatsapp,
      },
    });

    return NextResponse.json(
      { vendor: transformVendor(created) },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api/vendors] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 }
    );
  }
}
