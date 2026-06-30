import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

function transformProduct(p: any): Product {
  return {
    id: p.id,
    vendorId: p.vendorId,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    image: p.image,
    productType: p.productType,
    sizes: p.sizes,
    flavours: p.flavours,
    weight: p.weight,
    prepTime: p.prepTime,
    deliveryAvailable: p.deliveryAvailable,
    minGuests: p.minGuests,
    pricePerHead: p.pricePerHead,
    images: p.images ? parseJsonArray<string>(p.images) : null,
    videoUrl: p.videoUrl,
    pricingTiers: p.pricingTiers ? JSON.parse(p.pricingTiers) : null,
    servings: p.servings,
    shape: p.shape,
    eggless: p.eggless,
    sameDay: p.sameDay,
    customOrder: p.customOrder,
    pickupAvailable: p.pickupAvailable,
    featured: p.featured,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    availableCountries: p.availableCountries,
    availableStates: p.availableStates,
    availableCities: p.availableCities,
    inStock: p.inStock,
    stockCount: p.stockCount,
    extraFields: p.extraFields ? JSON.parse(p.extraFields) : null,
    createdAt: p.createdAt.toISOString(),
  } as Product;
}

// GET /api/products?vendorId=&category=&ecosystem=&featured=&isAvailable=&limit=
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const vendorId = sp.get("vendorId");
    const category = sp.get("category");
    const ecosystem = sp.get("ecosystem");
    const featured = sp.get("featured") === "true";
    const isAvailable = sp.get("isAvailable");
    const limitRaw = Number(sp.get("limit"));
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(100, limitRaw) : 50;

    const where: any = {};
    if (vendorId) where.vendorId = vendorId;
    if (category) where.category = category;
    if (ecosystem) where.ecosystem = ecosystem;
    if (featured) where.isFeatured = true;
    if (isAvailable === "true") where.isAvailable = true;
    if (isAvailable === "false") where.isAvailable = false;

    const products = await db.product.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      take: limit,
    });

    return NextResponse.json({ products: products.map(transformProduct) });
  } catch (err) {
    console.error("[api/products] GET failed:", err);
    return NextResponse.json({ products: [] });
  }
}

// POST /api/products — create a product (auth required)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    
    let userId: string | null = null;
    if (!userErr && user) {
      userId = user.id;
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id ?? null;
    }
    
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify vendor ownership
    const vendor = await db.vendor.findFirst({
      where: { owner_user_id: userId },
      select: { id: true, ecosystem: true, category: true, currency: true },
    });
    
    if (!vendor) {
      return NextResponse.json({ error: "No vendor listing found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      name, description, packageType, price, comparePrice, currency,
      duration, capacity, includes, dietaryTags, addOns, leadTime,
      allergens, customAllergen, cuisineType, customisationAvailable,
      customisationNotes, shelfLife, storageMethod, storageInstructions,
      recipePublic, recipeText, recipePdf,
      offerType, offerLabel, offerExpiresAt, freeItemDescription,
      bundleDescription, bundleDiscount, isFlashDeal, flashDealEndsAt,
      minOrderForOffer, exclusiveMemberOffer,
      isAvailable, isFeatured, images, productType,
      extraFields,
      templateSlug, templateVersion,
      badge,
    } = body;

    if (!name?.trim() || price === undefined) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    // Generate slug
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;

    const created = await db.product.create({
      data: {
        vendorId: vendor.id,
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        price: Number(price) || 0,
        image: images?.[0] || null,
        images: images ? JSON.stringify(images) : null,
        productType: productType || packageType || null,
        ecosystem: vendor.ecosystem,
        category: vendor.category,
        packageType: packageType || "standard",
        comparePrice: comparePrice ? Number(comparePrice) : null,
        currency: currency || vendor.currency || "USD",
        duration: duration || null,
        capacity: capacity ? Number(capacity) : null,
        includes: includes ? JSON.stringify(includes) : null,
        dietaryTags: dietaryTags ? JSON.stringify(dietaryTags) : null,
        addOns: addOns ? JSON.stringify(addOns) : null,
        leadTime: leadTime || null,
        isAvailable: isAvailable !== false,
        // SECURITY: isFeatured is admin-only — vendors cannot self-promote.
        // Featured status is set by admins via the admin panel, not by vendors.
        isFeatured: false,
        sortOrder: 0,
        allergens: allergens || null,
        customAllergen: customAllergen || null,
        cuisineType: cuisineType || null,
        customisationAvailable: customisationAvailable !== false,
        customisationNotes: customisationNotes || null,
        shelfLife: shelfLife || null,
        storageMethod: storageMethod || null,
        storageInstructions: storageInstructions || null,
        recipePublic: recipePublic === true,
        recipeText: recipeText || null,
        recipePdf: recipePdf || null,
        offerType: offerType || "none",
        offerLabel: offerLabel || null,
        offerExpiresAt: offerExpiresAt ? new Date(offerExpiresAt) : null,
        freeItemDescription: freeItemDescription || null,
        bundleDescription: bundleDescription || null,
        bundleDiscount: bundleDiscount ? Number(bundleDiscount) : null,
        isFlashDeal: offerType === "flash",
        flashDealEndsAt: flashDealEndsAt ? new Date(flashDealEndsAt) : null,
        minOrderForOffer: minOrderForOffer ? Number(minOrderForOffer) : null,
        exclusiveMemberOffer: exclusiveMemberOffer === true,
        discountPercent: comparePrice && Number(comparePrice) > Number(price)
          ? Math.round(((Number(comparePrice) - Number(price)) / Number(comparePrice)) * 100)
          : null,
        extraFields: extraFields ? (typeof extraFields === "string" ? extraFields : JSON.stringify(extraFields)) : null,
        templateSlug: templateSlug || null,
        templateVersion: templateVersion ? Number(templateVersion) : null,
        badge: badge || null,
      },
    });

    return NextResponse.json({ product: transformProduct(created) }, { status: 201 });
  } catch (err) {
    console.error("[api/products] POST failed:", err);
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to create product: ${errMsg}` }, { status: 500 });
  }
}
