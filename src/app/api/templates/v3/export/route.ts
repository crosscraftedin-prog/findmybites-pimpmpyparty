import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { exportTemplate } from "@/lib/products/template-engine-v3";

/**
 * GET /api/templates/v3/export?templateId=xxx
 *
 * Exports a template as JSON (for Import/Export feature).
 * Admin-only.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const templateId = req.nextUrl.searchParams.get("templateId");
    if (!templateId) {
      return NextResponse.json({ error: "templateId is required" }, { status: 400 });
    }

    const exported = await exportTemplate(templateId);
    if (!exported) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(exported);
  } catch (error: any) {
    console.error("[templates/v3/export] failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
