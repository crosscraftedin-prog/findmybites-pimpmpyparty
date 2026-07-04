/**
 * POST /api/admin/vendors/bulk-delete
 * Body: { vendorIds: string[], reason: string }
 *
 * Deletes multiple vendors sequentially. Each deletion is transactional;
 * a single failure doesn't block the others.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteVendors } from "@/lib/admin/vendor-delete-service";

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await req.json();
    const { vendorIds, reason } = body;

    if (!Array.isArray(vendorIds) || vendorIds.length === 0) {
      return NextResponse.json({ error: "vendorIds array is required" }, { status: 400 });
    }
    if (typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json({ error: "A reason is required for audit logging" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    let adminId = "unknown";
    let adminEmail: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { adminId = user.id; adminEmail = user.email ?? null; }
    } catch {}

    const { results, summary } = await deleteVendors(vendorIds, adminId, adminEmail, reason.trim());

    return NextResponse.json({
      success: true,
      summary,
      results,
      message: `Deleted ${summary.success} of ${vendorIds.length} vendors.`,
    });
  } catch (err: any) {
    console.error("[admin/vendors/bulk-delete] failed:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
