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
    approved: v.approved,
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
    latitude: v.latitude,
    longitude: v.longitude,
    serviceRadiusKm: v.serviceRadiusKm,
    userEmail: v.userEmail,
    createdAt: v.createdAt.toISOString(),
  };
}

/**
 * GET /api/admin/vendors
 * Admin-scoped vendor list with search, ecosystem filter, featured/verified
 * filters, and pagination. Returns { vendors, total, page, pageSize }.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const ecosystem = sp.get("ecosystem") ?? undefined;
    const search = sp.get("search") ?? undefined;
    const featured = sp.get("featured"); // "true" | "false"
    const verified = sp.get("verified");
    const approved = sp.get("approved");
    const pageRaw = Number(sp.get("page"));
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.round(pageRaw) : 1;
    const pageSizeRaw = Number(sp.get("pageSize"));
    const pageSize =
      Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
        ? Math.min(100, Math.round(pageSizeRaw))
        : 20;

    const where: Prisma.VendorWhereInput = {};
    if (ecosystem) where.ecosystem = ecosystem;
    if (featured === "true") where.featured = true;
    if (featured === "false") where.featured = false;
    if (verified === "true") where.verified = true;
    if (verified === "false") where.verified = false;
    if (approved === "true") where.approved = true;
    if (approved === "false") where.approved = false;
    if (verified === "false") where.verified = false;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { city: { contains: search } },
        { country: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const [total, rows] = await Promise.all([
      db.vendor.count({ where }),
      db.vendor.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      vendors: rows.map(transformVendor),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    console.error("[api/admin/vendors] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}
