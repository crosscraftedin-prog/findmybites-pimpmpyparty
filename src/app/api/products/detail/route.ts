import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import { migrateCategory, CURRENCY_SYMBOLS } from "@/lib/constants";

/**
 * GET /api/products/detail?slug=xxx
 *
 * Returns a single product with all data needed for the product page:
 *   - Product fields (including extraFields from Template Engine)
 *   - Vendor info (name, slug, rating, city, delivery, badges, etc.)
 *   - Related products (same vendor first, then same category)
 *   - Template slug/version for rendering specifications
 *
 * This is the canonical data source for /product/[slug] pages.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const slug = sp.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "slug parameter required" }, { status: 400 });
    }

    const product = await db.product.findUnique({
      where: { slug },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
            ecosystem: true,
            category: true,
            subcategory: true,
            tagline: true,
            description: true,
            city: true,
            country: true,
            countryCode: true,
            currency: true,
            priceRange: true,
            basePrice: true,
            rating: true,
            reviewCount: true,
            heroImage: true,
            avatarImage: true,
            featured: true,
            verified: true,
            responseTime: true,
            yearsActive: true,
            completedBookings: true,
            deliveryAvailable: true,
            pickupAvailable: true,
            serviceAreas: true,
            serviceRadiusKm: true,
            openHours: true,
            whatsapp: true,
            instagram: true,
            website: true,
            tags: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Public visibility: hide admin-force-hidden, draft, and archived products.
    // Out-of-stock and temporarily-unavailable products remain viewable so
    // customers see the correct availability banner.
    if (product.forceHidden || product.status === "draft" || product.status === "archived") {
      return NextResponse.json({ error: "Product not available" }, { status: 404 });
    }

    // Parse JSON fields
    const images: string[] = product.images ? parseJsonArray<string>(product.images) : [];
    const extraFields = product.extraFields ? JSON.parse(product.extraFields) : {};
    const includes: string[] = product.includes ? parseJsonArray<string>(product.includes) : [];
    const dietaryTags: string[] = product.dietaryTags ? parseJsonArray<string>(product.dietaryTags) : [];
    const allergens: string[] = product.allergens ? parseJsonArray<string>(product.allergens) : [];
    const addOns: string[] = product.addOns ? parseJsonArray<string>(product.addOns) : [];

    const currency = product.vendor?.currency || "USD";
    const currencySymbol = CURRENCY_SYMBOLS[currency] ?? currency;

    // Fetch related products (same vendor first, then same category from other vendors)
    let relatedProducts: any[] = [];
    try {
      // Same vendor, different product
      const sameVendor = await db.product.findMany({
        where: {
          vendorId: product.vendorId,
          id: { not: product.id },
          isAvailable: true,
        },
        take: 4,
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          image: true,
          images: true,
          packageType: true,
          badge: true,
          isFeatured: true,
        },
      });

      relatedProducts = sameVendor;

      // If not enough, get from same category (other vendors)
      if (relatedProducts.length < 4 && product.vendor) {
        const sameCategory = await db.product.findMany({
          where: {
            id: { not: product.id, notIn: relatedProducts.map((p) => p.id) },
            isAvailable: true,
            vendor: {
              category: product.vendor.category,
              approved: true,
            },
          },
          take: 4 - relatedProducts.length,
          orderBy: [{ isFeatured: "desc" }, { rating: "desc" }],
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            image: true,
            images: true,
            packageType: true,
            badge: true,
            isFeatured: true,
            vendor: {
              select: { id: true, name: true, slug: true, city: true, avatarImage: true },
            },
          },
        });
        relatedProducts = [...relatedProducts, ...sameCategory];
      }
    } catch {
      // related products are optional
    }

    // Format related products
    const related = relatedProducts.map((p) => {
      const pImages: string[] = p.images ? parseJsonArray<string>(p.images) : [];
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        image: p.image || pImages[0] || null,
        packageType: p.packageType,
        badge: p.badge,
        isFeatured: p.isFeatured,
        vendor: p.vendor
          ? {
              id: p.vendor.id,
              name: p.vendor.name,
              slug: p.vendor.slug,
              city: p.vendor.city,
              avatarImage: p.vendor.avatarImage,
            }
          : null,
      };
    });

    // Build the full response
    const result = {
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        comparePrice: product.comparePrice,
        currency,
        currencySymbol,
        image: product.image || images[0] || null,
        images,
        videoUrl: product.videoUrl,
        productType: product.productType,
        packageType: product.packageType,
        badge: product.badge,
        isFeatured: product.isFeatured,
        isAvailable: product.isAvailable,
        capacity: product.capacity,
        duration: product.duration,
        leadTime: product.leadTime,
        minGuests: product.minGuests,
        pricePerHead: product.pricePerHead,
        includes,
        dietaryTags,
        allergens,
        addOns,
        cuisineType: product.cuisineType,
        customisationAvailable: product.customisationAvailable,
        customisationNotes: product.customisationNotes,
        shelfLife: product.shelfLife,
        storageMethod: product.storageMethod,
        storageInstructions: product.storageInstructions,
        discountPercent: product.discountPercent,
        offerType: product.offerType,
        offerLabel: product.offerLabel,
        templateSlug: product.templateSlug,
        templateVersion: product.templateVersion,
        // Template Engine extra fields (cake shape, size, flavour, etc.)
        extraFields,
        // ── Inventory & Availability Management ──
        stockType: product.stockType,
        stockCount: product.stockCount,
        lowStockThreshold: product.lowStockThreshold,
        status: product.status,
        availabilityMode: product.availabilityMode,
        preparationTimeCategory: product.preparationTimeCategory,
        preparationTimeCustom: product.preparationTimeCustom,
        bookingNoticeHours: product.bookingNoticeHours,
        serviceAreaType: product.serviceAreaType,
        createdAt: product.createdAt.toISOString(),
      },
      vendor: product.vendor
        ? {
            id: product.vendor.id,
            name: product.vendor.name,
            slug: product.vendor.slug,
            ecosystem: product.vendor.ecosystem,
            category: product.vendor.category,
            subcategory: product.vendor.subcategory,
            tagline: product.vendor.tagline,
            description: product.vendor.description,
            city: product.vendor.city,
            country: product.vendor.country,
            countryCode: product.vendor.countryCode,
            currency: product.vendor.currency,
            priceRange: product.vendor.priceRange,
            basePrice: product.vendor.basePrice,
            rating: product.vendor.rating,
            reviewCount: product.vendor.reviewCount,
            heroImage: product.vendor.heroImage,
            avatarImage: product.vendor.avatarImage,
            featured: product.vendor.featured,
            verified: product.vendor.verified,
            responseTime: product.vendor.responseTime,
            yearsActive: product.vendor.yearsActive,
            completedBookings: product.vendor.completedBookings,
            deliveryAvailable: product.vendor.deliveryAvailable,
            pickupAvailable: product.vendor.pickupAvailable,
            serviceAreas: product.vendor.serviceAreas,
            serviceRadiusKm: product.vendor.serviceRadiusKm,
            openHours: product.vendor.openHours,
            whatsapp: product.vendor.whatsapp,
            instagram: product.vendor.instagram,
            website: product.vendor.website,
            tags: product.vendor.tags ? parseJsonArray<string>(product.vendor.tags) : [],
          }
        : null,
      related,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/products/detail] GET failed:", err);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
