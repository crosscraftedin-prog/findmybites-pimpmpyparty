import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { PlatformStats } from "@/lib/types";

export async function GET() {
  try {
    // Run each query individually with safe() so one failure (e.g. DB
    // connection issue) doesn't sink the whole stats payload. Returns
    // graceful zeros instead of a 500 error.
    const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
      try {
        return await fn();
      } catch {
        return fallback;
      }
    };

    // Run all queries in parallel for ~5x speedup vs sequential
    const [
      totalVendorsR,
      totalReviewsR,
      totalBookingsR,
      findmybitesCountR,
      pimpmpypartyCountR,
      continentGroupsR,
      categoryGroupsR,
      countryGroupsR,
      avgAggR,
    ] = await Promise.allSettled([
      db.vendor.count(),
      db.review.count(),
      db.booking.count(),
      db.vendor.count({ where: { ecosystem: "FINDMYBITES" } }),
      db.vendor.count({ where: { ecosystem: "PIMPMYPARTY" } }),
      db.vendor.groupBy({ by: ["continent"], _count: { _all: true } }),
      db.vendor.groupBy({ by: ["ecosystem", "category"], _count: { _all: true } }),
      db.vendor.groupBy({ by: ["country"] }),
      db.vendor.aggregate({ _avg: { rating: true } }),
    ]);

    const totalVendors = totalVendorsR.status === "fulfilled" ? totalVendorsR.value : 0;
    const totalReviews = totalReviewsR.status === "fulfilled" ? totalReviewsR.value : 0;
    const totalBookings = totalBookingsR.status === "fulfilled" ? totalBookingsR.value : 0;
    const findmybitesCount = findmybitesCountR.status === "fulfilled" ? findmybitesCountR.value : 0;
    const pimpmpypartyCount = pimpmpypartyCountR.status === "fulfilled" ? pimpmpypartyCountR.value : 0;
    const continentGroups = continentGroupsR.status === "fulfilled" ? continentGroupsR.value : [];
    const categoryGroups = categoryGroupsR.status === "fulfilled" ? categoryGroupsR.value : [];
    const countryGroups = countryGroupsR.status === "fulfilled" ? countryGroupsR.value : [];
    const avgAgg = avgAggR.status === "fulfilled" ? avgAggR.value : { _avg: { rating: null } };

    const avgRating = Math.round((avgAgg._avg.rating ?? 0) * 10) / 10;
    const countries = countryGroups.length;

    const stats: PlatformStats = {
      totalVendors,
      totalReviews,
      totalBookings,
      countries,
      findmybitesCount,
      pimpmpypartyCount,
      avgRating,
      continents: continentGroups.map((g) => ({
        continent: g.continent,
        count: g._count._all,
      })),
      categories: categoryGroups.map((g) => ({
        ecosystem: g.ecosystem,
        category: g.category,
        count: g._count._all,
      })),
    };

    return NextResponse.json(stats, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (err) {
    console.error("[api/stats] GET failed:", err);
    // Return graceful empty stats instead of 500 so the homepage doesn't
    // break entirely when the DB is unreachable.
    return NextResponse.json({
      totalVendors: 0,
      totalReviews: 0,
      totalBookings: 0,
      countries: 0,
      findmybitesCount: 0,
      pimpmpypartyCount: 0,
      avgRating: 0,
      continents: [],
      categories: [],
    } satisfies PlatformStats);
  }
}
