import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import type { Vendor as ApiVendor } from "@/lib/types";

/**
 * POST /api/filters/search
 *
 * Search vendors by category + dynamic filter values.
 * Body: {
 *   category: string,          // e.g. "caterers"
 *   filterValueIds: string[],  // IDs of FilterValues to match
 *   ecosystem?: string,        // FINDMYBITES | PIMPMYPARTY
 *   city?: string,             // optional city filter
 *   limit?: number             // default 24
 * }
 *
 * Returns vendors that have AT LEAST ONE of the selected filter values.
 * If no filterValueIds, returns all approved vendors in that category.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, filterValueIds, ecosystem, city, limit: bodyLimit } = body as {
      category?: string;
      filterValueIds?: string[];
      ecosystem?: string;
      city?: string;
      limit?: number;
    };

    if (!category) {
      return NextResponse.json({ error: "Category required" }, { status: 400 });
    }

    const limit = Math.min(100, bodyLimit || 24);

    // Build base where clause
    const where: Record<string, unknown> = {
      approved: true,
      category,
    };
    if (ecosystem) where.ecosystem = ecosystem;
    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    // If filter values are specified, find vendors that have ANY of them
    let vendorIds: string[] | null = null;
    if (filterValueIds && filterValueIds.length > 0) {
      const vendorFilterValues = await db.vendorFilterValue.findMany({
        where: { filterValueId: { in: filterValueIds } },
        select: { vendorId: true },
        distinct: ["vendorId"],
      });
      vendorIds = vendorFilterValues.map((v) => v.vendorId);

      if (vendorIds.length === 0) {
        // No vendors match any filter → return empty
        return NextResponse.json({ vendors: [], total: 0 });
      }

      where.id = { in: vendorIds };
    }

    const rows = await db.vendor.findMany({
      where,
      take: limit,
      orderBy: [{ featured: "desc" }, { rating: "desc" }, { reviewCount: "desc" }],
    });

    const vendors: ApiVendor[] = rows.map((v: any) => ({
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

    return NextResponse.json({ vendors, total: vendors.length });
  } catch (error: any) {
    console.error("[api/filters/search] Error:", error.message);
    return NextResponse.json({ vendors: [], total: 0 });
  }
}
