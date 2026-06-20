import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/stats
 * Aggregated metrics for the admin dashboard.
 *
 * Queries run in 3 parallel batches using Promise.allSettled so one failure
 * doesn't sink the whole dashboard. Each batch has at most 5 concurrent
 * queries to stay within Supabase's PgBouncer connection limit.
 */
export async function GET(_req: NextRequest) {
  try {
    const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
      try {
        return await fn();
      } catch {
        return fallback;
      }
    };

    // Batch 1: Core counts (fast, parallel)
    const [
      totalVendorsR,
      approvedVendorsR,
      totalReviewsR,
      totalBookingsR,
      pendingBookingsR,
    ] = await Promise.allSettled([
      safe(() => db.vendor.count(), 0),
      safe(() => db.vendor.count({ where: { approved: true } }), 0),
      safe(() => db.review.count(), 0),
      safe(() => db.booking.count(), 0),
      safe(() => db.booking.count({ where: { status: "pending" } }), 0),
    ]);

    const totalVendors = totalVendorsR.status === "fulfilled" ? totalVendorsR.value : 0;
    const approvedVendors = approvedVendorsR.status === "fulfilled" ? approvedVendorsR.value : 0;
    const totalReviews = totalReviewsR.status === "fulfilled" ? totalReviewsR.value : 0;
    const totalBookings = totalBookingsR.status === "fulfilled" ? totalBookingsR.value : 0;
    const pendingBookings = pendingBookingsR.status === "fulfilled" ? pendingBookingsR.value : 0;

    // Batch 2: Aggregations + groupBy (medium cost, parallel)
    const [
      confirmedBookingsR,
      avgRatingAggR,
      vendorsByEcosystemR,
      vendorsByCategoryR,
      bookingsByStatusR,
    ] = await Promise.allSettled([
      safe(() => db.booking.count({ where: { status: "confirmed" } }), 0),
      safe(() => db.vendor.aggregate({ _avg: { rating: true } }), { _avg: { rating: null } }),
      safe(() => db.vendor.groupBy({ by: ["ecosystem"], _count: { id: true } }), []),
      safe(() => db.vendor.groupBy({ by: ["category"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 12 }), []),
      safe(() => db.booking.groupBy({ by: ["status"], _count: { id: true } }), []),
    ]);

    const confirmedBookings = confirmedBookingsR.status === "fulfilled" ? confirmedBookingsR.value : 0;
    const avgRatingAgg = avgRatingAggR.status === "fulfilled" ? avgRatingAggR.value : { _avg: { rating: null } };
    const vendorsByEcosystem = vendorsByEcosystemR.status === "fulfilled" ? vendorsByEcosystemR.value : [];
    const vendorsByCategory = vendorsByCategoryR.status === "fulfilled" ? vendorsByCategoryR.value : [];
    const bookingsByStatus = bookingsByStatusR.status === "fulfilled" ? bookingsByStatusR.value : [];

    // Batch 3: Recent records (heavier, parallel, only 5 each)
    const [recentBookingsR, recentVendorsR] = await Promise.allSettled([
      safe(() =>
        db.booking.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { vendor: { select: { name: true, city: true } } },
        }),
        []
      ),
      safe(() =>
        db.vendor.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, name: true, slug: true, ecosystem: true, city: true, country: true, createdAt: true },
        }),
        []
      ),
    ]);

    const recentBookings = recentBookingsR.status === "fulfilled" ? recentBookingsR.value : [];
    const recentVendors = recentVendorsR.status === "fulfilled" ? recentVendorsR.value : [];

    return NextResponse.json({
      totals: {
        vendors: totalVendors,
        approved: approvedVendors,
        reviews: totalReviews,
        bookings: totalBookings,
        pendingBookings,
        confirmedBookings,
        avgRating: Math.round((avgRatingAgg._avg.rating ?? 0) * 10) / 10,
      },
      vendorsByEcosystem: vendorsByEcosystem.map((v) => ({
        ecosystem: v.ecosystem,
        count: v._count.id,
      })),
      vendorsByCategory: vendorsByCategory.map((v) => ({
        category: v.category,
        count: v._count.id,
      })),
      bookingsByStatus: bookingsByStatus.map((b) => ({
        status: b.status,
        count: b._count.id,
      })),
      recentBookings: recentBookings.map((b: any) => ({
        id: b.id,
        name: b.name,
        eventType: b.eventType,
        eventDate: b.eventDate,
        status: b.status,
        createdAt: b.createdAt.toISOString(),
        vendorName: b.vendor?.name ?? "—",
      })),
      recentVendors: recentVendors.map((v: any) => ({
        id: v.id,
        name: v.name,
        slug: v.slug,
        ecosystem: v.ecosystem,
        city: v.city,
        country: v.country,
        createdAt: v.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[api/admin/stats] GET failed:", err);
    // Return graceful empty stats instead of 500
    return NextResponse.json({
      totals: { vendors: 0, approved: 0, reviews: 0, bookings: 0, pendingBookings: 0, confirmedBookings: 0, avgRating: 0 },
      vendorsByEcosystem: [],
      vendorsByCategory: [],
      bookingsByStatus: [],
      recentBookings: [],
      recentVendors: [],
    });
  }
}
