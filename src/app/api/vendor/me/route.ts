import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Vendor, Review, Booking } from "@/lib/types";

function transformVendor(v: typeof db.vendor): Vendor {
  return {
    id: v.id,
    name: v.name,
    slug: v.slug,
    ecosystem: v.ecosystem as Vendor["ecosystem"],
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
    approved: v.approved,
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
  };
}

function transformBooking(b: typeof db.booking): Booking {
  return {
    id: b.id,
    vendorId: b.vendorId,
    name: b.name,
    email: b.email,
    eventType: b.eventType,
    eventDate: b.eventDate,
    eventCity: b.eventCity,
    guests: b.guests,
    budget: b.budget,
    message: b.message,
    status: b.status as Booking["status"],
    createdAt: b.createdAt.toISOString(),
  };
}

function transformReview(r: typeof db.review): Review {
  return {
    id: r.id,
    vendorId: r.vendorId,
    author: r.author,
    avatar: r.avatar,
    rating: r.rating,
    comment: r.comment,
    eventDate: r.eventDate,
    createdAt: r.createdAt.toISOString(),
  };
}

/**
 * GET /api/vendor/me
 * Returns the signed-in vendor's dashboard data:
 *  - their listings (vendors) with approval status
 *  - recent bookings across all their listings
 *  - recent reviews across all their listings
 *  - aggregate stats (total listings, pending, bookings, rating)
 */
export async function GET(_req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const email = session.user.email;

    // fetch all vendors owned by this user
    const vendors = await db.vendor.findMany({
      where: { userEmail: email },
      orderBy: { createdAt: "desc" },
    });

    if (vendors.length === 0) {
      return NextResponse.json({
        vendors: [],
        bookings: [],
        reviews: [],
        stats: { totalListings: 0, pending: 0, approved: 0, totalBookings: 0, avgRating: 0 },
      });
    }

    const vendorIds = vendors.map((v) => v.id);

    // fetch recent bookings + reviews across all their vendors
    const [bookings, reviews] = await Promise.all([
      db.booking.findMany({
        where: { vendorId: { in: vendorIds } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      db.review.findMany({
        where: { vendorId: { in: vendorIds } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    // stats
    const totalBookings = await db.booking.count({
      where: { vendorId: { in: vendorIds } },
    });
    const pendingBookings = await db.booking.count({
      where: { vendorId: { in: vendorIds }, status: "pending" },
    });
    const approvedCount = vendors.filter((v) => v.approved).length;
    const pendingCount = vendors.filter((v) => !v.approved).length;
    const avgRating =
      vendors.length > 0
        ? Math.round(
            (vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length) * 10
          ) / 10
        : 0;

    return NextResponse.json({
      vendors: vendors.map(transformVendor),
      bookings: bookings.map((b) => ({
        ...transformBooking(b),
        vendorName: vendors.find((v) => v.id === b.vendorId)?.name ?? "—",
      })),
      reviews: reviews.map((r) => ({
        ...transformReview(r),
        vendorName: vendors.find((v) => v.id === r.vendorId)?.name ?? "—",
      })),
      stats: {
        totalListings: vendors.length,
        pending: pendingCount,
        approved: approvedCount,
        totalBookings,
        pendingBookings,
        avgRating,
      },
    });
  } catch (err) {
    console.error("[api/vendor/me] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch vendor dashboard" },
      { status: 500 }
    );
  }
}
