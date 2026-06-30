import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";

/**
 * GET /api/recently-viewed?ids=id1,id2,id3
 *
 * Returns vendor details for recently viewed vendors.
 * The list of recently viewed vendor IDs is stored in browser localStorage
 * and passed to this API to hydrate with full vendor data.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const idsParam = sp.get("ids") || "";
    const ids = idsParam.split(",").filter(Boolean).slice(0, 12);

    if (ids.length === 0) {
      return NextResponse.json({ vendors: [] });
    }

    const vendors = await db.vendor.findMany({
      where: { id: { in: ids }, approved: true },
      select: {
        id: true,
        name: true,
        slug: true,
        ecosystem: true,
        category: true,
        tagline: true,
        city: true,
        country: true,
        countryCode: true,
        rating: true,
        reviewCount: true,
        basePrice: true,
        currency: true,
        heroImage: true,
        avatarImage: true,
        featured: true,
        verified: true,
        tags: true,
      },
    });

    // Sort to match the requested order (most recent first)
    const sorted = ids
      .map((id) => vendors.find((v) => v.id === id))
      .filter(Boolean)
      .map((v: any) => ({
        ...v,
        tags: parseJsonArray<string>(v.tags),
      }));

    return NextResponse.json({ vendors: sorted });
  } catch (err) {
    console.error("[api/recently-viewed] GET failed:", err);
    return NextResponse.json({ vendors: [] });
  }
}
