import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/constants";
import { bulkUpdateListingStatus, bulkInviteVendors } from "@/lib/admin/admin-listing-service";

/**
 * POST /api/admin/businesses/bulk — bulk operations on admin-created businesses.
 *   Body: { action: "publish"|"hide"|"invite", vendorIds: string[] }
 *
 * Admin only.
 */
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  if (!isAdminEmail(user.email)) return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  return { user, email: user.email ?? "" };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { action, vendorIds } = body as { action: string; vendorIds: string[] };

    if (!Array.isArray(vendorIds) || vendorIds.length === 0) {
      return NextResponse.json({ error: "vendorIds array required" }, { status: 400 });
    }

    if (action === "publish") {
      const result = await bulkUpdateListingStatus(vendorIds, "published", auth.user.id, auth.email);
      return NextResponse.json(result);
    }

    if (action === "hide") {
      const result = await bulkUpdateListingStatus(vendorIds, "hidden", auth.user.id, auth.email);
      return NextResponse.json(result);
    }

    if (action === "invite") {
      const result = await bulkInviteVendors(vendorIds, auth.user.id, auth.email);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("[api/admin/businesses/bulk] POST failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
