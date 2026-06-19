import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/stats
 * Aggregated metrics for the admin dashboard.
 *
 * Queries run SEQUENTIALLY (not Promise.all) because Vercel serverless +
 * Supabase's transaction pooler (PgBouncer) limits concurrent connections.
 * Running 12 queries in parallel exhausts the pool and causes 500s. Sequential
 * is slightly slower but 100% reliable on the free tier.
 */
export async function GET(_req: NextRequest) {
  try {
    // Run each query one at a time with individual error handling so one
    // failure doesn't sink the whole dashboard.
    const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
      try {
        return await fn();
      } catch {
        return fallback;
      }
    };

    const totalVendors = await safe(() => db.vendor.count(), 0);
    const approvedVendors = await safe(
      () => db.vendor.count({ where: { approved: true } }),
      0
    );
    const totalReviews = await safe(() => db.review.count(), 0);
    const totalBookings = await safe(() => db.booking.count(), 0);
    const pendingBookings = await safe(
      () => db.booking.count({ where: { status: "pending" } }),
      0
    );
    const confirmedBookings = await safe(
      () => db.booking.count({ where: { status: "confirmed" } }),
      0
    );
    const avgRatingAgg = await safe(
      () => db.vendor.aggregate({ _avg: { rating: true } }),
      { _avg: { rating: null } }
    );
    const vendorsByEcosystem = await safe(
      () => db.vendor.groupBy({ by: ["ecosystem"], _count: { id: true } }),
      []
    );
    const vendorsByContinent = await safe(
      () =>
        db.vendor.groupBy({
          by: ["continent"],
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
        }),
      []
    );
    const vendorsByCategory = await safe(
      () =>
        db.vendor.groupBy({
          by: ["category"],
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 12,
        }),
      []
    );
    const bookingsByStatus = await safe(
      () => db.booking.groupBy({ by: ["status"], _count: { id: true } }),
      []
    );
    const recentBookings = await safe(
      () =>
        db.booking.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { vendor: { select: { name: true, city: true } } },
        }),
      []
    );
    const recentVendors = await safe(
      () =>
        db.vendor.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            name: true,
            slug: true,
            ecosystem: true,
            city: true,
            country: true,
            createdAt: true,
          },
        }),
      []
    );

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
      vendorsByContinent: vendorsByContinent.map((v) => ({
        continent: v.continent,
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
      recentBookings: recentBookings.map((b) => ({
        id: b.id,
        name: b.name,
        eventType: b.eventType,
        eventDate: b.eventDate,
        status: b.status,
        createdAt: b.createdAt.toISOString(),
        vendorName: b.vendor?.name ?? "—",
      })),
      recentVendors: recentVendors.map((v) => ({
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
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
