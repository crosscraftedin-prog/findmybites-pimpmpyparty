import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import type { Review as ApiReview, VendorWithRelations } from "@/lib/types";

type DbVendorWithReviews = Prisma.VendorGetPayload<{
  include: { reviews: true };
}>;

function transformVendor(v: DbVendorWithReviews): VendorWithRelations {
  return {
    id: v.id,
    name: v.name,
    slug: v.slug,
    ecosystem: v.ecosystem as VendorWithRelations["ecosystem"],
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
    reviews: v.reviews.map<ApiReview>((r) => ({
      id: r.id,
      vendorId: r.vendorId,
      author: r.author,
      avatar: r.avatar,
      rating: r.rating,
      comment: r.comment,
      eventDate: r.eventDate,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const vendor = await db.vendor.findUnique({
      where: { slug },
      include: { reviews: { orderBy: { createdAt: "desc" } } },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(transformVendor(vendor));
  } catch (err) {
    console.error("[api/vendors/[slug]] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
      { status: 500 }
    );
  }
}
