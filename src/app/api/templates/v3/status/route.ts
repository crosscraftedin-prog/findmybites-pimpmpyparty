import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { updateTemplateStatus, getTemplatesByStatus } from "@/lib/products/template-engine-v3";

/**
 * GET /api/templates/v3/status?status=draft
 * POST /api/templates/v3/status  { templateId, status }
 *
 * Manage template lifecycle: draft → published → archived.
 * Admin-only.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const status = req.nextUrl.searchParams.get("status") as "draft" | "published" | "archived" | null;
    const templates = await getTemplatesByStatus(status || undefined);
    return NextResponse.json({ templates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await req.json();
    const { templateId, status } = body as { templateId: string; status: "draft" | "published" | "archived" };

    if (!templateId || !status) {
      return NextResponse.json({ error: "templateId and status are required" }, { status: 400 });
    }

    if (!["draft", "published", "archived"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const success = await updateTemplateStatus(templateId, status);
    if (!success) {
      return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
