import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/constants";
import { adminCreateVendor, findDuplicateListings } from "@/lib/admin/admin-listing-service";
import { db } from "@/lib/db";

/**
 * GET /api/admin/businesses — list admin-created businesses.
 *   ?status=published  — filter by listingStatus
 *   ?ownership=unclaimed — filter by ownership_status
 *   ?q=search          — search by name/city/phone
 *   Admin only.
 *
 * POST /api/admin/businesses — create a new admin-created business.
 *   Body: AdminCreateVendorInput
 *   Returns: { id, slug, claimToken }
 */
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  // Admin check is email-based (matches the admin page's ADMIN_EMAILS check)
  if (!isAdminEmail(user.email)) return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  return { user, email: user.email ?? "" };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const ownership = url.searchParams.get("ownership") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const adminOnly = url.searchParams.get("adminOnly") !== "false";
  const limit = Math.min(100, Number(url.searchParams.get("limit") ?? 50));

  try {
    const where: any = {};
    if (adminOnly) where.adminCreated = true;
    if (status) where.listingStatus = status;
    if (ownership) where.ownership_status = ownership;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    const vendors = await db.vendor.findMany({
      where,
      select: {
        id: true, name: true, slug: true, category: true, city: true, country: true,
        phone: true, userEmail: true, avatarImage: true, heroImage: true,
        listingStatus: true, ownership_status: true, inviteStatus: true,
        adminCreated: true, businessSource: true, createdAt: true,
        claimedAt: true, claimToken: true, inviteSentAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ vendors, total: vendors.length });
  } catch (error: any) {
    console.error("[api/admin/businesses] GET failed:", error);
    return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();

    // ── Duplicate detection ──
    const duplicates = await findDuplicateListings({
      phone: body.phone,
      email: body.userEmail,
      name: body.name,
    });

    if (duplicates.length > 0) {
      return NextResponse.json({
        error: "Duplicate business found",
        duplicates,
      }, { status: 409 });
    }

    const result = await adminCreateVendor(body, auth.user.id, auth.email);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("[api/admin/businesses] POST failed:", error);
    return NextResponse.json({ error: error.message || "Failed to create business" }, { status: 500 });
  }
}
