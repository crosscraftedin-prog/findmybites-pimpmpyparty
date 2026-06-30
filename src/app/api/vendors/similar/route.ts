import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import type { Vendor as ApiVendor } from "@/lib/types";

/**
 * GET /api/vendors/similar?vendorId=xxx&limit=4
 *
 * Returns similar vendors for a storefront's "You might also like" section.
 * Logic:
 *   1. Same category + same city (most relevant)
 *   2. Same category + same country
 *   3. Same category (any location)
 *   4. Same ecosystem (fallback)
 *
 * Excludes the current vendor. Only returns approved vendors.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const vendorId = sp.get("vendorId");
    const limitRaw = Number(sp.get("limit"));
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(12, limitRaw) : 4;

    if (!vendorId) {
      return NextResponse.json({ error: "vendorId required" }, { status: 400 });
    }

    // Get the current vendor to find similar ones
    const current = await db.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, category: true, city: true, country: true, countryCode: true, ecosystem: true },
    });

    if (!current) {
      return NextResponse.json({ vendors: [] });
    }

    // Fetch candidates: same category, approved, not the current vendor
    const candidates = await db.vendor.findMany({
      where: {
        id: { not: vendorId },
        approved: true,
        ecosystem: current.ecosystem,
        category: current.category,
      },
      take: 50,
      orderBy: [{ featured: "desc" }, { rating: "desc" }],
    });

    // Rank: same city > same country > same category
    const scored = candidates.map((v) => {
      let score = 0;
      if (v.city === current.city) score += 3;
      if (v.countryCode === current.countryCode) score += 2;
      if (v.featured) score += 1;
      score += Math.min(v.rating / 2, 2.5);
      return { v, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // If not enough same-category, fill with same-ecosystem
    let result = scored.slice(0, limit).map((s) => s.v);
    if (result.length < limit) {
      const fillers = await db.vendor.findMany({
        where: {
          id: { not: vendorId, notIn: result.map((v) => v.id) },
          approved: true,
          ecosystem: current.ecosystem,
        },
        take: limit - result.length,
        orderBy: [{ featured: "desc" }, { rating: "desc" }],
      });
      result = [...result, ...fillers];
    }

    const vendors: ApiVendor[] = result.map((v) => ({
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
      ownership_status: v.ownership_status,
      createdAt: v.createdAt.toISOString(),
    }));

    return NextResponse.json({ vendors });
  } catch (err) {
    console.error("[api/vendors/similar] GET failed:", err);
    return NextResponse.json({ vendors: [] });
  }
}
