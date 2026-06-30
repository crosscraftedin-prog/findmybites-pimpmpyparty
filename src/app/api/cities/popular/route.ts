import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { migrateCategory } from "@/lib/constants";

/**
 * GET /api/cities/popular?ecosystem=FINDMYBITES&limit=12
 *
 * Returns the most popular cities by vendor count.
 * Used by the homepage "Popular Cities" section.
 *
 * Returns: [{ city, country, countryCode, continent, count, topVendorImage }]
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const ecosystem = sp.get("ecosystem") || undefined;
    const limitRaw = Number(sp.get("limit"));
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(30, limitRaw) : 12;

    // Group vendors by city + country, count them
    const rows = await db.vendor.findMany({
      where: {
        approved: true,
        ...(ecosystem ? { ecosystem } : {}),
      },
      select: {
        city: true,
        country: true,
        countryCode: true,
        continent: true,
        heroImage: true,
        avatarImage: true,
      },
    });

    // Aggregate in JS (resilient to DB unavailability)
    const cityMap = new Map<
      string,
      {
        city: string;
        country: string;
        countryCode: string;
        continent: string;
        count: number;
        topImage: string | null;
      }
    >();

    for (const r of rows) {
      if (!r.city) continue;
      const key = `${r.city}|${r.country}`;
      const existing = cityMap.get(key);
      if (existing) {
        existing.count++;
        if (!existing.topImage && r.heroImage) existing.topImage = r.heroImage;
      } else {
        cityMap.set(key, {
          city: r.city,
          country: r.country,
          countryCode: r.countryCode,
          continent: r.continent,
          count: 1,
          topImage: r.heroImage || r.avatarImage || null,
        });
      }
    }

    const cities = Array.from(cityMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return NextResponse.json({ cities });
  } catch (err) {
    console.error("[api/cities/popular] GET failed:", err);
    return NextResponse.json({ cities: [] });
  }
}
