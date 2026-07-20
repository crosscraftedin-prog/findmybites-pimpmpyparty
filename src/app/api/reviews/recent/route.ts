import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/reviews/recent?ecosystem=FINDMYBITES&limit=10
 *
 * Returns recent reviews across ALL vendors, with vendor info attached.
 * Used by the homepage "Customer Reviews" carousel.
 *
 * Returns: [{ id, author, avatar, rating, comment, eventDate, createdAt,
 *             vendor: { id, name, slug, city, country, avatarImage } }]
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const ecosystem = sp.get("ecosystem") || undefined;
    const limitRaw = Number(sp.get("limit"));
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(30, limitRaw) : 10;

    const reviews = await db.review.findMany({
      where: ecosystem
        ? { vendor: { ecosystem, approved: true } }
        : { vendor: { approved: true } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            country: true,
            avatarImage: true,
            category: true,
          },
        },
      },
    });

    const result = reviews
      .filter((r) => r.vendor) // exclude orphan reviews
      .map((r) => ({
        id: r.id,
        author: r.author,
        avatar: r.avatar,
        rating: r.rating,
        comment: r.comment,
        eventDate: r.eventDate,
        createdAt: r.createdAt.toISOString(),
        vendor: {
          id: r.vendor!.id,
          name: r.vendor!.name,
          slug: r.vendor!.slug,
          city: r.vendor!.city,
          country: r.vendor!.country,
          avatarImage: r.vendor!.avatarImage,
          category: r.vendor!.category,
        },
      }));

    const res = NextResponse.json({ reviews: result });
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res;
  } catch (err) {
    console.error("[api/reviews/recent] GET failed:", err);
    return NextResponse.json({ reviews: [] });
  }
}
