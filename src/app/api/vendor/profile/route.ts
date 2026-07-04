import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";

/**
 * GET /api/vendor/profile
 * Returns the authenticated vendor's full profile (resolved from session).
 *
 * PUT /api/vendor/profile
 * Updates the authenticated vendor's profile.
 * Ownership is ALWAYS resolved from the Supabase session — never from frontend.
 */

async function getVendorFromSession() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return null;
  const vendor = await db.vendor.findFirst({
    where: { owner_user_id: session.user.id },
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
  try {
    const vendor = await getVendorFromSession();
    if (!vendor) {
      return NextResponse.json({ error: "No vendor listing found" }, { status: 404 });
    }

    const body = await req.json();

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

    const updated = await db.vendor.update({
      where: { id: vendor.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, vendor: updated });
  } catch (error: any) {
    console.error("[vendor/profile] PUT failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
