import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Audit-log helper. Best-effort: failures are swallowed so they never break
 * the main request flow.
 */
async function logAudit(
  templateId: string,
  action: string,
  entity: string,
  entityId?: string,
  fieldName?: string,
  changeSummary?: string,
  adminEmail?: string | null
) {
  try {
    await db.templateAuditLog.create({
      data: {
        templateId,
        action,
        entity,
        entityId,
        fieldName,
        changeSummary,
        adminEmail,
      },
    });
  } catch {}
}

/**
 * POST /api/admin/templates/[id]/fields/[fieldId]/duplicate — duplicate a
 * single field within a template. The new field gets:
 *   - key  = `{originalKey}_copy`
 *   - label = `{label} (Copy)`
 *   - same type / section / properties as the source
 *   - sortOrder = (max sortOrder in that section) + 1, so it lands last
 *
 * An audit-log entry records the duplication.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  // Resolve admin email for the audit log (best-effort).
  let adminEmail: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    adminEmail = session?.user?.email ?? null;
  } catch {}

  try {
    const { id, fieldId } = await params;

    // Fetch the source field — verify it belongs to the path's template.
    const source = await db.templateField.findUnique({
      where: { id: fieldId },
    });
    if (!source || source.templateId !== id) {
      return NextResponse.json(
        { error: "Field not found for this template" },
        { status: 404 }
      );
    }

    // Find the current max sortOrder in the same section so the duplicate
    // is appended to the end of that section.
    const siblings = await db.templateField.findMany({
      where: { templateId: id, section: source.section },
      select: { sortOrder: true },
      orderBy: { sortOrder: "desc" },
      take: 1,
    });
    const maxSort = siblings && siblings.length > 0 ? siblings[0].sortOrder : 0;

    const newKey = `${source.key}_copy`;
    const newLabel = `${source.label} (Copy)`;

    const created = await db.templateField.create({
      data: {
        templateId: id,
        key: newKey,
        label: newLabel,
        type: source.type,
        section: source.section,
        sortOrder: maxSort + 1,
        required: source.required,
        enabled: source.enabled,
        placeholder: source.placeholder,
        helpText: source.helpText,
        unit: source.unit,
        span: source.span,
        filterGroupName: source.filterGroupName,
        staticOptions: source.staticOptions,
        condition: source.condition,
        subFields: source.subFields,
        toggleOptions: source.toggleOptions,
        maxImages: source.maxImages,
        maxFileSize: source.maxFileSize,
        minValue: source.minValue,
        maxValue: source.maxValue,
        step: source.step,
        minLength: source.minLength,
        maxLength: source.maxLength,
        pattern: source.pattern,
        patternHint: source.patternHint,
        repeatable: source.repeatable,
        minRepeats: source.minRepeats,
        maxRepeats: source.maxRepeats,
        repeatLabel: source.repeatLabel,
        repeatFields: source.repeatFields,
        searchable: source.searchable,
        seoIndexed: source.seoIndexed,
        aiEnabled: source.aiEnabled,
        globalRef: source.globalRef,
      },
    });

    await logAudit(
      id,
      "field_add",
      "field",
      created.id,
      newKey,
      `Duplicated field from ${source.key}`,
      adminEmail
    );

    return NextResponse.json({ field: created }, { status: 201 });
  } catch (error: any) {
    console.error(
      "[admin/templates/[id]/fields/[fieldId]/duplicate] POST failed:",
      error?.message
    );

    const msg = error?.message ?? "";
    const dbUnavailable =
      error?.name === "PrismaClientInitializationError" ||
      msg.includes("must start with the protocol") ||
      msg.includes("Error validating datasource") ||
      msg.includes("Database not available");

    if (dbUnavailable) {
      return NextResponse.json(
        { success: false, error: "Database not available" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: msg || "Failed to duplicate field" },
      { status: 500 }
    );
  }
}
