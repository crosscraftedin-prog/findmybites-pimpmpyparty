import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Vendor, Review, Booking } from "@/lib/types";

/**
 * GET /api/vendor/me
 *
 * Returns the signed-in vendor's dashboard data:
 *   - their listings (vendors) with approval status
 *   - recent bookings across all their listings
 *   - recent reviews across all their listings
 *   - aggregate stats (total listings, pending, bookings, rating)
 *
 * This endpoint is the FIRST call the dashboard makes. If it fails, the
 * entire dashboard is stuck loading. Therefore this route is bulletproofed:
 *   1. Every Prisma query is individually try/caught.
 *   2. Promise.all → Promise.allSettled (one failure doesn't crash the rest).
 *   3. The catch block returns the REAL error message (not a generic string).
 *   4. If vendor not found → returns { vendors: [] } with 200 (not 500).
 *   5. If not authenticated → returns 401 (not 500).
 */

function transformVendor(v: any): Vendor {
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
    subcategory: v.subcategory ?? null,
    state: v.state ?? null,
    address: v.address ?? null,
    zipCode: v.zipCode ?? null,
    instagram: v.instagram ?? null,
    website: v.website ?? null,
    whatsapp: v.whatsapp ?? null,
    openHours: v.openHours ?? null,
    deliveryAvailable: v.deliveryAvailable,
    pickupAvailable: v.pickupAvailable,
    serviceAreas: v.serviceAreas ?? null,
    metaTitle: v.metaTitle ?? null,
    metaDescription: v.metaDescription ?? null,
    latitude: v.latitude ?? null,
    longitude: v.longitude ?? null,
    serviceRadiusKm: v.serviceRadiusKm ?? null,
    userEmail: v.userEmail ?? null,
    ownership_status: v.ownership_status ?? null,
    planExpiresAt: v.planExpiresAt?.toISOString?.() ?? null,
    settingsLocked: v.settingsLocked ?? false,
    facebook: v.facebook ?? null,
    youtube: v.youtube ?? null,
    tiktok: v.tiktok ?? null,
    twitter: v.twitter ?? null,
    snapchat: v.snapchat ?? null,
    fssaiNumber: v.fssaiNumber ?? null,
    createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : String(v.createdAt),
  };
}

function transformBooking(b: any): Booking & { vendorName: string } {
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
    createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : String(b.createdAt),
    phone: b.phone ?? null,
    eventTime: b.eventTime ?? null,
    address: b.address ?? null,
    notes: b.notes ?? null,
    referenceImage: b.referenceImage ?? null,
    preferredContact: b.preferredContact ?? null,
    productId: b.productId ?? null,
    aiSummary: b.aiSummary ?? null,
    leadScore: b.leadScore ?? null,
    aiQualification: b.aiQualification ?? null,
    conciergeEventId: b.conciergeEventId ?? null,
    vendorName: "—",
  };
}

function transformReview(r: any): Review & { vendorName: string } {
  return {
    id: r.id,
    vendorId: r.vendorId,
    author: r.author,
    avatar: r.avatar,
    rating: r.rating,
    comment: r.comment,
    eventDate: r.eventDate,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    vendorName: "—",
  };
}

export async function GET(_req: NextRequest) {
  const startTime = Date.now();

  try {
    // ── 1. Session handling ──
    const supabase = await createSupabaseServerClient();
    let userId: string | null = null;
    let userEmail: string | null = null;

    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (!userErr && user) {
        userId = user.id;
        userEmail = user.email ?? null;
      }
    } catch {}

    // Fallback to getSession()
    if (!userId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          userId = session.user.id;
          userEmail = session.user.email ?? null;
        }
      } catch {}
    }

    if (!userId) {
      console.log("[api/vendor/me] No session — returning 401");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log(`[api/vendor/me] User: ${userId} (${userEmail || "no email"})`);

    // ── 2. Vendor lookup ──
    let vendors: any[] = [];
    try {
      vendors = await db.vendor.findMany({
        where: { owner_user_id: userId },
        orderBy: { createdAt: "desc" },
        // Only select fields needed by the dashboard (reduces payload)
        select: {
          id: true, name: true, slug: true, ecosystem: true, category: true,
          tagline: true, description: true, city: true, country: true,
          countryCode: true, continent: true, currency: true, priceRange: true,
          basePrice: true, rating: true, reviewCount: true, heroImage: true,
          avatarImage: true, gallery: true, tags: true, featured: true,
          verified: true, approved: true, responseTime: true, yearsActive: true,
          completedBookings: true, subcategory: true, state: true, address: true,
          zipCode: true, instagram: true, website: true, whatsapp: true,
          facebook: true, youtube: true, tiktok: true, twitter: true,
          snapchat: true, pinterest: true, linkedin: true, telegram: true,
          fssaiNumber: true, settingsLocked: true, openHours: true,
          deliveryAvailable: true, pickupAvailable: true, serviceAreas: true,
          metaTitle: true, metaDescription: true, latitude: true, longitude: true,
          serviceRadiusKm: true, userEmail: true, owner_user_id: true,
          ownership_status: true, planExpiresAt: true, createdAt: true,
          businessType: true, yearStarted: true, businessRegNumber: true,
          gstVatNumber: true, languagesSpoken: true, hideAddress: true,
          holidayMode: true, vacationMode: true, emergencyClosure: true,
          homeService: true, onlineConsultation: true, maxOrder: true,
          prepTime: true, bookingNotice: true, responseRate: true,
          profileViews: true, productViews: true, galleryViews: true,
          invite_type: true,
        },
      });
    } catch (vendorErr: any) {
      console.error("[api/vendor/me] db.vendor.findMany FAILED:", {
        error: vendorErr.message,
        code: vendorErr.code,
        meta: vendorErr.meta,
      });
      // Return empty instead of crashing — the dashboard shows "no business" state
      return NextResponse.json({
        vendors: [],
        bookings: [],
        reviews: [],
        stats: { totalListings: 0, pending: 0, approved: 0, totalBookings: 0, pendingBookings: 0, avgRating: 0 },
        error: "Database query failed",
      });
    }

    if (vendors.length === 0) {
      console.log(`[api/vendor/me] No vendors found for user ${userId} — returning empty`);
      return NextResponse.json({
        vendors: [],
        bookings: [],
        reviews: [],
        stats: { totalListings: 0, pending: 0, approved: 0, totalBookings: 0, pendingBookings: 0, avgRating: 0 },
      });
    }

    console.log(`[api/vendor/me] Found ${vendors.length} vendor(s): ${vendors.map(v => v.id).join(", ")}`);

    const vendorIds = vendors.map((v) => v.id);

    // ── 3. Fetch bookings + reviews + counts using Promise.allSettled ──
    // Each query is independent — if one fails, the others still succeed.
    const [bookingsResult, reviewsResult, totalBookingsResult, pendingBookingsResult] = await Promise.allSettled([
      db.booking.findMany({
        where: { vendorId: { in: vendorIds } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      db.review.findMany({
        where: { vendorId: { in: vendorIds } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      db.booking.count({
        where: { vendorId: { in: vendorIds } },
      }),
      db.booking.count({
        where: { vendorId: { in: vendorIds }, status: "pending" },
      }),
    ]);

    // Extract results (default to empty/0 if the promise was rejected)
    const bookings = bookingsResult.status === "fulfilled" ? bookingsResult.value : [];
    const reviews = reviewsResult.status === "fulfilled" ? reviewsResult.value : [];
    const totalBookings = totalBookingsResult.status === "fulfilled" ? totalBookingsResult.value : 0;
    const pendingBookings = pendingBookingsResult.status === "fulfilled" ? pendingBookingsResult.value : 0;

    // Log any failures (non-fatal)
    if (bookingsResult.status === "rejected") {
      console.error("[api/vendor/me] db.booking.findMany failed (non-fatal):", bookingsResult.reason?.message);
    }
    if (reviewsResult.status === "rejected") {
      console.error("[api/vendor/me] db.review.findMany failed (non-fatal):", reviewsResult.reason?.message);
    }

    // ── 4. Stats ──
    const approvedCount = vendors.filter((v) => v.approved).length;
    const pendingCount = vendors.filter((v) => !v.approved).length;
    const avgRating =
      vendors.length > 0
        ? Math.round((vendors.reduce((sum, v) => sum + (v.rating || 0), 0) / vendors.length) * 10) / 10
        : 0;

    // ── 5. Transform + return ──
    const transformedVendors = vendors.map(transformVendor);
    const transformedBookings = bookings.map((b: any) => {
      const t = transformBooking(b);
      t.vendorName = vendors.find((v) => v.id === b.vendorId)?.name ?? "—";
      return t;
    });
    const transformedReviews = reviews.map((r: any) => {
      const t = transformReview(r);
      t.vendorName = vendors.find((v) => v.id === r.vendorId)?.name ?? "—";
      return t;
    });

    const elapsed = Date.now() - startTime;
    console.log(`[api/vendor/me] Success in ${elapsed}ms — ${vendors.length} vendors, ${bookings.length} bookings, ${reviews.length} reviews`);

    return NextResponse.json({
      vendors: transformedVendors,
      bookings: transformedBookings,
      reviews: transformedReviews,
      stats: {
        totalListings: vendors.length,
        pending: pendingCount,
        approved: approvedCount,
        totalBookings,
        pendingBookings,
        avgRating,
      },
    });
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[api/vendor/me] CRASH after ${elapsed}ms:`, {
      message: error?.message,
      code: error?.code,
      stack: error?.stack?.split("\n").slice(0, 5).join("\n"),
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        code: error?.code,
      },
      { status: 500 }
    );
  }
}
