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
 * POST /api/admin/templates/[id]/duplicate — create a standalone copy of a
 * template (with all its fields). The duplicate gets:
 *   - slug = `{original-slug}-copy-{timestamp}`
 *   - name = `{name} (Copy)`
 *   - parentTemplateId = null (independent copy, not a child)
 *   - isGlobal = false (copies are never global)
 *   - version = 1, isLatest = true (fresh versioning history)
 *   - same ecosystem, icon, sections, aiEnabled, aiConfig, wizard
 *
 * All fields are copied with new IDs. An audit log entry records the source.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params;

    const source = await db.listingTemplate.findUnique({
      where: { id },
      include: {
        fields: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!source) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const timestamp = Date.now();
    const newSlug = `${source.slug}-copy-${timestamp}`;
    const newName = `${source.name} (Copy)`;

    const created = await db.listingTemplate.create({
      data: {
        slug: newSlug,
        name: newName,
        description: source.description,
        ecosystem: source.ecosystem,
        icon: source.icon,
        active: source.active,
        sections: source.sections,
        version: 1,
        isLatest: true,
        parentTemplateId: null,
        isGlobal: false,
        wizard: source.wizard,
        aiEnabled: source.aiEnabled,
        aiConfig: source.aiConfig,
        fields: {
          create: source.fields.map((f, i) => ({
            key: f.key,
            label: f.label,
            type: f.type,
            section: f.section,
            sortOrder: f.sortOrder ?? i,
            required: f.required,
            enabled: f.enabled,
            placeholder: f.placeholder,
            helpText: f.helpText,
            unit: f.unit,
            span: f.span,
            filterGroupName: f.filterGroupName,
            staticOptions: f.staticOptions,
            condition: f.condition,
            subFields: f.subFields,
            toggleOptions: f.toggleOptions,
            maxImages: f.maxImages,
            maxFileSize: f.maxFileSize,
            minValue: f.minValue,
            maxValue: f.maxValue,
            step: f.step,
            minLength: f.minLength,
            maxLength: f.maxLength,
            pattern: f.pattern,
            patternHint: f.patternHint,
            repeatable: f.repeatable,
            minRepeats: f.minRepeats,
            maxRepeats: f.maxRepeats,
            repeatLabel: f.repeatLabel,
            repeatFields: f.repeatFields,
            searchable: f.searchable,
            seoIndexed: f.seoIndexed,
            aiEnabled: f.aiEnabled,
            globalRef: f.globalRef,
          })),
        },
      },
      include: {
        fields: { orderBy: { sortOrder: "asc" } },
      },
    });

    await logAudit(
      created.id,
      "duplicate",
      "template",
      created.id,
      undefined,
      `Duplicated from ${source.slug}`,
      adminEmail
    );

    return NextResponse.json({ template: created }, { status: 201 });
  } catch (error: any) {
    console.error(
      "[admin/templates/[id]/duplicate] POST failed:",
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
      { error: msg || "Failed to duplicate template" },
      { status: 500 }
    );
  }
}
