import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

/** Parse a JSON string column; fall back to the default on failure. */
function safeParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * GET /api/admin/templates/[id]/audit-log — return the recent audit log for a
 * template, sorted newest-first, capped at 100 entries.
 *
 * Each entry has its `changeData` JSON column parsed back into an object so
 * the admin UI can render diffs without an extra parse step.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;

    // Sanity-check that the template exists (so 404 is meaningful). The audit
    // log itself has onDelete: Cascade, so a missing template means no logs.
    const template = await db.listingTemplate.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const logs = await db.templateAuditLog.findMany({
      where: { templateId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const enriched = (logs ?? []).map((l) => ({
      id: l.id,
      templateId: l.templateId,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      fieldName: l.fieldName,
      changeSummary: l.changeSummary,
      changeData: safeParse(l.changeData, {}),
      adminEmail: l.adminEmail,
      createdAt: l.createdAt,
    }));

    return NextResponse.json({ logs: enriched });
  } catch (error: any) {
    console.error(
      "[admin/templates/[id]/audit-log] GET failed:",
      error?.message
    );
    // Degrade gracefully — return an empty log rather than 500'ing the UI.
    return NextResponse.json({ logs: [] });
  }
}
