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
  console.log(`[TRACE] ${ts()} ═══════════════════════════════════════════════`);
  console.log(`[TRACE] ${ts()} PUT /api/vendor/profile — API ENTERED`);

  try {
    // Step 1: Authentication
    console.log(`[TRACE] ${ts()} PUT — Step 1: Authentication (resolveVendorFromSession)`);
    const session = await resolveVendorFromSession();
    if (!session) {
      console.log(`[TRACE] ${ts()} PUT — ❌ AUTH FAILED: no vendor session — returning 404`);
      console.log(`[TRACE] ${ts()} PUT — FIRST EXCEPTION: Auth session missing — user not authenticated`);
      return NextResponse.json({ error: "No vendor listing found" }, { status: 404 });
    }
    console.log(`[TRACE] ${ts()} PUT — ✅ AUTH SUCCESS: vendorId=${session.id}, name="${session.name}"`);

    // Step 2: Parse body
    console.log(`[TRACE] ${ts()} PUT — Step 2: Parsing request body`);
    const body = await req.json();
    console.log(`[TRACE] ${ts()} PUT — Body parsed: ${Object.keys(body).length} fields`);

    // Step 3: Build update data
    console.log(`[TRACE] ${ts()} PUT — Step 3: Building update data`);
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

    if (body.gallery !== undefined) {
      updateData.gallery = Array.isArray(body.gallery) ? JSON.stringify(body.gallery) : body.gallery;
    }

    if (body.yearStarted !== undefined) updateData.yearStarted = body.yearStarted ? Number(body.yearStarted) : null;
    if (body.basePrice !== undefined) updateData.basePrice = Number(body.basePrice) || 0;
    if (body.maxOrder !== undefined) updateData.maxOrder = body.maxOrder ? Number(body.maxOrder) : null;
    if (body.latitude !== undefined) updateData.latitude = body.latitude ? Number(body.latitude) : null;
    if (body.longitude !== undefined) updateData.longitude = body.longitude ? Number(body.longitude) : null;
    if (body.serviceRadiusKm !== undefined) updateData.serviceRadiusKm = body.serviceRadiusKm ? Number(body.serviceRadiusKm) : null;

    console.log(`[TRACE] ${ts()} PUT — Update data built: ${Object.keys(updateData).length} fields`);

    // Step 4: Database transaction
    console.log(`[TRACE] ${ts()} PUT — Step 4: Database transaction BEGIN`);
    console.log(`[TRACE] ${ts()} PUT — Calling db.vendor.update() for vendorId=${session.id}`);
    const updated = await db.vendor.update({
      where: { id: session.id },
      data: updateData,
    });
    console.log(`[TRACE] ${ts()} PUT — ✅ DATABASE COMMIT SUCCESS — vendorId=${updated.id}, name="${updated.name}"`);

    // Step 5: Cache invalidation (revalidatePath)
    console.log(`[TRACE] ${ts()} PUT — Step 5: Cache invalidation (revalidatePath)`);
    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath(`/vendor/${updated.slug}`);
      revalidatePath("/");
      revalidatePath("/sitemap.xml");
      console.log(`[TRACE] ${ts()} PUT — ✅ revalidatePath() completed`);
    } catch (revalErr: any) {
      console.log(`[TRACE] ${ts()} PUT — ⚠️ revalidatePath() failed (non-fatal): ${revalErr?.message}`);
    }

    // Step 6: Response
    console.log(`[TRACE] ${ts()} PUT — Step 6: Returning success response`);
    console.log(`[TRACE] ${ts()} PUT — ✅ RESPONSE SENT: { success: true, vendor: { id: ${updated.id} } }`);
    console.log(`[TRACE] ${ts()} ═══════════════════════════════════════════════`);
    return NextResponse.json({ success: true, vendor: updated });
  } catch (error: any) {
    console.log(`[TRACE] ${ts()} PUT — ❌ EXCEPTION: ${error.message}`);
    console.log(`[TRACE] ${ts()} PUT — Error code: ${error.code}`);
    console.log(`[TRACE] ${ts()} PUT — Stack: ${error.stack?.split('\n').slice(0, 5).join(' | ')}`);
    console.log(`[TRACE] ${ts()} PUT — FIRST EXCEPTION: ${error.message}`);
    console.log(`[TRACE] ${ts()} ═══════════════════════════════════════════════`);
    logger.error("vendor-profile", "PUT failed", {
      error: error.message,
      code: error.code,
      stack: error.stack?.split("\n").slice(0, 3).join("\n"),
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
