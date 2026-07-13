import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { logger } from "@/lib/logger";
import { parseJsonArray } from "@/lib/format";

/**
 * GET /api/vendor/profile
 * Returns the authenticated vendor's full profile (resolved from session).
 * Returns ALL vendor fields — this is the canonical source for the dashboard.
 *
 * PUT /api/vendor/profile
 * Updates the authenticated vendor's profile.
 * - Accepts ALL vendor fields.
 * - Defensively coerces types (empty string → null for optionals, string → number for numerics).
 * - Normalizes tags/gallery to JSON array strings.
 * - Returns the FULL updated vendor (same shape as GET) so the frontend can
 *   update its cache without a refetch.
 */

// ── Helpers ────────────────────────────────────────────────────────────────

/** Convert "" → null, otherwise return the string as-is. */
function strOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length > 0 ? s : null;
}

/** Convert "" → null, "123" → 123, 123 → 123. Returns null for invalid. */
function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/** Convert "" → 0, "123" → 123. Returns 0 for invalid. */
function numOrZero(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

/** Convert "" → null, "1.5" → 1.5. Returns null for invalid. */
function floatOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Convert various truthy/falsy values to boolean. */
function toBool(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1" || v === "on";
}

// ── Fields metadata ────────────────────────────────────────────────────────
// Each field is mapped to a coercer that guarantees the value matches the
// Prisma column type. This prevents PrismaClientValidationError from killing
// the entire update when one field has a wrong type.

const STRING_FIELDS = [
  "name", "tagline", "description", "category", "subcategory",
  "city", "country", "countryCode", "continent", "currency", "priceRange",
  "heroImage", "avatarImage",
  "state", "address", "zipCode",
  "whatsapp", "website", "instagram",
  "facebook", "youtube", "tiktok", "twitter", "snapchat",
  "pinterest", "linkedin", "telegram",
  "openHours", "serviceAreas", "prepTime", "bookingNotice",
  "metaTitle", "metaDescription",
  "businessType", "businessRegNumber", "gstVatNumber", "languagesSpoken",
  "responseTime", "fssaiNumber",
] as const;

const OPTIONAL_STRING_FIELDS = [
  "subcategory", "state", "address", "zipCode",
  "whatsapp", "website", "instagram",
  "facebook", "youtube", "tiktok", "twitter", "snapchat",
  "pinterest", "linkedin", "telegram",
  "openHours", "serviceAreas", "prepTime", "bookingNotice",
  "metaTitle", "metaDescription",
  "businessType", "businessRegNumber", "gstVatNumber", "languagesSpoken",
  "responseTime", "fssaiNumber",
] as const;

const BOOL_FIELDS = [
  "deliveryAvailable", "pickupAvailable", "homeService", "onlineConsultation",
  "hideAddress", "holidayMode", "vacationMode", "emergencyClosure",
  "settingsLocked",
] as const;

const NUMERIC_FIELDS: Record<string, (v: unknown) => number | null> = {
  yearStarted: numOrNull,
  basePrice: numOrZero,
  maxOrder: numOrNull,
  latitude: floatOrNull,
  longitude: floatOrNull,
  serviceRadiusKm: numOrNull,
};

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await resolveVendorFromSession();
    if (!session) {
      return NextResponse.json({ error: "No vendor listing found" }, { status: 404 });
    }
    const vendor = await db.vendor.findUnique({ where: { id: session.id } });
    if (!vendor) {
      return NextResponse.json({ error: "No vendor listing found" }, { status: 404 });
    }
    // Return the raw Prisma object — it contains ALL columns. The frontend
    // reads fields directly from this object. (tags and gallery are JSON
    // strings in the DB; the frontend parses them.)
    return NextResponse.json({ vendor });
  } catch (error: any) {
    logger.error("vendor-profile", "GET failed", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── PUT ────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const session = await resolveVendorFromSession();
    if (!session) {
      return NextResponse.json({ error: "No vendor listing found" }, { status: 404 });
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    // ── String fields (required: stored as-is; optional: "" → null) ──
    const optionalSet = new Set<string>(OPTIONAL_STRING_FIELDS);
    for (const f of STRING_FIELDS) {
      if (body[f] !== undefined) {
        const raw = body[f];
        if (optionalSet.has(f)) {
          updateData[f] = typeof raw === "string" ? strOrNull(raw) : null;
        } else {
          // Required string — keep as string, default to "" if null
          updateData[f] = typeof raw === "string" ? raw.trim() : String(raw ?? "");
        }
      }
    }

    // ── Boolean fields ──
    for (const f of BOOL_FIELDS) {
      if (body[f] !== undefined) {
        updateData[f] = toBool(body[f]);
      }
    }

    // ── Numeric fields (coerce string → number, "" → null) ──
    for (const [f, coercer] of Object.entries(NUMERIC_FIELDS)) {
      if (body[f] !== undefined) {
        updateData[f] = coercer(body[f]);
      }
    }

    // ── Tags: normalize to JSON array string ──
    if (body.tags !== undefined) {
      let tagsArray: string[] = [];
      if (Array.isArray(body.tags)) {
        tagsArray = body.tags
          .filter((t: any) => typeof t === "string" && t.trim())
          .map((t: string) => t.trim());
      } else if (typeof body.tags === "string") {
        const s = body.tags.trim();
        if (s.startsWith("[")) {
          try {
            tagsArray = JSON.parse(s)
              .filter((t: any) => typeof t === "string" && t.trim())
              .map((t: string) => t.trim());
          } catch {
            tagsArray = [];
          }
        } else if (s) {
          tagsArray = s.split(",").map((t) => t.trim()).filter(Boolean);
        }
      }
      updateData.tags = JSON.stringify(tagsArray.slice(0, 20));
    }

    // ── Gallery: normalize to JSON array string ──
    if (body.gallery !== undefined) {
      if (Array.isArray(body.gallery)) {
        updateData.gallery = JSON.stringify(body.gallery);
      } else if (typeof body.gallery === "string") {
        // Already a JSON string or empty — store as-is
        updateData.gallery = body.gallery || "[]";
      }
    }

    // ── Years active (Int, required) ──
    if (body.yearsActive !== undefined) {
      updateData.yearsActive = numOrZero(body.yearsActive) || 1;
    }

    // Never allow these to be updated via this route:
    delete updateData.id;
    delete updateData.slug;
    delete updateData.ecosystem;
    delete updateData.owner_user_id;
    delete updateData.userEmail;
    delete updateData.ownership_status;
    delete updateData.claimToken;
    delete updateData.claimTokenExpiresAt;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true, vendor: await db.vendor.findUnique({ where: { id: session.id } }) });
    }

    const updated = await db.vendor.update({
      where: { id: session.id },
      data: updateData,
    });

    // Revalidate cached pages
    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath(`/vendor/${updated.slug}`);
      revalidatePath("/");
      revalidatePath("/sitemap.xml");
    } catch {
      // non-fatal
    }

    return NextResponse.json({ success: true, vendor: updated });
  } catch (error: any) {
    logger.error("vendor-profile", "PUT failed", {
      error: error.message,
      code: error.code,
    });
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
