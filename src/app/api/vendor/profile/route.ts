import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { logger } from "@/lib/logger";

/**
 * GET /api/vendor/profile
 * Returns the authenticated vendor's full profile (resolved from session).
 *
 * PUT /api/vendor/profile
 * Updates the authenticated vendor's profile.
 *
 * Authentication is handled by the SHARED resolveVendorFromSession() helper
 * in @/lib/vendor-session — no duplicate auth logic here. That helper uses
 * getUser() (JWT verification) first, then falls back to getSession() (cookie).
 */

export async function GET() {
  try {
    const session = await resolveVendorFromSession();
    if (!session) {
      return NextResponse.json({ error: "No vendor listing found" }, { status: 404 });
    }
    // Fetch the full vendor row (resolveVendorFromSession returns only id+name+ecosystem+category+currency)
    const vendor = await db.vendor.findUnique({ where: { id: session.id } });
    if (!vendor) {
      return NextResponse.json({ error: "No vendor listing found" }, { status: 404 });
    }
    return NextResponse.json({ vendor });
  } catch (error: any) {
    logger.error("vendor-profile", "GET failed", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const ts = () => new Date().toISOString();
  logger.info("vendor-profile", "PUT called", { timestamp: ts() });

  try {
    // Step 1: Resolve vendor from session (shared helper — no duplicate auth)
    const session = await resolveVendorFromSession();
    if (!session) {
      logger.warn("vendor-profile", "PUT failed — no vendor session", { timestamp: ts() });
      return NextResponse.json({ error: "No vendor listing found" }, { status: 404 });
    }
    logger.info("vendor-profile", "Vendor resolved", { vendorId: session.id, name: session.name });

    // Step 2: Parse body
    const body = await req.json();

    // Step 3: Build update data — only include provided fields
    const updateData: any = {};
    const fields = [
      "name", "tagline", "description", "category", "subcategory",
      "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice",
      "heroImage", "avatarImage", "tags",
      "state", "address", "zipCode", "latitude", "longitude", "serviceRadiusKm",
      "whatsapp", "website", "instagram", "facebook", "youtube", "tiktok", "twitter", "snapchat",
      "pinterest", "linkedin", "telegram",
      "openHours", "deliveryAvailable", "pickupAvailable", "homeService", "onlineConsultation",
      "serviceAreas", "maxOrder", "prepTime", "bookingNotice",
      "metaTitle", "metaDescription",
      "businessType", "yearStarted", "businessRegNumber", "gstVatNumber", "languagesSpoken",
      "hideAddress", "holidayMode", "vacationMode", "emergencyClosure",
      "responseTime", "settingsLocked",
    ];

    for (const f of fields) {
      if (body[f] !== undefined) updateData[f] = body[f];
    }

    // Gallery (JSON array)
    if (body.gallery !== undefined) {
      updateData.gallery = Array.isArray(body.gallery) ? JSON.stringify(body.gallery) : body.gallery;
    }

    // Numeric fields
    if (body.yearStarted !== undefined) updateData.yearStarted = body.yearStarted ? Number(body.yearStarted) : null;
    if (body.basePrice !== undefined) updateData.basePrice = Number(body.basePrice) || 0;
    if (body.maxOrder !== undefined) updateData.maxOrder = body.maxOrder ? Number(body.maxOrder) : null;
    if (body.latitude !== undefined) updateData.latitude = body.latitude ? Number(body.latitude) : null;
    if (body.longitude !== undefined) updateData.longitude = body.longitude ? Number(body.longitude) : null;
    if (body.serviceRadiusKm !== undefined) updateData.serviceRadiusKm = body.serviceRadiusKm ? Number(body.serviceRadiusKm) : null;

    // Step 4: Database commit — THIS IS THE ONLY STEP THAT CAN FAIL PUBLISHING
    logger.info("vendor-profile", "Updating vendor in database", {
      vendorId: session.id,
      fieldsUpdated: Object.keys(updateData).length,
    });
    const updated = await db.vendor.update({
      where: { id: session.id },
      data: updateData,
    });
    logger.info("vendor-profile", "✅ Database commit successful", { vendorId: updated.id });

    // Step 5: Return success — vendor is saved, publishing is COMPLETE
    // Background jobs (AI SEO, cache, notifications) run in the frontend
    // and NEVER affect the publish status.
    return NextResponse.json({ success: true, vendor: updated });
  } catch (error: any) {
    logger.error("vendor-profile", "PUT failed", {
      error: error.message,
      code: error.code,
      stack: error.stack?.split("\n").slice(0, 3).join("\n"),
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
