import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/stats
 * Aggregated metrics for the admin dashboard:
 *  - headline totals (vendors, reviews, bookings, pending bookings, confirmed)
 *  - vendors grouped by ecosystem
 *  - vendors grouped by continent
 *  - vendors grouped by category (top 12)
 *  - bookings grouped by status
 *  - recent bookings (last 5)
 *  - recent vendors (last 5)
 */
export async function GET(_req: NextRequest) {
  try {
    const [
      totalVendors,
      totalReviews,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      avgRatingAgg,
      vendorsByEcosystem,
      vendorsByContinent,
      vendorsByCategory,
      bookingsByStatus,
      recentBookings,
      recentVendors,
    ] = await Promise.all([
      db.vendor.count(),
      db.review.count(),
      db.booking.count(),
      db.booking.count({ where: { status: "pending" } }),
      db.booking.count({ where: { status: "confirmed" } }),
      db.vendor.aggregate({ _avg: { rating: true } }),
      db.vendor.groupBy({
        by: ["ecosystem"],
        _count: { id: true },
      }),
      db.vendor.groupBy({
        by: ["continent"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      db.vendor.groupBy({
        by: ["category"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 12,
      }),
      db.booking.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      db.booking.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { vendor: { select: { name: true, city: true } } },
      }),
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
    ]);

    return NextResponse.json({
      totals: {
        vendors: totalVendors,
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
