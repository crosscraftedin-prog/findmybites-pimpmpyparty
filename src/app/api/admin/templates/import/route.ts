import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Audit-log helper. Best-effort: failures are swallowed.
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

function toJsonStr(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

// ── Input shapes (mirror the export schema) ─────────────────────────────────
interface ImportField {
  key?: string;
  label?: string;
  type?: string;
  section?: string;
  sortOrder?: number;
  required?: boolean;
  enabled?: boolean;
  placeholder?: string | null;
  helpText?: string | null;
  unit?: string | null;
  span?: number;
  filterGroupName?: string | null;
  staticOptions?: string[] | null;
  condition?: { field: string; values: string[] } | null;
  subFields?: string[] | null;
  toggleOptions?: string[] | null;
  maxImages?: number | null;
  maxFileSize?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
  step?: number | null;
  minLength?: number | null;
  maxLength?: number | null;
  pattern?: string | null;
  patternHint?: string | null;
  repeatable?: boolean;
  minRepeats?: number | null;
  maxRepeats?: number | null;
  repeatLabel?: string | null;
  repeatFields?: string | null;
  searchable?: boolean;
  seoIndexed?: boolean;
  aiEnabled?: boolean;
  globalRef?: string | null;
}

interface ImportTemplate {
  slug?: string;
  name?: string;
  description?: string;
  ecosystem?: string;
  icon?: string | null;
  active?: boolean;
  sections?: unknown[];
  version?: number;
  isGlobal?: boolean;
  wizard?: unknown[];
  aiEnabled?: boolean;
  aiConfig?: unknown;
  fields?: ImportField[];
  mappings?: { categoryId?: string; subcategory?: string | null }[];
}

interface ImportMapping {
  categoryId?: string;
  subcategory?: string | null;
  templateSlug?: string;
}

interface ImportBody {
  templates?: ImportTemplate[];
  mappings?: ImportMapping[];
  overwrite?: boolean;
}

/**
 * POST /api/admin/templates/import — import templates + mappings from a JSON
 * payload (the same shape produced by /export).
 *
 * Body: { templates: [...], mappings: [...], overwrite?: boolean }
 *
 * Flow:
 *   1. For each template: upsert by slug → resolve templateId.
 *      - New template: CREATE + all its fields.
 *      - Existing template: UPDATE metadata. Fields are upserted by
 *        (templateId, key). When `overwrite: true` is passed, fields that
 *        exist in the DB but not in the payload are DELETED (clean replace).
 *   2. For each mapping: upsert by [categoryId, subcategory], resolving
 *      templateId via the slug → id map.
 *   3. Audit-log: action="import" per template.
 *
 * Returns: { imported: N, updated: N, mappings: N }
 *
 * If the DB is unavailable, returns 500 with
 * `{ success: false, error: "Database not available" }`.
 */
export async function POST(req: NextRequest) {
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

  let body: ImportBody;
  try {
    body = (await req.json()) as ImportBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body || !Array.isArray(body.templates)) {
    return NextResponse.json(
      { error: "templates (array) is required" },
      { status: 400 }
    );
  }

  let importedCount = 0;
  let updatedCount = 0;
  let mappingCount = 0;
  const slugToId = new Map<string, string>();

  try {
    // ── 1. Upsert templates + fields ─────────────────────────────────────
    for (const t of body.templates) {
      if (!t.slug || !t.name) {
        // Skip invalid template entries — don't fail the whole import.
        continue;
      }

      const sectionsStr = Array.isArray(t.sections)
        ? JSON.stringify(t.sections)
        : "[]";
      const wizardStr = Array.isArray(t.wizard)
        ? JSON.stringify(t.wizard)
        : "[]";
      const aiConfigStr = t.aiConfig ? JSON.stringify(t.aiConfig) : "{}";

      // Check if a template with this slug already exists.
      const existing = await db.listingTemplate.findUnique({
        where: { slug: t.slug },
        include: { fields: { select: { id: true, key: true } } },
      });

      let templateId: string;
      const isUpdate = !!existing;

      if (isUpdate) {
        templateId = existing!.id;
        await db.listingTemplate.update({
          where: { id: templateId },
          data: {
            name: t.name,
            description: t.description ?? "",
            ecosystem: t.ecosystem ?? "BOTH",
            icon: t.icon ?? null,
            active: t.active ?? true,
            sections: sectionsStr,
            wizard: wizardStr,
            aiEnabled: t.aiEnabled ?? false,
            aiConfig: aiConfigStr,
            isGlobal: t.isGlobal ?? false,
            ...(typeof t.version === "number" ? { version: t.version } : {}),
          },
        });
        updatedCount += 1;
      } else {
        const created = await db.listingTemplate.create({
          data: {
            slug: t.slug,
            name: t.name,
            description: t.description ?? "",
            ecosystem: t.ecosystem ?? "BOTH",
            icon: t.icon ?? null,
            active: t.active ?? true,
            sections: sectionsStr,
            wizard: wizardStr,
            aiEnabled: t.aiEnabled ?? false,
            aiConfig: aiConfigStr,
            isGlobal: t.isGlobal ?? false,
            version: typeof t.version === "number" ? t.version : 1,
            isLatest: true,
          },
        });
        templateId = created.id;
        importedCount += 1;
      }

      slugToId.set(t.slug, templateId);

      // ── Upsert fields by (templateId, key) ────────────────────────────
      const payloadFields = (t.fields ?? []).filter(
        (f) => f.key && f.label && f.type && f.section
      );

      // Build a quick lookup of existing fields by key (if updating).
      const existingByKey = new Map<string, string>();
      if (isUpdate && Array.isArray(existing!.fields)) {
        for (const f of existing!.fields) {
          existingByKey.set(f.key, f.id);
        }
      }

      for (let i = 0; i < payloadFields.length; i++) {
        const f = payloadFields[i];
        const data = {
          templateId,
          key: f.key!,
          label: f.label!,
          type: f.type!,
          section: f.section!,
          sortOrder: f.sortOrder ?? i,
          required: f.required ?? false,
          enabled: f.enabled ?? true,
          placeholder: f.placeholder ?? null,
          helpText: f.helpText ?? null,
          unit: f.unit ?? null,
          span: f.span ?? 1,
          filterGroupName: f.filterGroupName ?? null,
          staticOptions: toJsonStr(f.staticOptions),
          condition: toJsonStr(f.condition),
          subFields: toJsonStr(f.subFields),
          toggleOptions: toJsonStr(f.toggleOptions),
          maxImages: f.maxImages ?? null,
          maxFileSize: f.maxFileSize ?? null,
          minValue: f.minValue ?? null,
          maxValue: f.maxValue ?? null,
          step: f.step ?? null,
          minLength: f.minLength ?? null,
          maxLength: f.maxLength ?? null,
          pattern: f.pattern ?? null,
          patternHint: f.patternHint ?? null,
          repeatable: f.repeatable ?? false,
          minRepeats: f.minRepeats ?? null,
          maxRepeats: f.maxRepeats ?? null,
          repeatLabel: f.repeatLabel ?? null,
          repeatFields: toJsonStr(f.repeatFields),
          searchable: f.searchable ?? false,
          seoIndexed: f.seoIndexed ?? false,
          aiEnabled: f.aiEnabled ?? false,
          globalRef: f.globalRef ?? null,
        };

        const existingId = existingByKey.get(f.key!);
        if (existingId) {
          await db.templateField.update({
            where: { id: existingId },
            data,
          });
        } else {
          await db.templateField.create({ data });
        }
      }

      // ── overwrite=true: delete fields in DB that aren't in the payload ─
      if (isUpdate && body.overwrite === true) {
        const payloadKeys = new Set(payloadFields.map((f) => f.key!));
        const staleIds = (existing!.fields ?? [])
          .filter((f) => !payloadKeys.has(f.key))
          .map((f) => f.id);
        if (staleIds.length > 0) {
          await db.templateField.deleteMany({
            where: { id: { in: staleIds } },
          });
        }
      }

      await logAudit(
        templateId,
        "import",
        "template",
        templateId,
        undefined,
        isUpdate
          ? `Imported (updated) template ${t.slug}`
          : `Imported (created) template ${t.slug}`,
        adminEmail
      );
    }

    // ── 2. Upsert mappings (top-level + per-template) ─────────────────────
    // Collect mapping entries from both the top-level `mappings` array and
    // each template's embedded `mappings` list (resolving slug → templateId).
    const allMappings: {
      categoryId: string;
      subcategory: string | null;
      templateSlug: string;
    }[] = [];

    if (Array.isArray(body.mappings)) {
      for (const m of body.mappings) {
        if (m.categoryId && m.templateSlug) {
          allMappings.push({
            categoryId: m.categoryId,
            subcategory:
              m.subcategory && String(m.subcategory).trim() !== ""
                ? String(m.subcategory)
                : null,
            templateSlug: m.templateSlug,
          });
        }
      }
    }

    // Also pull per-template embedded mappings.
    for (const t of body.templates) {
      if (!t.slug || !Array.isArray(t.mappings)) continue;
      for (const m of t.mappings) {
        if (m.categoryId) {
          allMappings.push({
            categoryId: m.categoryId,
            subcategory:
              m.subcategory && String(m.subcategory).trim() !== ""
                ? String(m.subcategory)
                : null,
            templateSlug: t.slug,
          });
        }
      }
    }

    // De-duplicate (categoryId, subcategory) — last write wins.
    const deduped = new Map<string, (typeof allMappings)[number]>();
    for (const m of allMappings) {
      const k = `${m.categoryId}::${m.subcategory ?? ""}`;
      deduped.set(k, m);
    }

    for (const m of deduped.values()) {
      const templateId = slugToId.get(m.templateSlug);
      if (!templateId) continue;

      // Prisma's compound-unique `where` is typed as `string` for nullable
      // columns even though it accepts `null` at runtime (matches via
      // `IS NOT DISTINCT FROM`). Cast to satisfy the type checker.
      await db.templateMapping.upsert({
        where: {
          categoryId_subcategory: {
            categoryId: m.categoryId,
            subcategory: (m.subcategory ?? null) as unknown as string,
          },
        },
        create: {
          categoryId: m.categoryId,
          subcategory: m.subcategory ?? null,
          templateId,
        },
        update: {
          templateId,
        },
      });
      mappingCount += 1;
    }

    return NextResponse.json({
      success: true,
      imported: importedCount,
      updated: updatedCount,
      mappings: mappingCount,
    });
  } catch (error: any) {
    console.error("[admin/templates/import] POST failed:", error?.message);

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
      { success: false, error: msg || "Import failed" },
      { status: 500 }
    );
  }
}
