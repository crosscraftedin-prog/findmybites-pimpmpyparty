import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import { CURRENCY_SYMBOLS } from "@/lib/constants";
import { getCategoryLabel } from "@/lib/category-server";
import type { Vendor as ApiVendor } from "@/lib/types";

/**
 * GET /api/vendors/compare?ids=id1,id2,id3
 *
 * Returns multiple vendors side-by-side for comparison.
 * Used by the vendor comparison feature.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const idsParam = sp.get("ids") || "";
    const ids = idsParam.split(",").filter(Boolean).slice(0, 4); // max 4 vendors

    if (ids.length < 2) {
      return NextResponse.json({ error: "At least 2 vendor IDs required" }, { status: 400 });
    }

    const vendors = await db.vendor.findMany({
      where: { id: { in: ids }, approved: true },
      include: {
        products: {
          where: { isAvailable: true },
          take: 3,
          orderBy: [{ isFeatured: "desc" }, { price: "asc" }],
        },
      },
    });

    // Sort to match the requested order
    const sorted = ids.map((id) => vendors.find((v) => v.id === id)).filter(Boolean);

    const result = sorted.map((v: any) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      ecosystem: v.ecosystem,
      category: v.category,
      categoryLabel: await getCategoryLabel(v.category),
      tagline: v.tagline,
      city: v.city,
      country: v.country,
      countryCode: v.countryCode,
      rating: v.rating,
      reviewCount: v.reviewCount,
      priceRange: v.priceRange,
      basePrice: v.basePrice,
      currency: v.currency,
      currencySymbol: CURRENCY_SYMBOLS[v.currency] ?? v.currency,
      heroImage: v.heroImage,
      avatarImage: v.avatarImage,
      featured: v.featured,
      verified: v.verified,
      responseTime: v.responseTime,
      yearsActive: v.yearsActive,
      completedBookings: v.completedBookings,
      deliveryAvailable: v.deliveryAvailable,
      pickupAvailable: v.pickupAvailable,
      serviceRadiusKm: v.serviceRadiusKm,
      tags: parseJsonArray<string>(v.tags),
      topProducts: v.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        image: p.image,
      })),
    }));

    return NextResponse.json({ vendors: result });
  } catch (err) {
    console.error("[api/vendors/compare] GET failed:", err);
    return NextResponse.json({ vendors: [] });
  }
}
