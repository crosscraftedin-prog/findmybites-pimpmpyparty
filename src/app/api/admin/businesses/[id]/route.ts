import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateClaimLink, getClaimHistory, bulkUpdateListingStatus, approveClaim, rejectClaim } from "@/lib/admin/admin-listing-service";
import { db } from "@/lib/db";

/**
 * GET /api/admin/businesses/[id] — get a single admin-created business + claim history.
 *
 * PUT /api/admin/businesses/[id] — update business fields.
 *   Body: partial vendor fields
 *
 * DELETE /api/admin/businesses/[id] — delete (sets listingStatus=hidden, does NOT hard-delete).
 *
 * POST /api/admin/businesses/[id]?action=generate-claim-link — generate a new claim link.
 * POST /api/admin/businesses/[id]?action=approve-claim — approve a pending claim.
 * POST /api/admin/businesses/[id]?action=reject-claim — reject a pending claim.
 */
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  const isAdmin = user.app_metadata?.role === "admin";
  if (!isAdmin) return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  return { user, email: user.email ?? "" };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  try {
    const vendor = await db.vendor.findUnique({
      where: { id },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    const claimHistory = await getClaimHistory(id);
    return NextResponse.json({ vendor, claimHistory });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch business" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  try {
    const body = await req.json();
    // Whitelist updatable fields
    const allowed: string[] = [
      "name", "tagline", "description", "category", "subcategory",
      "city", "state", "country", "countryCode", "continent", "currency",
      "priceRange", "basePrice", "phone", "whatsapp", "userEmail",
      "website", "instagram", "facebook", "address", "zipCode",
      "latitude", "longitude", "serviceRadiusKm",
      "deliveryAvailable", "pickupAvailable", "openHours",
      "heroImage", "avatarImage", "gallery", "tags",
      "metaTitle", "metaDescription", "featured", "verified",
      "listingStatus", "businessSource",
    ];
    const data: any = {};
    for (const key of allowed) {
      if (key in body) {
        if (key === "gallery" || key === "tags") {
          data[key] = JSON.stringify(body[key]);
        } else {
          data[key] = body[key];
        }
      }
    }

    const vendor = await db.vendor.update({
      where: { id },
      data,
      select: { id: true, slug: true, name: true },
    });

    return NextResponse.json({ vendor });
  } catch (error: any) {
    console.error("[api/admin/businesses/[id]] PUT failed:", error);
    return NextResponse.json({ error: "Failed to update business" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "generate-claim-link") {
      const token = await generateClaimLink(id);
      return NextResponse.json({ claimToken: token, claimUrl: `/claim/${token}` });
    }

    if (action === "approve-claim") {
      await approveClaim(id, auth.user.id, auth.email);
      return NextResponse.json({ success: true, message: "Claim approved" });
    }

    if (action === "reject-claim") {
      const body = await req.json().catch(() => ({}));
      await rejectClaim(id, auth.user.id, auth.email, body.reason);
      return NextResponse.json({ success: true, message: "Claim rejected" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("[api/admin/businesses/[id]] POST failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  try {
    // Soft-delete: set listingStatus=hidden (don't hard-delete — preserve SEO/claims)
    await db.vendor.update({
      where: { id },
      data: { listingStatus: "hidden" },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to hide business" }, { status: 500 });
  }
}
