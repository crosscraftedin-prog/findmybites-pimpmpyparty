import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CURRENCY_SYMBOLS } from "@/lib/constants";

/**
 * GET /api/products/trending?ecosystem=FINDMYBITES&limit=12
 *
 * Returns trending products — featured products with images, sorted by
 * recency. Used by the homepage "Trending Products" section.
 *
 * A product is "trending" if:
 *   - It belongs to an approved vendor
 *   - It is available (isAvailable = true)
 *   - It has at least one image OR is featured
 * Sorted by: isFeatured DESC, createdAt DESC
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const ecosystem = sp.get("ecosystem") || undefined;
    const limitRaw = Number(sp.get("limit"));
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(24, limitRaw) : 12;

    const products = await db.product.findMany({
      where: {
        isAvailable: true,
        ...(ecosystem ? { ecosystem } : {}),
        vendor: { approved: true },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: limit,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            country: true,
            countryCode: true,
            currency: true,
            avatarImage: true,
          },
        },
      },
    });

    const trending = products
      .filter((p) => p.image || (p.images && JSON.parse(p.images || "[]").length > 0))
      .map((p) => {
        const images = p.images ? JSON.parse(p.images) : [];
        const currency = p.vendor?.currency || "USD";
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: p.price,
          currency,
          currencySymbol: CURRENCY_SYMBOLS[currency] ?? currency,
          image: p.image || images[0] || null,
          packageType: p.packageType,
          isFeatured: p.isFeatured,
          vendor: p.vendor
            ? {
                id: p.vendor.id,
                name: p.vendor.name,
                slug: p.vendor.slug,
                city: p.vendor.city,
                country: p.vendor.country,
                countryCode: p.vendor.countryCode,
                avatarImage: p.vendor.avatarImage,
              }
            : null,
        };
      });

    return NextResponse.json({ products: trending });
  } catch (err) {
    console.error("[api/products/trending] GET failed:", err);
    return NextResponse.json({ products: [] });
  }
}
