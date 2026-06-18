import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import { COUNTRIES, getCategory } from "@/lib/constants";
import {
  isValidPriceRange,
  sanitizeInstagram,
  sanitizeWebsite,
  sanitizeWhatsApp,
  resolveSubcategory,
  isSafeUploadUrl,
} from "@/lib/vendor-sanitize";
import type { Review as ApiReview, VendorWithRelations } from "@/lib/types";

type DbVendorWithReviews = Prisma.VendorGetPayload<{
  include: { reviews: true };
}>;

function transformVendor(v: DbVendorWithReviews): VendorWithRelations {
  return {
    id: v.id,
    name: v.name,
    slug: v.slug,
    ecosystem: v.ecosystem as VendorWithRelations["ecosystem"],
    category: v.category,
    tagline: v.tagline,
    description: v.description,
    city: v.city,
    country: v.country,
    countryCode: v.countryCode,
    continent: v.continent,
    currency: v.currency,
    priceRange: v.priceRange,
    basePrice: v.basePrice,
    rating: v.rating,
    reviewCount: v.reviewCount,
    heroImage: v.heroImage,
    avatarImage: v.avatarImage,
    gallery: parseJsonArray<string>(v.gallery),
    tags: parseJsonArray<string>(v.tags),
    featured: v.featured,
    verified: v.verified,
    responseTime: v.responseTime,
    yearsActive: v.yearsActive,
    completedBookings: v.completedBookings,
    subcategory: v.subcategory,
    state: v.state,
    address: v.address,
    zipCode: v.zipCode,
    instagram: v.instagram,
    website: v.website,
    whatsapp: v.whatsapp,
    createdAt: v.createdAt.toISOString(),
    reviews: v.reviews.map<ApiReview>((r) => ({
      id: r.id,
      vendorId: r.vendorId,
      author: r.author,
      avatar: r.avatar,
      rating: r.rating,
      comment: r.comment,
      eventDate: r.eventDate,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const vendor = await db.vendor.findUnique({
      where: { slug },
      include: { reviews: { orderBy: { createdAt: "desc" } } },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(transformVendor(vendor));
  } catch (err) {
    console.error("[api/vendors/[slug]] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
      { status: 500 }
    );
  }
}

// ── PATCH: edit an existing vendor listing ────────────────────────────────

interface UpdateVendorBody {
  name?: unknown;
  category?: unknown;
  tagline?: unknown;
  description?: unknown;
  city?: unknown;
  countryCode?: unknown;
  currency?: unknown;
  priceRange?: unknown;
  basePrice?: unknown;
  tags?: unknown;
  responseTime?: unknown;
  yearsActive?: unknown;
  logoUrl?: unknown;
  bannerUrl?: unknown;
  subcategory?: unknown;
  state?: unknown;
  address?: unknown;
  zipCode?: unknown;
  instagram?: unknown;
  website?: unknown;
  whatsapp?: unknown;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = (await req.json()) as UpdateVendorBody;

    const existing = await db.vendor.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Build a partial update object. Only fields actually present in the body
    // are touched, so callers can do partial updates. Ecosystem + slug are
    // immutable (never changed here).
    const data: Prisma.VendorUpdateInput = {};

    if (typeof body.name === "string" && body.name.trim().length >= 2) {
      data.name = body.name.trim();
    }
    if (typeof body.category === "string" && body.category) {
      data.category = body.category;
    }
    if (typeof body.tagline === "string") {
      data.tagline = body.tagline.trim();
    }
    if (typeof body.description === "string") {
      data.description = body.description.trim();
    }
    if (typeof body.city === "string") {
      data.city = body.city.trim();
    }
    if (typeof body.countryCode === "string") {
      const code = body.countryCode.toUpperCase();
      const c = COUNTRIES.find((x) => x.code === code);
      if (c) {
        data.countryCode = code;
        data.country = c.name;
        data.continent = c.continent;
      }
    }
    if (typeof body.currency === "string") {
      data.currency = body.currency.toUpperCase();
    }
    if (isValidPriceRange(body.priceRange)) {
      data.priceRange = body.priceRange;
    }
    if (body.basePrice !== undefined) {
      const n = Number(body.basePrice);
      if (Number.isFinite(n) && n >= 0) data.basePrice = Math.round(n);
    }
    if (typeof body.responseTime === "string" && body.responseTime.trim()) {
      data.responseTime = body.responseTime.trim();
    }
    if (body.yearsActive !== undefined) {
      const n = Number(body.yearsActive);
      if (Number.isFinite(n) && n >= 0) data.yearsActive = Math.round(n);
    }
    // tags
    if (Array.isArray(body.tags)) {
      const tags = body.tags
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10);
      data.tags = JSON.stringify(tags);
    }
    // subcategory — validated against the (possibly new) category
    if (body.subcategory !== undefined) {
      const cat = typeof data.category === "string" ? data.category : existing.category;
      data.subcategory = resolveSubcategory(body.subcategory, cat);
    }
    if (body.state !== undefined) {
      data.state =
        typeof body.state === "string" && body.state.trim()
          ? body.state.trim().slice(0, 80)
          : null;
    }
    if (body.address !== undefined) {
      data.address =
        typeof body.address === "string" && body.address.trim()
          ? body.address.trim().slice(0, 200)
          : null;
    }
    if (body.zipCode !== undefined) {
      data.zipCode =
        typeof body.zipCode === "string" && body.zipCode.trim()
          ? body.zipCode.trim().slice(0, 20)
          : null;
    }
    if (body.instagram !== undefined) {
      data.instagram = sanitizeInstagram(body.instagram) || null;
    }
    if (body.website !== undefined) {
      data.website = sanitizeWebsite(body.website) || null;
    }
    if (body.whatsapp !== undefined) {
      data.whatsapp = sanitizeWhatsApp(body.whatsapp) || null;
    }
    // images
    const bannerUrl = isSafeUploadUrl(body.bannerUrl) ? body.bannerUrl : null;
    const logoUrl = isSafeUploadUrl(body.logoUrl) ? body.logoUrl : null;
    if (bannerUrl !== null || logoUrl !== null) {
      const cat = typeof data.category === "string" ? data.category : existing.category;
      const fallback = getCategory(cat)?.image ?? "/vendors/baker.png";
      const hero = bannerUrl ?? existing.heroImage;
      const avatar = logoUrl ?? bannerUrl ?? existing.avatarImage;
      data.heroImage = hero;
      data.avatarImage = avatar;
      data.gallery = JSON.stringify(
        [hero, logoUrl ?? existing.avatarImage].filter(Boolean)
      );
      void fallback;
    }

    const updated = await db.vendor.update({
      where: { slug },
      data,
      include: { reviews: { orderBy: { createdAt: "desc" } } },
    });

    return NextResponse.json({ vendor: transformVendor(updated) });
  } catch (err) {
    console.error("[api/vendors/[slug]] PATCH failed:", err);
    return NextResponse.json(
      { error: "Failed to update vendor" },
      { status: 500 }
    );
  }
}
