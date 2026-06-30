import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CURRENCY_SYMBOLS } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Phase 2.5 — Customer Wishlist: list all items for current user
 *
 * GET /api/wishlist/list
 *
 * Returns the user's wishlisted products, services, and vendors with
 * enough metadata to render wishlist cards. Auth: supabase user ID or
 * visitor hash (same pattern as /api/wishlist).
 *
 * Response: { items: [{ id, entityType, entityId, vendorId, createdAt, entity: {...} | null }] }
 */

// Simple deterministic hash (NOT for security — for deduplication only)
function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return String(h);
}

function getVisitorHash(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  return `anon_${simpleHash(`${ip}:${ua}`)}`;
}

async function resolveUserId(req: NextRequest): Promise<string> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return user.id;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) return session.user.id;
  } catch {
    // fall through
  }
  return getVisitorHash(req);
}

interface WishlistRow {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  vendorId: string | null;
  createdAt: Date;
}

/** Hydrate wishlisted products with the same shape as /api/products/trending. */
function shapeProduct(p: any, currencyOverride?: string) {
  const currency = currencyOverride || p.currency || p.vendor?.currency || "USD";
  const images: string[] = (() => {
    try {
      const parsed = p.images ? JSON.parse(p.images) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();
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
}

function shapeVendor(v: any) {
  return {
    id: v.id,
    name: v.name,
    slug: v.slug,
    category: v.category,
    city: v.city,
    country: v.country,
    countryCode: v.countryCode,
    rating: v.rating,
    reviewCount: v.reviewCount,
    basePrice: v.basePrice,
    currency: v.currency,
    currencySymbol: CURRENCY_SYMBOLS[v.currency] ?? v.currency,
    avatarImage: v.avatarImage,
    heroImage: v.heroImage,
    tagline: v.tagline,
  };
}

export async function GET(req: NextRequest) {
  try {
    const userId = await resolveUserId(req);

    let rows: WishlistRow[] = [];
    try {
      rows = (await db.wishlist.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 200,
      })) as WishlistRow[];
    } catch (e) {
      console.error("[api/wishlist/list] findMany failed:", (e as Error)?.message?.slice(0, 120));
      return NextResponse.json({ items: [] });
    }

    if (rows.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // Group entityIds by type so we can hydrate each in a single query
    const productIds = rows.filter((r) => r.entityType === "product").map((r) => r.entityId);
    const vendorIds = new Set<string>();
    for (const r of rows) {
      if (r.entityType === "vendor") vendorIds.add(r.entityId);
      if (r.vendorId) vendorIds.add(r.vendorId);
    }
    const serviceIds = rows.filter((r) => r.entityType === "service").map((r) => r.entityId);

    // Hydrate in parallel (each query wrapped independently)
    const [products, vendors, services] = await Promise.all([
      productIds.length > 0
        ? db.product
            .findMany({
              where: { id: { in: productIds } },
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
            })
            .catch(() => [])
        : Promise.resolve([]),
      vendorIds.size > 0
        ? db.vendor
            .findMany({
              where: { id: { in: Array.from(vendorIds) } },
              select: {
                id: true,
                name: true,
                slug: true,
                category: true,
                city: true,
                country: true,
                countryCode: true,
                rating: true,
                reviewCount: true,
                basePrice: true,
                currency: true,
                avatarImage: true,
                heroImage: true,
                tagline: true,
              },
            })
            .catch(() => [])
        : Promise.resolve([]),
      serviceIds.length > 0
        ? db.product
            .findMany({
              where: { id: { in: serviceIds } },
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
            })
            .catch(() => [])
        : Promise.resolve([]),
    ]);

    const productMap = new Map<string, any>();
    for (const p of products as any[]) productMap.set(p.id, p);
    const vendorMap = new Map<string, any>();
    for (const v of vendors as any[]) vendorMap.set(v.id, v);
    const serviceMap = new Map<string, any>();
    for (const s of services as any[]) serviceMap.set(s.id, s);

    const items = rows.map((r) => {
      let entity: any = null;
      if (r.entityType === "product" && productMap.has(r.entityId)) {
        entity = shapeProduct(productMap.get(r.entityId));
      } else if (r.entityType === "service" && serviceMap.has(r.entityId)) {
        entity = shapeProduct(serviceMap.get(r.entityId));
      } else if (r.entityType === "vendor" && vendorMap.has(r.entityId)) {
        entity = shapeVendor(vendorMap.get(r.entityId));
      }
      return {
        id: r.id,
        entityType: r.entityType,
        entityId: r.entityId,
        vendorId: r.vendorId,
        createdAt: r.createdAt.toISOString(),
        entity,
      };
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[api/wishlist/list] GET failed:", err);
    return NextResponse.json({ items: [] });
  }
}
