import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { PlatformStats } from "@/lib/types";

export async function GET() {
  try {
    const [
      totalVendors,
      totalReviews,
      totalBookings,
      findmybitesCount,
      pimpmpypartyCount,
      continentGroups,
      categoryGroups,
      countryGroups,
      avgAgg,
    ] = await Promise.all([
      db.vendor.count(),
      db.review.count(),
      db.booking.count(),
      db.vendor.count({ where: { ecosystem: "FINDMYBITES" } }),
      db.vendor.count({ where: { ecosystem: "PIMPMYPARTY" } }),
      db.vendor.groupBy({
        by: ["continent"],
        _count: { _all: true },
      }),
      db.vendor.groupBy({
        by: ["ecosystem", "category"],
        _count: { _all: true },
      }),
      db.vendor.groupBy({ by: ["country"] }),
      db.vendor.aggregate({ _avg: { rating: true } }),
    ]);

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
    return NextResponse.json(
      { error: "Failed to fetch platform stats" },
      { status: 500 }
    );
  }
}
