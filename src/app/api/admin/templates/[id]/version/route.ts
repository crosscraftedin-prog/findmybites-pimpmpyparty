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
 * GET /api/admin/templates/[id]/version — return the template's current
 * version number plus its full version-snapshot history (oldest → newest).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;

    const template = await db.listingTemplate.findUnique({
      where: { id },
      select: { id: true, version: true },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const snapshots = await db.templateVersionSnapshot.findMany({
      where: { templateId: id },
      orderBy: { version: "asc" },
    });

    return NextResponse.json({
      currentVersion: template.version,
      snapshots: snapshots ?? [],
    });
  } catch (error: any) {
    console.error(
      "[admin/templates/[id]/version] GET failed:",
      error?.message
    );
    return NextResponse.json(
      { error: error?.message ?? "Failed to load version info" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/templates/[id]/version — bump the template version.
 *
 * Steps:
 *   1. Read the current template + fields.
 *   2. Persist a TemplateVersionSnapshot capturing the CURRENT state
 *      (version + sections + all field definitions as JSON).
 *   3. Increment the template's version number.
 *   4. Audit-log the bump.
 *
 * Body may include `{ changeNote?: string }` to describe what changed.
 */
export async function POST(
  req: NextRequest,
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

    let changeNote: string | undefined;
    try {
      const body = (await req.json()) as { changeNote?: string };
      changeNote = body?.changeNote;
    } catch {
      // Body is optional / may be empty.
    }

    const template = await db.listingTemplate.findUnique({
      where: { id },
      include: {
        fields: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const currentVersion = template.version ?? 1;
    const newVersion = currentVersion + 1;

    // Build a JSON snapshot of the CURRENT (pre-bump) state.
    const snapshotData = {
      version: currentVersion,
      name: template.name,
      description: template.description,
      ecosystem: template.ecosystem,
      icon: template.icon,
      sections: safeParse(template.sections, []),
      wizard: safeParse(template.wizard, []),
      aiEnabled: template.aiEnabled,
      aiConfig: safeParse(template.aiConfig, {}),
      fields: template.fields.map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        section: f.section,
        sortOrder: f.sortOrder,
        required: f.required,
        enabled: f.enabled,
        placeholder: f.placeholder,
        helpText: f.helpText,
        unit: f.unit,
        span: f.span,
        filterGroupName: f.filterGroupName,
        staticOptions: safeParse(f.staticOptions, null),
        condition: safeParse(f.condition, null),
        subFields: safeParse(f.subFields, null),
        toggleOptions: safeParse(f.toggleOptions, null),
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
        repeatFields: safeParse(f.repeatFields, null),
        searchable: f.searchable,
        seoIndexed: f.seoIndexed,
        aiEnabled: f.aiEnabled,
        globalRef: f.globalRef,
      })),
    };

    const snapshot = await db.templateVersionSnapshot.create({
      data: {
        templateId: id,
        version: currentVersion,
        snapshot: JSON.stringify(snapshotData),
        createdBy: adminEmail,
        changeNote: changeNote ?? null,
      },
    });

    // Increment the template's version number.
    const updated = await db.listingTemplate.update({
      where: { id },
      data: { version: newVersion, isLatest: true },
    });

    await logAudit(
      id,
      "version_bump",
      "template",
      id,
      undefined,
      `Version bumped to ${newVersion}`,
      adminEmail
    );

    return NextResponse.json({
      version: newVersion,
      template: updated,
      snapshot,
    });
  } catch (error: any) {
    console.error(
      "[admin/templates/[id]/version] POST failed:",
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
      { error: msg || "Failed to bump version" },
      { status: 500 }
    );
  }
}

/** Parse a JSON string column; fall back to the default on failure. */
function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
