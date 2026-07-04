/**
 * GET /api/admin/vendors/cleanup-preview
 *
 * Previews vendors whose names contain test/demo/sample/temp/dummy.
 * No deletion happens — read-only.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { previewTestVendors } from "@/lib/admin/vendor-delete-service";

export async function GET(_req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const preview = await previewTestVendors();
    return NextResponse.json({ vendors: preview, count: preview.length });
  } catch (err: any) {
    console.error("[admin/vendors/cleanup-preview] failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
