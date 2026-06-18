import { NextRequest, NextResponse } from "next/server";
import { Prisma, type Vendor as DbVendor } from "@prisma/client";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
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
): Prisma.VendorOrderByWithRelationInput[] | Prisma.VendorOrderByWithRelationInput {
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

    const where: Prisma.VendorWhereInput = {};
    if (ecosystem) where.ecosystem = ecosystem;
    if (category) where.category = category;
    if (continent) where.continent = continent;
    if (priceRange) where.priceRange = priceRange;
    if (featured) where.featured = true;
    if (minRating > 0) where.rating = { gte: minRating };
    if (search) {
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
