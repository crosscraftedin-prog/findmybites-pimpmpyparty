import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { importTemplate } from "@/lib/products/template-engine-v3";

/**
 * POST /api/templates/v3/import
 *
 * Imports a template from JSON.
 * Admin-only.
 *
 * Body: { template: { slug, name, ... fields: [...] } }
 * Returns: { templateId: string }
 */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await req.json();
    const templateId = await importTemplate(body);

    if (!templateId) {
      return NextResponse.json({ error: "Failed to import template" }, { status: 500 });
    }

    return NextResponse.json({ templateId, success: true });
  } catch (error: any) {
    console.error("[templates/v3/import] failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
