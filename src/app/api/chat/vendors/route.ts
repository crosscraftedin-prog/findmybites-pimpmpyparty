import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import { CATEGORY_MIGRATION_MAP } from "@/lib/constants";
import type { Vendor as ApiVendor } from "@/lib/types";

/**
 * GET /api/chat/vendors?categories=bakers-bakery,djs&city=Dubai&limit=5
 * Fetches vendors for the AI chatbot's suggestions.
 */

function transformVendor(v: any, distance: number | null): ApiVendor & { distance: number | null } {
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
    openHours: v.openHours,
    deliveryAvailable: v.deliveryAvailable,
    pickupAvailable: v.pickupAvailable,
    serviceAreas: v.serviceAreas,
    metaTitle: v.metaTitle,
    metaDescription: v.metaDescription,
    latitude: v.latitude,
    longitude: v.longitude,
    serviceRadiusKm: v.serviceRadiusKm,
    userEmail: v.userEmail,
    createdAt: v.createdAt.toISOString(),
    distance,
  };
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const categoriesRaw = sp.get("categories") ?? "";
    const city = sp.get("city") ?? undefined;
    const limitRaw = sp.get("limit");
    const limit = limitRaw ? Math.max(1, Number(limitRaw) || 5) : 5;

    const categories = categoriesRaw.split(",").map((c) => c.trim()).filter(Boolean);
    if (categories.length === 0) {
      return NextResponse.json({ vendors: [] });
    }

    // Expand categories to include old slugs
    const reverseMigrationMap: Record<string, string[]> = {};
    for (const [oldSlug, newSlug] of Object.entries(CATEGORY_MIGRATION_MAP)) {
      if (!reverseMigrationMap[newSlug]) reverseMigrationMap[newSlug] = [];
      reverseMigrationMap[newSlug].push(oldSlug);
    }
    const expandedCategories = new Set<string>();
    for (const cat of categories) {
      expandedCategories.add(cat);
      (reverseMigrationMap[cat] ?? []).forEach((old) => expandedCategories.add(old));
      if (CATEGORY_MIGRATION_MAP[cat]) expandedCategories.add(CATEGORY_MIGRATION_MAP[cat]);
    }

    const where: Prisma.VendorWhereInput = {
      approved: true,
      category: { in: Array.from(expandedCategories) },
    };
    if (city) where.city = { contains: city };

    const rows = await db.vendor.findMany({
      where,
      take: 50,
      orderBy: [{ featured: "desc" }, { rating: "desc" }],
    });

    // Fallback to global if city filter returns nothing
    let finalRows = rows;
    if (city && rows.length === 0) {
      finalRows = await db.vendor.findMany({
        where: { approved: true, category: { in: Array.from(expandedCategories) } },
        take: 50,
        orderBy: [{ featured: "desc" }, { rating: "desc" }],
      });
    }

    const withDistance = finalRows.map((v) => ({ vendor: v, distance: null as number | null }));

    // Sort: featured first, then by rating
    withDistance.sort((a, b) => {
      if (a.vendor.featured !== b.vendor.featured) return a.vendor.featured ? -1 : 1;
      return b.vendor.rating - a.vendor.rating;
    });

    // Limit per-category for variety
    const perCategory = Math.max(1, Math.ceil(limit / categories.length));
    const picked: typeof withDistance = [];
    const seenCategories = new Map<string, number>();
    for (const item of withDistance) {
      const catCount = seenCategories.get(item.vendor.category) ?? 0;
      if (catCount < perCategory && picked.length < limit) {
        picked.push(item);
        seenCategories.set(item.vendor.category, catCount + 1);
      }
    }
    if (picked.length < limit) {
      for (const item of withDistance) {
        if (picked.length >= limit) break;
        if (!picked.includes(item)) picked.push(item);
      }
    }

    return NextResponse.json({
      vendors: picked.map((p) => transformVendor(p.vendor, p.distance)),
    });
  } catch (err) {
    console.error("[api/chat/vendors] GET failed:", err);
    return NextResponse.json({ error: "Failed to fetch vendors for chat" }, { status: 500 });
  }
}
