import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { ALL_TEMPLATES } from "@/lib/template-definitions";

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
 * GET /api/admin/templates/export — export ALL templates (metadata + fields +
 * mappings) as a downloadable JSON document.
 *
 * The export schema is:
 *   {
 *     version: "2.0",
 *     exportedAt: ISO timestamp,
 *     templates: [{ slug, name, ..., fields: [...], mappings: [...] }],
 *     mappings:  [{ categoryId, subcategory, templateSlug }]
 *   }
 *
 * Field JSON columns (staticOptions, condition, subFields, toggleOptions,
 * repeatFields, aiConfig, sections, wizard) are parsed back to objects/arrays
 * so the export is human-readable and directly re-importable.
 *
 * If the DB is unavailable/empty, the export falls back to the canonical
 * ALL_TEMPLATES definitions from `template-definitions.ts` (metadata + fields,
 * no mappings). This makes the export endpoint useful even before the first
 * DB seed.
 *
 * Read-only — no audit-log entry is written.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    let dbTemplates: any[] = [];
    try {
      dbTemplates = await db.listingTemplate.findMany({
        include: {
          fields: { orderBy: { sortOrder: "asc" } },
          mappings: true,
        },
        orderBy: { name: "asc" },
        take: 100,
      });
    } catch {}

    const exportedAt = new Date().toISOString();

    if (dbTemplates && dbTemplates.length > 0) {
      // Project DB rows into a clean, JSON-native export shape.
      const templates = dbTemplates.map((t) => ({
        slug: t.slug,
        name: t.name,
        description: t.description,
        ecosystem: t.ecosystem,
        icon: t.icon,
        active: t.active,
        sections: safeParse(t.sections, []),
        version: t.version,
        isLatest: t.isLatest,
        parentTemplateSlug: null, // DB stores parentTemplateId only; slug is not
        // trivially resolvable here without a join. Left null for now.
        isGlobal: t.isGlobal,
        wizard: safeParse(t.wizard, []),
        aiEnabled: t.aiEnabled,
        aiConfig: safeParse(t.aiConfig, {}),
        fields: (t.fields ?? []).map((f: any) => ({
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
          staticOptions: safeParse<string[] | null>(f.staticOptions, null),
          condition: safeParse(f.condition, null),
          subFields: safeParse<string[] | null>(f.subFields, null),
          toggleOptions: safeParse<string[] | null>(f.toggleOptions, null),
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
        mappings: (t.mappings ?? []).map((m: any) => ({
          categoryId: m.categoryId,
          subcategory: m.subcategory ?? null,
        })),
      }));

      // Top-level mappings list (denormalized with templateSlug for re-import).
      const allMappings = dbTemplates.flatMap((t) =>
        (t.mappings ?? []).map((m: any) => ({
          categoryId: m.categoryId,
          subcategory: m.subcategory ?? null,
          templateSlug: t.slug,
        }))
      );

      const payload = {
        version: "2.0",
        exportedAt,
        templates,
        mappings: allMappings,
      };

      return new NextResponse(JSON.stringify(payload, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="templates-export-${new Date()
            .toISOString()
            .slice(0, 10)}.json"`,
        },
      });
    }

    // Fallback: project ALL_TEMPLATES (no DB mappings) so the export is still
    // useful in a fresh sandbox / pre-seed environment.
    const fallbackTemplates = ALL_TEMPLATES.map((t) => ({
      slug: t.slug,
      name: t.name,
      description: t.description,
      ecosystem: t.ecosystem,
      icon: t.icon ?? null,
      active: true,
      sections: t.sections,
      version: t.version ?? 1,
      isLatest: true,
      parentTemplateSlug: t.parentTemplateSlug ?? null,
      isGlobal: t.isGlobal ?? false,
      wizard: [],
      aiEnabled: t.aiEnabled ?? false,
      aiConfig: {},
      fields: t.fields.map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        section: f.section,
        sortOrder: f.sortOrder,
        required: f.required ?? false,
        enabled: f.enabled ?? true,
        placeholder: f.placeholder ?? null,
        helpText: f.helpText ?? null,
        unit: f.unit ?? null,
        span: f.span ?? 1,
        filterGroupName: f.filterGroupName ?? null,
        staticOptions: f.staticOptions ?? null,
        condition: f.condition ?? null,
        subFields: f.subFields ?? null,
        toggleOptions: f.toggleOptions ?? null,
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
        repeatFields: f.repeatFields ?? null,
        searchable: f.searchable ?? false,
        seoIndexed: f.seoIndexed ?? false,
        aiEnabled: f.aiEnabled ?? false,
        globalRef: f.globalRef ?? null,
      })),
      mappings: [],
    }));

    const payload = {
      version: "2.0",
      exportedAt,
      templates: fallbackTemplates,
      mappings: [],
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="templates-export-${new Date()
          .toISOString()
          .slice(0, 10)}.json"`,
      },
    });
  } catch (error: any) {
    console.error("[admin/templates/export] GET failed:", error?.message);
    return NextResponse.json(
      { error: error?.message ?? "Failed to export templates" },
      { status: 500 }
    );
  }
}
