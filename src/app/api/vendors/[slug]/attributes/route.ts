import { NextRequest, NextResponse } from "next/server";
import { getVendorAttributes, setVendorAttributes } from "@/lib/attributes/attribute-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

/**
 * GET /api/vendors/[slug]/attributes — public, returns a vendor's attributes.
 * Cached 1 hour.
 *
 * POST /api/vendors/[slug]/attributes — auth-required (vendor owner or admin).
 *   Body: { attributeIds: string[] }
 *   Replaces the vendor's full attribute set.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const vendor = await db.vendor.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }
    const attributes = await getVendorAttributes(vendor.id);
    const res = NextResponse.json({ attributes });
    res.headers.set("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res;
  } catch (error: any) {
    console.error("[api/vendors/[slug]/attributes] GET failed:", error);
    return NextResponse.json({ error: "Failed to fetch vendor attributes" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // ── Auth ──
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const vendor = await db.vendor.findUnique({
      where: { slug },
      select: { id: true, owner_user_id: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Authorization: owner or admin
    const isAdmin = user.app_metadata?.role === "admin";
    if (vendor.owner_user_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: "Not authorized to edit this vendor" }, { status: 403 });
    }

    const body = await req.json().catch(() => null) as { attributeIds?: string[] } | null;
    if (!body || !Array.isArray(body.attributeIds)) {
      return NextResponse.json({ error: "attributeIds array required" }, { status: 400 });
    }

    await setVendorAttributes(vendor.id, body.attributeIds);
    const attributes = await getVendorAttributes(vendor.id);
    return NextResponse.json({ attributes });
  } catch (error: any) {
    console.error("[api/vendors/[slug]/attributes] POST failed:", error);
    return NextResponse.json({ error: "Failed to save vendor attributes" }, { status: 500 });
  }
}
