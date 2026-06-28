import { NextRequest, NextResponse } from "next/server";
import { Prisma, type Vendor as DbVendor } from "@prisma/client";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import { haversineKm } from "@/lib/geocode";
import type { Vendor, VendorWithDistance } from "@/lib/types";

function transformVendor(v: DbVendor): Vendor {
  return {
    id: v.id,
    name: v.name,
    slug: v.slug,
    ecosystem: v.ecosystem as "FINDMYBITES" | "PIMPMYPARTY",
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
  };
}

/**
 * GET /api/vendors/near?lat=&lng=&radius=&ecosystem=&limit=&category=
 *
 * Geo-aware vendor search:
 *  1. SQL bounding-box prefilter (cheap, uses the lat/lng columns) so we
 *     only fetch candidate rows within a ~radius square. This keeps the
 *     query fast at tens of thousands of rows without a spatial index.
 *  2. Exact Haversine distance computed in JS for each candidate.
 *  3. Filter: distance <= customerRadius AND (vendor.serviceRadiusKm is null
 *     OR distance <= vendor.serviceRadiusKm). I.e. the vendor must be within
 *     the customer's search radius AND within the vendor's travel radius.
 *  4. Sort by distance (closest first), tie-broken by rating then reviews
 *     for a "popular near you" boost.
 *  5. Limit (default 50).
 *
 * radius=0 (or omitted) means "Global" — no distance filter, sorted by
 * rating instead (so the page still shows great vendors worldwide).
 */
export async function GET(req: NextRequest) {
  // Parse params OUTSIDE the try block so the catch block can access them
  // (const is block-scoped — variables declared inside try aren't visible
  // in catch, which would cause a ReferenceError in the error handler itself).
  const sp = req.nextUrl.searchParams;
  const lat = Number(sp.get("lat"));
  const lng = Number(sp.get("lng"));
  const radiusParam = Number(sp.get("radius"));
  const radius =
    Number.isFinite(radiusParam) && radiusParam > 0 ? radiusParam : 0;
  const ecosystem = sp.get("ecosystem") ?? undefined;
  const category = sp.get("category") ?? undefined;
  const minRating = Number(sp.get("minRating")) || 0;
  const verifiedOnly = sp.get("verified") === "true";
  const featuredOnly = sp.get("featured") === "true";
  const limitParam = Number(sp.get("limit"));
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(100, Math.round(limitParam))
      : 50;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "Valid lat and lng query parameters are required." },
      { status: 400 }
    );
  }

  try {
    const where: Prisma.VendorWhereInput = {
      latitude: { not: null },
      longitude: { not: null },
      approved: true, // only show approved vendors publicly
    };
    if (ecosystem) where.ecosystem = ecosystem;
    if (category) where.category = category;
    if (minRating > 0) where.rating = { gte: minRating };
    if (verifiedOnly) where.verified = true;
    if (featuredOnly) where.featured = true;

    // Bounding box: 1 deg latitude ≈ 111 km. For longitude, shrink by
    // cos(lat). Add a small safety margin. When radius=0 (global) skip the
    // box and just return top-rated vendors worldwide.
    if (radius > 0) {
      const latDelta = radius / 111 + 0.05;
      const lngDelta = radius / (111 * Math.cos((lat * Math.PI) / 180)) + 0.05;
      where.AND = [
        { latitude: { gte: lat - latDelta, lte: lat + latDelta } },
        { longitude: { gte: lng - lngDelta, lte: lng + lngDelta } },
      ];
    }

    const rows = await db.vendor.findMany({
      where,
      orderBy: radius > 0 ? undefined : [{ featured: "desc" }, { rating: "desc" }],
      take: radius > 0 ? 500 : limit,
    });

    // Compute exact distance + apply radius + service-radius filters.
    const withDistance = rows
      .map((v) => {
        const distance =
          v.latitude != null && v.longitude != null
            ? haversineKm(lat, lng, v.latitude, v.longitude)
            : Infinity;
        return { v, distance };
      })
      .filter(({ v, distance }) => {
        // customer's search radius (0 = global, no distance cap)
        if (radius > 0 && distance > radius) return false;
        // vendor's travel radius: only applies in radius mode (the vendor
        // would actually travel to the customer). In global mode the customer
        // is just browsing, so we show everyone regardless of travel radius.
        if (
          radius > 0 &&
          v.serviceRadiusKm != null &&
          distance > v.serviceRadiusKm
        )
          return false;
        return true;
      });

    // Sort: nearest first (when radius>0), tie-break by rating then reviews
    // for a "popular near you" boost. Global mode is already sorted by rating.
    if (radius > 0) {
      withDistance.sort(
        (a, b) =>
          a.distance - b.distance ||
          b.v.rating - a.v.rating ||
          b.v.reviewCount - a.v.reviewCount
      );
    }

    const vendors: VendorWithDistance[] = withDistance
      .slice(0, limit)
      .map(({ v, distance }) => ({
        ...transformVendor(v),
        distance: Math.round(distance * 10) / 10,
      }));

    return NextResponse.json({
      vendors,
      total: withDistance.length,
      center: { lat, lng },
      radius,
    });
  } catch (err) {
    console.error("[api/vendors/near] GET failed:", err);
    // Return empty list instead of 500 so the UI shows "no vendors" state
    // instead of an error — matches the pattern used in /api/vendors and /api/stats
    return NextResponse.json({
      vendors: [],
      total: 0,
      center: { lat, lng },
      radius,
    });
  }
}
