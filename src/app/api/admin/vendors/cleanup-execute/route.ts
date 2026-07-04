/**
 * POST /api/admin/vendors/cleanup-execute
 * Body: { reason: string }
 *
 * Deletes all vendors whose names match test/demo/sample/temp/dummy.
 * Returns per-vendor results + summary.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cleanupTestVendors } from "@/lib/admin/vendor-delete-service";

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await req.json().catch(() => ({}));
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "Cleanup test vendors";

    const supabase = await createSupabaseServerClient();
    let adminId = "unknown";
    let adminEmail: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { adminId = user.id; adminEmail = user.email ?? null; }
    } catch {}

    const { results, preview, summary } = await cleanupTestVendors(adminId, adminEmail, reason);

    return NextResponse.json({
      success: true,
      summary,
      preview,
      results,
      message: `Cleaned up ${summary.success} of ${preview.length} test vendors.`,
    });
  } catch (err: any) {
    console.error("[admin/vendors/cleanup-execute] failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
