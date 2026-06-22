import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import { COUNTRIES, getCategory, getCategoryMigrated, ADMIN_EMAILS } from "@/lib/constants";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isValidPriceRange,
  sanitizeInstagram,
  sanitizeWebsite,
  sanitizeWhatsApp,
  resolveSubcategory,
  isSafeUploadUrl,
} from "@/lib/vendor-sanitize";
import { geocodeAddress, buildGeocodeQuery } from "@/lib/geocode";
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
    approved: v.approved,
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
    openHours: v.openHours,
    deliveryAvailable: v.deliveryAvailable,
    pickupAvailable: v.pickupAvailable,
    serviceAreas: v.serviceAreas,
    metaTitle: v.metaTitle,
    metaDescription: v.metaDescription,
    latitude: v.latitude,
    longitude: v.longitude,
    serviceRadiusKm: v.serviceRadiusKm,
    userEmail: v.userEmail,
    owner_user_id: v.owner_user_id,
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
  serviceRadiusKm?: unknown;
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

    // Ownership check: vendor owner (via owner_user_id) OR admin can update
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const isOwner = existing.owner_user_id === session.user.id;
      const isAdmin = ADMIN_EMAILS.some(
        (e) => e.toLowerCase() === session.user.email!.toLowerCase()
      );
      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: "Not authorized to edit this vendor" },
          { status: 403 }
        );
      }
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
    if (body.serviceRadiusKm !== undefined) {
      const n = Number(body.serviceRadiusKm);
      data.serviceRadiusKm =
        Number.isFinite(n) && n > 0 ? Math.round(n) : null;
    }

    // --- re-geocode if any address component changed ---
    // We need the post-update address values to build the query.
    const newAddress =
      typeof data.address === "string"
        ? data.address
        : existing.address ?? undefined;
    const newCity = typeof data.city === "string" ? data.city : existing.city;
    const newState = typeof data.state === "string" ? data.state : existing.state ?? undefined;
    const newZip =
      typeof data.zipCode === "string" ? data.zipCode : existing.zipCode ?? undefined;
    const newCountryName =
      typeof data.country === "string" ? data.country : existing.country;
    const addressChanged =
      typeof body.address !== undefined ||
      body.city !== undefined ||
      body.state !== undefined ||
      body.zipCode !== undefined ||
      body.countryCode !== undefined;
    if (addressChanged) {
      const geoQuery = buildGeocodeQuery({
        address: newAddress,
        city: newCity,
        state: newState,
        zipCode: newZip,
        country: newCountryName,
      });
      const geo = geoQuery ? await geocodeAddress(geoQuery) : null;
      if (geo) {
        data.latitude = geo.lat;
        data.longitude = geo.lng;
      }
      // if geocoding fails we keep the existing coordinates rather than wiping
    }

    // images
    const bannerUrl = isSafeUploadUrl(body.bannerUrl) ? body.bannerUrl : null;
    const logoUrl = isSafeUploadUrl(body.logoUrl) ? body.logoUrl : null;
    if (bannerUrl !== null || logoUrl !== null) {
      const cat = typeof data.category === "string" ? data.category : existing.category;
      const fallback = getCategoryMigrated(cat)?.image ?? "/vendors/baker.png";
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
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to update vendor: ${errMsg}` },
      { status: 500 }
    );
  }
}

// ── DELETE: remove a vendor listing (admin) ───────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const existing = await db.vendor.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }
    // cascade deletes reviews + bookings via the schema relation onDelete
    await db.vendor.delete({ where: { slug } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/vendors/[slug]] DELETE failed:", err);
    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 }
    );
  }
}

// ── PATCH flags: feature / verify (admin quick-toggle) ────────────────────

interface AdminToggleBody {
  featured?: unknown;
  verified?: unknown;
  approved?: unknown;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Admin guard — only admins can approve/feature/verify vendors
    const guard = await requireAdmin();
    if (guard) return guard;

    const { slug } = await params;
    const body = (await req.json()) as AdminToggleBody;
    const data: Prisma.VendorUpdateInput = {};
    if (typeof body.featured === "boolean") data.featured = body.featured;
    if (typeof body.verified === "boolean") data.verified = body.verified;
    if (typeof body.approved === "boolean") data.approved = body.approved;
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update (provide featured/verified/approved)" },
        { status: 400 }
      );
    }
    const existing = await db.vendor.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }
    const updated = await db.vendor.update({
      where: { slug },
      data,
      include: { reviews: { orderBy: { createdAt: "desc" } } },
    });
    return NextResponse.json({ vendor: transformVendor(updated) });
  } catch (err) {
    console.error("[api/vendors/[slug]] PUT failed:", err);
    return NextResponse.json(
      { error: "Failed to update vendor flags" },
      { status: 500 }
    );
  }
}
