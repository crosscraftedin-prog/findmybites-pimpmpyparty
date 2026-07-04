/**
 * DELETE /api/admin/vendors/[id]/delete
 *
 * Permanently deletes a vendor and ALL related data (products, bookings,
 * reviews, analytics, storage files, etc.) inside a DB transaction.
 *
 * Body: { reason: string }
 * Protected by requireAdmin().
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteVendor } from "@/lib/admin/vendor-delete-service";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;

    // Resolve admin identity for the audit log
    const supabase = await createSupabaseServerClient();
    let adminId = "unknown";
    let adminEmail: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        adminId = user.id;
        adminEmail = user.email ?? null;
      }
    } catch {}

    const body = await req.json().catch(() => ({}));
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

    if (!reason) {
      return NextResponse.json({ error: "A reason is required for audit logging" }, { status: 400 });
    }

    const result = await deleteVendor(id, adminId, adminEmail, reason);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Delete failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Deleted "${result.vendorName}" and all related data.`,
      ...result,
    });
  } catch (err: any) {
    console.error("[admin/vendors/delete] failed:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
