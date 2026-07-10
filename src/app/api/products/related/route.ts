import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CURRENCY_SYMBOLS } from "@/lib/constants";

/**
 * GET /api/products/related?productId=xxx&vendorId=xxx&limit=4
 *
 * Returns related products for a storefront. Strategy:
 *   1. Same vendor — other products with a different productType or name.
 *   2. If not enough, fill with products from OTHER vendors in the same
 *      category (using the Template Engine's category field).
 *
 * The response shape matches /api/products/trending so the storefront can
 * reuse the same ProductCard component.
 *
 * Response: { products: [...] }
 */

interface RelatedProduct extends Record<string, unknown> {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  currencySymbol: string;
  image: string | null;
  packageType: string | null;
  isFeatured: boolean;
  vendor: {
    id: string;
    name: string;
    slug: string;
    city: string;
    country: string;
    countryCode: string;
    avatarImage: string;
  } | null;
}

function parseImages(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean) as string[];
  } catch {
    // fallthrough
  }
  return [];
}

function shapeProduct(p: any): RelatedProduct {
  const currency = p.currency || p.vendor?.currency || "USD";
  const images = parseImages(p.images);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
        offerPrice: (p as any).offerPrice,
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
}

const VENDOR_SELECT = {
  id: true,
  name: true,
  slug: true,
  city: true,
  country: true,
  countryCode: true,
  currency: true,
  avatarImage: true,
} as const;

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const productId = sp.get("productId");
    const vendorIdQuery = sp.get("vendorId");
    const limitRaw = Number(sp.get("limit"));
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(20, limitRaw) : 4;

    // ── 1. Resolve the source product + vendor + category ────────────────
    let sourceProduct: any = null;
    let vendorId = vendorIdQuery;
    let category: string | null = null;
    let ecosystem: string | null = null;
    let productType: string | null = null;

    if (productId) {
      try {
        sourceProduct = await db.product.findUnique({
          where: { id: productId },
          select: {
            id: true,
            vendorId: true,
            name: true,
            productType: true,
            category: true,
            ecosystem: true,
          },
        });
      } catch (e) {
        console.error("[api/products/related] source product fetch failed:", (e as Error)?.message?.slice(0, 120));
      }
      if (sourceProduct) {
        vendorId = vendorId || sourceProduct.vendorId;
        category = sourceProduct.category;
        ecosystem = sourceProduct.ecosystem;
        productType = sourceProduct.productType;
      }
    }

    if (!vendorId && !category) {
      return NextResponse.json({ products: [] });
    }

    const results: any[] = [];
    const seenIds = new Set<string>();
    if (productId) seenIds.add(productId);

    // ── 2. Same vendor — different productType or name ───────────────────
    if (vendorId) {
      try {
        const sameVendor = await db.product.findMany({
          where: {
            vendorId,
            isAvailable: true,
            id: { notIn: Array.from(seenIds) },
            ...(productType
              ? { OR: [{ productType: { not: productType } }, { productType: null }] }
              : {}),
          },
          orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
          take: limit,
          include: { vendor: { select: VENDOR_SELECT } },
        });
        for (const p of sameVendor) {
          if (seenIds.has(p.id)) continue;
          // Exclude same-name variants
          if (sourceProduct && p.name === sourceProduct.name) continue;
          seenIds.add(p.id);
          results.push(p);
        }
      } catch (e) {
        console.error("[api/products/related] same-vendor fetch failed:", (e as Error)?.message?.slice(0, 120));
      }
    }

    // ── 3. If not enough, fill with other vendors in the same category ───
    if (results.length < limit && (category || ecosystem)) {
      const remaining = limit - results.length;
      try {
        const otherVendors = await db.product.findMany({
          where: {
            isAvailable: true,
            id: { notIn: Array.from(seenIds) },
            ...(vendorId ? { vendorId: { not: vendorId } } : {}),
            ...(category ? { category } : {}),
            ...(ecosystem ? { ecosystem } : {}),
            vendor: { approved: true },
          },
          orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
          take: remaining + 4, // fetch a few extra in case some lack images
          include: { vendor: { select: VENDOR_SELECT } },
        });
        for (const p of otherVendors) {
          if (results.length >= limit) break;
          if (seenIds.has(p.id)) continue;
          seenIds.add(p.id);
          results.push(p);
        }
      } catch (e) {
        console.error("[api/products/related] other-vendor fetch failed:", (e as Error)?.message?.slice(0, 120));
      }
    }

    const products = results
      .slice(0, limit)
      .map(shapeProduct);

    return NextResponse.json({ products });
  } catch (err) {
    console.error("[api/products/related] GET failed:", err);
    return NextResponse.json({ products: [] });
  }
}
