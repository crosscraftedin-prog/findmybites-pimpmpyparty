import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ALL_TEMPLATES,
  resolveTemplateSlug,
  getTemplateBySlug,
  getGlobalFieldsTemplate,
  type TemplateDef,
  type TemplateFieldDef,
  type TemplateSectionDef,
} from "@/lib/template-definitions";

/**
 * GET /api/templates/resolve?category=bakers-bakery&subcategory=Wedding+Cakes
 *
 * Resolves which template to use for a vendor's category + subcategory.
 *
 * Resolution order:
 *   1. DB TemplateMapping (subcategory-specific) — admin-managed
 *   2. DB TemplateMapping (category-level) — admin-managed
 *   3. Code fallback (template-definitions.ts resolveTemplateSlug)
 *
 * Returns the full template definition with sections + fields, and also
 * fetches filter values from the Universal Filter Engine so the frontend
 * has everything it needs to render the form in one request.
 */

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
  // v2 validation
  minLength: number | null;
  maxLength: number | null;
  pattern: string | null;
  patternHint: string | null;
  // v2 repeater
  repeatable: boolean;
  minRepeats: number | null;
  maxRepeats: number | null;
  repeatLabel: string | null;
  repeatFields: string | null;
  // v2 flags
  searchable: boolean;
  seoIndexed: boolean;
  aiEnabled: boolean;
  globalRef: string | null;
}

function parseJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

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
    condition: parseJSON<{ field: string; values: string[] } | null>(f.condition, null) || undefined,
    subFields: parseJSON<string[] | null>(f.subFields, null) || undefined,
    toggleOptions: parseJSON<string[] | null>(f.toggleOptions, null) || undefined,
    maxImages: f.maxImages || undefined,
    minValue: f.minValue || undefined,
    maxValue: f.maxValue || undefined,
    step: f.step || undefined,
    // v2
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
 * Fetch filter values from the Universal Filter Engine for all filterGroupName
 * references in the template's fields. Returns a map: { [filterGroupName]: string[] }
 */
async function fetchFilterOptions(
  category: string,
  fieldNames: string[]
): Promise<Record<string, string[]>> {
  const result: Record<string, string[]> = {};
  if (fieldNames.length === 0) return result;

  try {
    const categoryFilters = await db.categoryFilter.findMany({
      where: { categoryId: category },
      include: {
        filterGroup: {
          include: {
            values: {
              where: { active: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    for (const cf of categoryFilters) {
      const groupName = cf.filterGroup.name;
      if (fieldNames.includes(groupName)) {
        result[groupName] = cf.filterGroup.values.map((v) => v.value);
      }
    }
  } catch {
    // DB unavailable — return empty (frontend will use staticOptions fallback)
  }

  return result;
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const category = sp.get("category") || "";
    const subcategory = sp.get("subcategory") || undefined;

    if (!category) {
      return NextResponse.json(
        { error: "Category parameter required" },
        { status: 400 }
      );
    }

    let templateDef: TemplateDef | null = null;
    let source: "db" | "code" = "code";
    let dbVersion: number | undefined;

    // ── 1. Try DB resolution (admin-managed mappings + template fields) ──
    try {
      // Subcategory-specific mapping
      let mapping = null;
      if (subcategory) {
        mapping = await db.templateMapping.findFirst({
          where: { categoryId: category, subcategory },
          include: { template: { include: { fields: true } } },
        });
      }
      // Category-level mapping
      if (!mapping) {
        mapping = await db.templateMapping.findFirst({
          where: { categoryId: category, subcategory: null },
          include: { template: { include: { fields: true } } },
        });
      }

      if (mapping && mapping.template && mapping.template.active) {
        const tpl = mapping.template;
        const sections = parseJSON<TemplateSectionDef[]>(tpl.sections, []);
        let fields = tpl.fields
          .filter((f) => f.enabled)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(dbFieldToDef);

        // ── Inheritance: merge parent template fields ──
        if (tpl.parentTemplateId) {
          try {
            const parent = await db.listingTemplate.findUnique({
              where: { id: tpl.parentTemplateId },
              include: { fields: true },
            });
            if (parent) {
              const parentFields = parent.fields
                .filter((f) => f.enabled)
                .map(dbFieldToDef);
              // Merge: parent fields first, child fields override by key
              const childKeys = new Set(fields.map((f) => f.key));
              fields = [
                ...parentFields.filter((f) => !childKeys.has(f.key)),
                ...fields,
              ];
              // Merge sections
              const parentSections = parseJSON<TemplateSectionDef[]>(parent.sections, []);
              const existingSectionNames = new Set(sections.map((s) => s.name));
              for (const ps of parentSections) {
                if (!existingSectionNames.has(ps.name)) {
                  sections.push(ps);
                }
              }
            }
          } catch {
            // parent lookup failed — continue with own fields
          }
        }

        templateDef = {
          slug: tpl.slug,
          name: tpl.name,
          description: tpl.description,
          ecosystem: tpl.ecosystem as TemplateDef["ecosystem"],
          icon: tpl.icon || undefined,
          sections: sections.length > 0 ? sections : [
            { name: "Basic Information", icon: "Package", defaultOpen: true, sortOrder: 0 },
            { name: "Product Details", icon: "Sparkles", defaultOpen: true, sortOrder: 1 },
            { name: "Preparation & Delivery", icon: "Package", defaultOpen: false, sortOrder: 2 },
          ],
          fields,
          version: tpl.version,
          isGlobal: tpl.isGlobal,
          aiEnabled: tpl.aiEnabled,
        };
        dbVersion = tpl.version;
        source = "db";
      }
    } catch {
      // DB unavailable — fall through to code resolution
    }

    // ── 2. Code fallback (template-definitions.ts) ──
    if (!templateDef) {
      const slug = resolveTemplateSlug(category, subcategory);
      if (slug) {
        templateDef = getTemplateBySlug(slug) ?? null;
        if (templateDef) {
          dbVersion = templateDef.version;
        }
      }
    }

    if (!templateDef) {
      return NextResponse.json(
        { error: "No template found for this category" },
        { status: 404 }
      );
    }

    // ── 3. Merge global shared fields ──
    // Global fields (Price, Gallery, Delivery, Contact) are prepended to every
    // template so admins edit them once and they propagate everywhere.
    // If the template already defines a field with the same key, skip the global one.
    if (!templateDef.isGlobal) {
      const globalTemplate = getGlobalFieldsTemplate();
      const existingKeys = new Set(templateDef.fields.map((f) => f.key));
      const globalFieldsToAdd = globalTemplate.fields.filter(
        (f) => !existingKeys.has(f.key)
      );
      if (globalFieldsToAdd.length > 0) {
        // Prepend global sections that don't already exist
        const existingSectionNames = new Set(templateDef.sections.map((s) => s.name));
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

    // ── 4. Fetch filter options from Universal Filter Engine ──
    const filterGroupNames = [
      ...new Set(
        templateDef.fields
          .map((f) => f.filterGroupName)
          .filter((n): n is string => !!n)
      ),
    ];
    const filterOptions = await fetchFilterOptions(category, filterGroupNames);

    return NextResponse.json({
      template: templateDef,
      filterOptions,
      source,
      version: dbVersion ?? 1,
    });
  } catch (err) {
    console.error("[api/templates/resolve] failed:", err);
    return NextResponse.json(
      { error: "Failed to resolve template" },
      { status: 500 }
    );
  }
}
