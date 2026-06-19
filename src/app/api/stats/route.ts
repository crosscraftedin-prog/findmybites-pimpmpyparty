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

    const totalVendors = await safe(() => db.vendor.count(), 0);
    const totalReviews = await safe(() => db.review.count(), 0);
    const totalBookings = await safe(() => db.booking.count(), 0);
    const findmybitesCount = await safe(
      () => db.vendor.count({ where: { ecosystem: "FINDMYBITES" } }),
      0
    );
    const pimpmpypartyCount = await safe(
      () => db.vendor.count({ where: { ecosystem: "PIMPMYPARTY" } }),
      0
    );
    const continentGroups = await safe(
      () =>
        db.vendor.groupBy({
          by: ["continent"],
          _count: { _all: true },
        }),
      []
    );
    const categoryGroups = await safe(
      () =>
        db.vendor.groupBy({
          by: ["ecosystem", "category"],
          _count: { _all: true },
        }),
      []
    );
    const countryGroups = await safe(
      () => db.vendor.groupBy({ by: ["country"] }),
      []
    );
    const avgAgg = await safe(
      () => db.vendor.aggregate({ _avg: { rating: true } }),
      { _avg: { rating: null } }
    );

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

    return NextResponse.json(stats);
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
