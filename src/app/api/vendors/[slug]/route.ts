import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
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
    // ── Social media (additional platforms) ──
    facebook: v.facebook,
    youtube: v.youtube,
    tiktok: v.tiktok,
    twitter: v.twitter,
    snapchat: v.snapchat,
    // ── India-specific ──
    fssaiNumber: v.fssaiNumber,
    // ── Listing settings ──
    settingsLocked: v.settingsLocked,
    // ── Business settings ──
    openHours: v.openHours,
    deliveryAvailable: v.deliveryAvailable,
    pickupAvailable: v.pickupAvailable,
    serviceAreas: v.serviceAreas,
    // ── SEO ──
    metaTitle: v.metaTitle,
    metaDescription: v.metaDescription,
    latitude: v.latitude,
    longitude: v.longitude,
    serviceRadiusKm: v.serviceRadiusKm,
    // ── Business profile management ──
    businessType: v.businessType,
    yearStarted: v.yearStarted,
    businessRegNumber: v.businessRegNumber,
    gstVatNumber: v.gstVatNumber,
    languagesSpoken: v.languagesSpoken,
    hideAddress: v.hideAddress,
    pinterest: v.pinterest,
    linkedin: v.linkedin,
    telegram: v.telegram,
    holidayMode: v.holidayMode,
    vacationMode: v.vacationMode,
    emergencyClosure: v.emergencyClosure,
    homeService: v.homeService,
    onlineConsultation: v.onlineConsultation,
    maxOrder: v.maxOrder,
    prepTime: v.prepTime,
    bookingNotice: v.bookingNotice,
    responseRate: v.responseRate ?? undefined,
    profileViews: v.profileViews,
    productViews: v.productViews,
    galleryViews: (v as any).galleryViews ?? 0,
    // ── Admin-Created Business Listings ──
    listingStatus: v.listingStatus,
    adminCreated: v.adminCreated,
    // SECURITY: Do NOT expose userEmail, owner_user_id, or ownership_status
    // in public API responses — these are PII / credential-leak vectors.
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
  facebook?: unknown;
  youtube?: unknown;
  tiktok?: unknown;
  twitter?: unknown;
  snapchat?: unknown;
  fssaiNumber?: unknown;
  settingsLocked?: unknown;
  serviceRadiusKm?: unknown;
  // ── Business profile management ──
  businessType?: unknown;
  yearStarted?: unknown;
  businessRegNumber?: unknown;
  gstVatNumber?: unknown;
  languagesSpoken?: unknown;
  hideAddress?: unknown;
  pinterest?: unknown;
  linkedin?: unknown;
  telegram?: unknown;
  holidayMode?: unknown;
  vacationMode?: unknown;
  emergencyClosure?: unknown;
  homeService?: unknown;
  onlineConsultation?: unknown;
  maxOrder?: unknown;
  prepTime?: unknown;
  bookingNotice?: unknown;
  openHours?: unknown;
  serviceAreas?: unknown;
  metaTitle?: unknown;
  metaDescription?: unknown;
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
    // MUST require auth — no anonymous updates allowed
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
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
    // ── Social media (additional platforms) ──
    if (body.facebook !== undefined) {
      data.facebook = sanitizeWebsite(body.facebook) || null;
    }
    if (body.youtube !== undefined) {
      data.youtube = sanitizeWebsite(body.youtube) || null;
    }
    if (body.tiktok !== undefined) {
      data.tiktok = sanitizeInstagram(body.tiktok) || null;
    }
    if (body.twitter !== undefined) {
      data.twitter = sanitizeInstagram(body.twitter) || null;
    }
    if (body.snapchat !== undefined) {
      data.snapchat = sanitizeInstagram(body.snapchat) || null;
    }
    // ── India-specific ──
    if (body.fssaiNumber !== undefined) {
      data.fssaiNumber =
        typeof body.fssaiNumber === "string" && body.fssaiNumber.trim()
          ? body.fssaiNumber.trim().slice(0, 30)
          : null;
    }
    // ── Settings lock ──
    if (typeof body.settingsLocked === "boolean") {
      data.settingsLocked = body.settingsLocked;
    }
    if (body.serviceRadiusKm !== undefined) {
      const n = Number(body.serviceRadiusKm);
      data.serviceRadiusKm =
        Number.isFinite(n) && n > 0 ? Math.round(n) : null;
    }

    // ── Business profile management ──
    if (body.businessType !== undefined) {
      data.businessType =
        typeof body.businessType === "string" && body.businessType.trim()
          ? body.businessType.trim()
          : null;
    }
    if (body.yearStarted !== undefined) {
      const n = Number(body.yearStarted);
      data.yearStarted =
        Number.isFinite(n) && n > 1700 ? Math.round(n) : null;
    }
    if (body.businessRegNumber !== undefined) {
      data.businessRegNumber =
        typeof body.businessRegNumber === "string" && body.businessRegNumber.trim()
          ? body.businessRegNumber.trim().slice(0, 50)
          : null;
    }
    if (body.gstVatNumber !== undefined) {
      data.gstVatNumber =
        typeof body.gstVatNumber === "string" && body.gstVatNumber.trim()
          ? body.gstVatNumber.trim().slice(0, 30)
          : null;
    }
    if (body.languagesSpoken !== undefined) {
      data.languagesSpoken =
        typeof body.languagesSpoken === "string" && body.languagesSpoken.trim()
          ? body.languagesSpoken.trim().slice(0, 500)
          : null;
    }
    if (typeof body.hideAddress === "boolean") data.hideAddress = body.hideAddress;
    if (body.pinterest !== undefined) {
      data.pinterest = sanitizeWebsite(body.pinterest) || null;
    }
    if (body.linkedin !== undefined) {
      data.linkedin = sanitizeWebsite(body.linkedin) || null;
    }
    if (body.telegram !== undefined) {
      data.telegram = sanitizeInstagram(body.telegram) || null;
    }
    if (typeof body.holidayMode === "boolean") data.holidayMode = body.holidayMode;
    if (typeof body.vacationMode === "boolean") data.vacationMode = body.vacationMode;
    if (typeof body.emergencyClosure === "boolean") data.emergencyClosure = body.emergencyClosure;
    if (typeof body.homeService === "boolean") data.homeService = body.homeService;
    if (typeof body.onlineConsultation === "boolean") data.onlineConsultation = body.onlineConsultation;
    if (body.maxOrder !== undefined) {
      const n = Number(body.maxOrder);
      data.maxOrder = Number.isFinite(n) && n > 0 ? Math.round(n) : null;
    }
    if (body.prepTime !== undefined) {
      data.prepTime =
        typeof body.prepTime === "string" && body.prepTime.trim()
          ? body.prepTime.trim().slice(0, 100)
          : null;
    }
    if (body.bookingNotice !== undefined) {
      data.bookingNotice =
        typeof body.bookingNotice === "string" && body.bookingNotice.trim()
          ? body.bookingNotice.trim().slice(0, 100)
          : null;
    }
    if (body.openHours !== undefined) {
      data.openHours =
        typeof body.openHours === "string" && body.openHours.trim()
          ? body.openHours.trim().slice(0, 500)
          : null;
    }
    if (body.serviceAreas !== undefined) {
      data.serviceAreas =
        typeof body.serviceAreas === "string" && body.serviceAreas.trim()
          ? body.serviceAreas.trim().slice(0, 500)
          : null;
    }
    if (body.metaTitle !== undefined) {
      data.metaTitle =
        typeof body.metaTitle === "string" && body.metaTitle.trim()
          ? body.metaTitle.trim().slice(0, 200)
          : null;
    }
    if (body.metaDescription !== undefined) {
      data.metaDescription =
        typeof body.metaDescription === "string" && body.metaDescription.trim()
          ? body.metaDescription.trim().slice(0, 500)
          : null;
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
    // Admin-only — deleting vendors is destructive (cascades to reviews/bookings/products)
    const guard = await requireAdmin();
    if (guard) return guard;

    const { slug } = await params;
    const existing = await db.vendor.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Resolve admin identity for the audit log
    const supabase = await createSupabaseServerClient();
    let adminId = "unknown";
    let adminEmail: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        adminId = user.id;
        adminEmail = user.email ?? null;
      }
    } catch {}

    // Use the full cascade delete service — it handles all child tables,
    // storage cleanup, cache revalidation, and audit logging in a single
    // safe transaction. Never call db.vendor.delete() directly here.
    const { deleteVendor } = await import("@/lib/admin/vendor-delete-service");
    const result = await deleteVendor(existing.id, adminId, adminEmail, `Deleted via slug route: ${slug}`);

    if (!result.success) {
      const status = result.statusCode ?? 500;
      return NextResponse.json(
        { error: result.error || "Failed to delete vendor" },
        { status }
      );
    }

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

    // ── Update ownership_status + send notification on approve/reject ──
    // Use Supabase admin client (service role key) to bypass RLS and Prisma
    // entirely — this is the most reliable way to update ownership_status.
    if (typeof body.approved === "boolean") {
      const newStatus = body.approved ? "approved" : "rejected";


      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );


      const { data: updateData, error: updateError } = await supabaseAdmin
        .from("vendor_listings")
        .update({ ownership_status: newStatus })
        .eq("id", existing.id)
        .select();

      if (updateError) {
        console.error("[api/vendors/[slug]] Supabase ownership_status update FAILED:", {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint,
        });
      } else {
      }

      // Insert notification (also via Supabase admin)
      if (existing.owner_user_id) {
        const notifTitle = body.approved ? "Your listing is live! 🎉" : "Listing update";
        const notifMsg = body.approved
          ? `Great news! Your listing "${existing.name}" has been approved and is now live. View your dashboard at /dashboard`
          : `Thanks for submitting your listing. Unfortunately we couldn't approve it at this time. Please contact hello@findmybites.com for help.`;
        const notifLink = body.approved ? "/dashboard" : "/";

        const { error: notifError } = await supabaseAdmin
          .from("notifications")
          .insert({
            user_id: existing.owner_user_id,
            title: notifTitle,
            message: notifMsg,
            link: notifLink,
          });

        if (notifError) {
          console.error("[api/vendors/[slug]] Notification insert FAILED:", {
            message: notifError.message,
            code: notifError.code,
          });
        } else {
        }
      }
    }

    // ── Revalidate SEO pages so new city/category pages go live instantly ──
    // When a vendor is approved in a (possibly new) city, regenerate the
    // auto-generated SEO pages + sitemap.
    try {
      const citySlug = existing.city
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      const migratedCat = getCategoryMigrated(existing.category)?.id ?? existing.category;
      // Keyword page: /[category]-[city]
      revalidatePath(`/${migratedCat}-${citySlug}`);
      // City page: /[city]
      revalidatePath(`/${citySlug}`);
      // City/category page: /[city]/[category]
      revalidatePath(`/${citySlug}/${migratedCat}`);
      // Sitemap + homepage (so new links appear)
      revalidatePath("/sitemap.xml");
      revalidatePath("/");
    } catch (e) {
      console.error("[api/vendors/[slug]] revalidatePath failed:", e);
    }

    return NextResponse.json({ vendor: transformVendor(updated) });
  } catch (err) {
    console.error("[api/vendors/[slug]] PUT failed:", err);
    return NextResponse.json(
      { error: "Failed to update vendor flags" },
      { status: 500 }
    );
  }
}
