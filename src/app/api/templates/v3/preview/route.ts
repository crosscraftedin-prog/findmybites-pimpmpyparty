import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getTemplatePreview } from "@/lib/products/template-engine-v3";

/**
 * GET /api/templates/v3/preview?templateId=xxx
 *
 * Returns a complete preview of a template for the Admin Preview panel.
 * Admins can see how the template will render without publishing.
 * Works with draft templates.
 *
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

    const preview = await getTemplatePreview(templateId);
    if (!preview) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(preview);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
