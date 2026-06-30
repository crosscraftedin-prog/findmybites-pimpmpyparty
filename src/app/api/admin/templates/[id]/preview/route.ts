import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import {
  ALL_TEMPLATES,
  getGlobalFieldsTemplate,
  type TemplateDef,
  type TemplateFieldDef,
  type TemplateSectionDef,
} from "@/lib/template-definitions";

/** Parse a JSON string column; fall back to the default on failure. */
function parseJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

interface DBField {
  id: string;
  key: string;
  label: string;
  type: string;
  section: string;
  sortOrder: number;
  required: boolean;
  enabled: boolean;
  placeholder: string | null;
  helpText: string | null;
  unit: string | null;
  span: number;
  filterGroupName: string | null;
  staticOptions: string | null;
  condition: string | null;
  subFields: string | null;
  toggleOptions: string | null;
  maxImages: number | null;
  maxFileSize: number | null;
  minValue: number | null;
  maxValue: number | null;
  step: number | null;
  minLength: number | null;
  maxLength: number | null;
  pattern: string | null;
  patternHint: string | null;
  repeatable: boolean;
  minRepeats: number | null;
  maxRepeats: number | null;
  repeatLabel: string | null;
  repeatFields: string | null;
  searchable: boolean;
  seoIndexed: boolean;
  aiEnabled: boolean;
  globalRef: string | null;
}

/** Convert a DB field row into a TemplateFieldDef (parsing all JSON columns). */
function dbFieldToDef(f: DBField): TemplateFieldDef {
  return {
    key: f.key,
    label: f.label,
    type: f.type as TemplateFieldDef["type"],
    section: f.section,
    sortOrder: f.sortOrder,
    required: f.required,
    enabled: f.enabled,
    placeholder: f.placeholder || undefined,
    helpText: f.helpText || undefined,
    unit: f.unit || undefined,
    span: (f.span === 2 ? 2 : 1) as 1 | 2,
    filterGroupName: f.filterGroupName || undefined,
    staticOptions: parseJSON<string[]>(f.staticOptions, []),
    condition:
      parseJSON<{ field: string; values: string[] } | null>(f.condition, null) ||
      undefined,
    subFields: parseJSON<string[] | null>(f.subFields, null) || undefined,
    toggleOptions: parseJSON<string[] | null>(f.toggleOptions, null) || undefined,
    maxImages: f.maxImages || undefined,
    minValue: f.minValue || undefined,
    maxValue: f.maxValue || undefined,
    step: f.step || undefined,
    maxFileSize: f.maxFileSize || undefined,
    minLength: f.minLength || undefined,
    maxLength: f.maxLength || undefined,
    pattern: f.pattern || undefined,
    patternHint: f.patternHint || undefined,
    repeatable: f.repeatable || undefined,
    minRepeats: f.minRepeats || undefined,
    maxRepeats: f.maxRepeats || undefined,
    repeatLabel: f.repeatLabel || undefined,
    repeatFields: f.repeatFields || undefined,
    searchable: f.searchable || undefined,
    seoIndexed: f.seoIndexed || undefined,
    aiEnabled: f.aiEnabled || undefined,
    globalRef: f.globalRef || undefined,
  };
}

/**
 * Fetch ALL filter groups + their active values and return a
 * `{ [filterGroupName]: string[] }` map. Used by the admin "Preview" view so
 * the preview form has filter options for every filterGroupName reference,
 * regardless of category.
 */
async function fetchAllFilterOptions(): Promise<Record<string, string[]>> {
  const result: Record<string, string[]> = {};
  try {
    const groups = await db.filterGroup.findMany({
      include: {
        values: {
          where: { active: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (Array.isArray(groups)) {
      for (const g of groups) {
        result[g.name] = (g.values ?? []).map((v) => v.value);
      }
    }
  } catch {
    // DB unavailable — return empty map (frontend will use staticOptions).
  }
  return result;
}

/**
 * GET /api/admin/templates/[id]/preview — return a template in the same
 * canonical shape as `/api/templates/resolve`, plus a `filterOptions` map
 * covering every active FilterGroup in the Universal Filter Engine.
 *
 * Resolution order:
 *   1. DB ListingTemplate by id (with fields)
 *   2. ALL_TEMPLATES fallback by slug (when `id` is actually a slug — this
 *      happens when the admin UI is in the seed-fallback state where slugs
 *      are used as IDs)
 *
 * The returned template has global shared fields prepended (so the preview
 * matches exactly what a vendor would see via /resolve).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;

    let templateDef: TemplateDef | null = null;
    let source: "db" | "code" = "code";

    // ── 1. Try DB lookup by id ──
    try {
      const tpl = await db.listingTemplate.findUnique({
        where: { id },
        include: { fields: { orderBy: { sortOrder: "asc" } } },
      });

      if (tpl) {
        const sections = parseJSON<TemplateSectionDef[]>(tpl.sections, []);
        const fields = (tpl.fields ?? [])
          .filter((f) => f.enabled)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(dbFieldToDef);

        templateDef = {
          slug: tpl.slug,
          name: tpl.name,
          description: tpl.description,
          ecosystem: tpl.ecosystem as TemplateDef["ecosystem"],
          icon: tpl.icon || undefined,
          sections:
            sections.length > 0
              ? sections
              : [
                  {
                    name: "Basic Information",
                    icon: "Package",
                    defaultOpen: true,
                    sortOrder: 0,
                  },
                  {
                    name: "Product Details",
                    icon: "Sparkles",
                    defaultOpen: true,
                    sortOrder: 1,
                  },
                ],
          fields,
          version: tpl.version,
          isGlobal: tpl.isGlobal,
          aiEnabled: tpl.aiEnabled,
        };
        source = "db";
      }
    } catch {
      // fall through to code fallback
    }

    // ── 2. Fallback: treat `id` as a slug and look it up in ALL_TEMPLATES ──
    if (!templateDef) {
      const fromCode = ALL_TEMPLATES.find((t) => t.slug === id);
      if (fromCode) {
        templateDef = { ...fromCode };
        source = "code";
      }
    }

    if (!templateDef) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // ── 3. Merge global shared fields (so the preview matches /resolve) ──
    if (!templateDef.isGlobal) {
      const globalTemplate = getGlobalFieldsTemplate();
      const existingKeys = new Set(templateDef.fields.map((f) => f.key));
      const globalFieldsToAdd = globalTemplate.fields.filter(
        (f) => !existingKeys.has(f.key)
      );
      if (globalFieldsToAdd.length > 0) {
        const existingSectionNames = new Set(
          templateDef.sections.map((s) => s.name)
        );
        const globalSectionsToAdd = globalTemplate.sections.filter(
          (s) => !existingSectionNames.has(s.name)
        );
        templateDef = {
          ...templateDef,
          sections: [...globalSectionsToAdd, ...templateDef.sections],
          fields: [...globalFieldsToAdd, ...templateDef.fields],
        };
      }
    }

    // ── 4. Fetch ALL filter group options (preview is not category-specific) ──
    const filterOptions = await fetchAllFilterOptions();

    return NextResponse.json({
      template: templateDef,
      filterOptions,
      source,
      version: templateDef.version ?? 1,
    });
  } catch (error: any) {
    console.error(
      "[admin/templates/[id]/preview] GET failed:",
      error?.message
    );
    return NextResponse.json(
      { error: error?.message ?? "Failed to load preview" },
      { status: 500 }
    );
  }
}
