import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * GET /api/vendor/profile
 * Returns the authenticated vendor's full profile (resolved from session).
 *
 * PUT /api/vendor/profile
 * Updates the authenticated vendor's profile.
 * Ownership is ALWAYS resolved from the Supabase session — never from frontend.
 *
 * Session resolution uses getUser() first (verifies JWT with Supabase server,
 * more reliable on Vercel serverless), then falls back to getSession().
 */

async function getVendorFromSession() {
  const supabase = await createSupabaseServerClient();

  // Step 1: Try getUser() — verifies the JWT with Supabase's auth server.
  // This is more reliable on Vercel serverless where cookies may not propagate.
  let userId: string | null = null;
  try {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (!userErr && user?.id) {
      userId = user.id;
    }
  } catch {}

  // Step 2: Fallback to getSession() if getUser() didn't return a user
  if (!userId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch {}
  }

  if (!userId) return null;

  const vendor = await db.vendor.findFirst({
    where: { owner_user_id: userId },
  });
  return vendor;
}

export async function GET() {
  try {
    const vendor = await getVendorFromSession();
    if (!vendor) {
      return NextResponse.json({ error: "No vendor listing found" }, { status: 404 });
    }
    return NextResponse.json({ vendor });
  } catch (error: any) {
    console.error("[vendor/profile] GET failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const ts = () => new Date().toISOString();
  console.log(`[PROFILE-PUT] ${ts()} ═══════════════════════════════════════════════`);
  console.log(`[PROFILE-PUT] ${ts()} PUT /api/vendor/profile called`);

  try {
    console.log(`[PROFILE-PUT] ${ts()} Step 1: Resolving vendor from session`);
    const vendor = await getVendorFromSession();
    if (!vendor) {
      console.error(`[PROFILE-PUT] ${ts()} ❌ No vendor found for session — returning 404`);
      return NextResponse.json({ error: "No vendor listing found" }, { status: 404 });
    }
    console.log(`[PROFILE-PUT] ${ts()} ✅ Vendor resolved: ID=${vendor.id}, name="${vendor.name}"`);

    console.log(`[PROFILE-PUT] ${ts()} Step 2: Parsing request body`);
    const body = await req.json();
    console.log(`[PROFILE-PUT] ${ts()} Body keys:`, Object.keys(body));

    // Build update data — only include provided fields
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

    console.log(`[PROFILE-PUT] ${ts()} Step 3: Updating vendor in database (fields: ${Object.keys(updateData).length})`);
    const updated = await db.vendor.update({
      where: { id: vendor.id },
      data: updateData,
    });
    console.log(`[PROFILE-PUT] ${ts()} ✅ Database commit successful. Vendor ID: ${updated.id}`);

    logger.info("vendor-profile", "Profile updated successfully", {
      vendorId: vendor.id,
      fieldsUpdated: Object.keys(updateData).length,
    });

    console.log(`[PROFILE-PUT] ${ts()} Returning success JSON`);
    return NextResponse.json({ success: true, vendor: updated });
  } catch (error: any) {
    console.error(`[PROFILE-PUT] ${ts()} ❌ PUT FAILED:`, error.message);
    console.error(`[PROFILE-PUT] ${ts()} Error code:`, error.code);
    console.error(`[PROFILE-PUT] ${ts()} Stack:`, error.stack);
    logger.error("vendor-profile", "PUT failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
