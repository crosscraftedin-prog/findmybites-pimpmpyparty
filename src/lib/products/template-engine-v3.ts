/**
 * Template Engine V3 — Admin-Driven Product Information.
 * ─────────────────────────────────────────────────────────────────────────
 * Bridges the existing DB-backed ListingTemplate/TemplateField tables with
 * the Product Information System (V2 section builders).
 *
 * This is the single source of truth for Product Information sections:
 *   1. If a DB template exists for the vendor's category → use its sections.
 *   2. Otherwise → fall back to code-defined ProductTemplate.infoSections.
 *   3. Otherwise → fall back to DEFAULT_INFO_SECTIONS.
 *
 * Admins configure sections + fields in the Admin Panel. Changes take effect
 * immediately — no code deployment needed.
 *
 * DB TemplateField rows are mapped to InfoSection/InfoField at runtime.
 * The DB schema already supports: type, section, sortOrder, required, enabled,
 * placeholder, helpText, condition, staticOptions, filterGroupName, aiEnabled,
 * seoIndexed, searchable, and more.
 */

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  type InfoSection,
  type InfoField,
  type FieldType,
} from "./product-info";

// ── DB field shape (matches TemplateField table) ───────────────────────────

interface DBTemplateField {
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

interface DBTemplateSection {
  name: string;
  icon?: string;
  defaultOpen?: boolean;
  sortOrder?: number;
  step?: number;
  description?: string;
  visiblePublicly?: boolean;
  vendorOnly?: boolean;
  collapsible?: boolean;
  aiEnabled?: boolean;
  seoEnabled?: boolean;
}

// ── Mapping: DB field type → V3 FieldType ──────────────────────────────────

const TYPE_MAP: Record<string, FieldType> = {
  text: "text",
  textarea: "textarea",
  richtext: "richtext",
  number: "text",
  currency: "text",
  price: "text",
  select: "select",
  chips: "checkboxes",
  chips_single: "select",
  toggle: "checkbox",
  toggle_group: "checkbox",
  images: "images",
  gallery: "images",
  section_toggle: "checkbox",
  date: "text",
  time: "text",
  datetime: "text",
  daterange: "text",
  address: "textarea",
  phone: "text",
  email: "text",
  url: "text",
  color: "text",
  tags: "text",
  videourl: "text",
  fileupload: "text",
  pdfupload: "text",
  repeater: "table",
  availability: "text",
  bookingduration: "text",
  radius: "text",
};

function parseJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// ── DB field → V3 InfoField ────────────────────────────────────────────────

function dbFieldToInfoField(f: DBTemplateField): InfoField {
  const type: FieldType = TYPE_MAP[f.type] ?? "text";
  const condition = parseJSON<{ field: string; values: string[] } | null>(f.condition, null);

  const field: InfoField = {
    key: f.key,
    label: f.label,
    type,
    placeholder: f.placeholder || undefined,
    optional: !f.required,
    aiGeneratable: f.aiEnabled,
    vendorOnly: false, // set from section-level if needed
  };

  // Options for select/checkboxes
  if (f.staticOptions) {
    const opts = parseJSON<string[]>(f.staticOptions, []);
    if (opts.length > 0) field.options = opts;
  }

  // Conditional visibility → showWhen
  if (condition) {
    // DB condition: { field, values: ["Cakes", ""] }
    // V3 showWhen: { field, equals: value }
    // For multi-value, use the first non-empty value (most common case)
    if (condition.values && condition.values.length === 1) {
      field.showWhen = { field: condition.field, equals: condition.values[0] };
    } else if (condition.values && condition.values.length > 1) {
      // For multi-value conditions, we use the first value as the "equals" check.
      // This is a simplification — the form component can be enhanced later.
      field.showWhen = { field: condition.field, equals: condition.values[0] };
    }
  }

  // Help text
  if (f.helpText) {
    field.placeholder = f.placeholder || f.helpText;
  }

  // Table columns for repeater type
  if (type === "table" && f.repeatFields) {
    const repeatFields = parseJSON<any[]>(f.repeatFields, []);
    if (repeatFields.length > 0) {
      field.columns = repeatFields.map((rf) => ({
        key: rf.key || rf.name || "",
        label: rf.label || rf.name || "",
        type: (rf.type === "number" ? "number" : "text") as "text" | "number",
      }));
    }
  }

  return field;
}

// ── Group DB fields by section → V3 InfoSection[] ──────────────────────────

function dbFieldsToSections(
  fields: DBTemplateField[],
  sectionMeta: DBTemplateSection[]
): InfoSection[] {
  const sectionMap = new Map<string, InfoField[]>();

  for (const f of fields) {
    if (!f.enabled) continue;
    const list = sectionMap.get(f.section) ?? [];
    list.push(dbFieldToInfoField(f));
    sectionMap.set(f.section, list);
  }

  // Build sections in the order defined by sectionMeta, then by first appearance
  const seenSections = new Set<string>();
  const sections: InfoSection[] = [];

  // First: sections from sectionMeta (admin-defined order)
  for (const meta of sectionMeta) {
    if (seenSections.has(meta.name)) continue;
    const fields = sectionMap.get(meta.name);
    if (!fields || fields.length === 0) continue;
    seenSections.add(meta.name);
    sections.push({
      key: meta.name.toLowerCase().replace(/\s+/g, "-"),
      heading: meta.name,
      icon: meta.icon || "📋",
      fields: fields.sort((a, b) => 0), // sort by sortOrder already done in DB query
    });
  }

  // Then: any sections not in sectionMeta (fields without explicit section meta)
  for (const [sectionName, fields] of sectionMap) {
    if (seenSections.has(sectionName)) continue;
    seenSections.add(sectionName);
    sections.push({
      key: sectionName.toLowerCase().replace(/\s+/g, "-"),
      heading: sectionName,
      icon: "📋",
      fields,
    });
  }

  return sections;
}

// ── Public API: resolve Product Information sections from DB ───────────────

/**
 * Resolve Product Information sections for a vendor's category.
 *
 * Resolution order:
 *   1. DB TemplateMapping (subcategory-specific)
 *   2. DB TemplateMapping (category-level)
 *   3. Code fallback (from product-templates.ts)
 *
 * Returns null if no DB template is found (caller falls back to code).
 */
export async function resolveProductInfoSectionsFromDB(
  category: string | null | undefined,
  subcategory?: string | null
): Promise<InfoSection[] | null> {
  if (!category) return null;

  try {
    // 1. Find the template mapping for this category
    const mapping = await db.templateMapping.findFirst({
      where: {
        OR: [
          { categoryId: category, subcategory: subcategory ?? null },
          { categoryId: category, subcategory: null },
        ],
      },
      orderBy: [{ subcategory: "desc" }], // subcategory match first
      include: {
        template: {
          include: {
            fields: {
              where: { enabled: true },
              orderBy: [{ section: "asc" }, { sortOrder: "asc" }],
            },
          },
        },
      },
    }).catch(() => null);

    if (!mapping?.template?.fields?.length) return null;

    // 2. Parse section metadata from the template
    const sectionMeta = parseJSON<DBTemplateSection[]>(mapping.template.sections, []);

    // 3. Group fields by section
    const sections = dbFieldsToSections(mapping.template.fields, sectionMeta);

    logger.info("template-engine-v3", "Resolved sections from DB", {
      category,
      templateSlug: mapping.template.slug,
      sectionCount: sections.length,
      fieldCount: mapping.template.fields.length,
    });

    return sections;
  } catch (err) {
    logger.warn("template-engine-v3", "DB resolution failed, falling back to code", {
      error: err instanceof Error ? err.message : String(err),
      category,
    });
    return null;
  }
}

/**
 * Resolve Product Information sections for a specific product (by ID).
 * Uses the product's stored templateSlug + templateVersion if available.
 */
export async function resolveProductInfoSectionsForProduct(
  productId: string
): Promise<InfoSection[] | null> {
  try {
    const product = await db.product.findUnique({
      where: { id: productId },
      select: {
        category: true,
        subCategory: true,
        ecosystem: true,
      },
    }).catch(() => null);

    if (!product) return null;

    return resolveProductInfoSectionsFromDB(product.category, product.subCategory);
  } catch {
    return null;
  }
}

/**
 * Get the template's AI config (prompts, temperature, etc.) from DB.
 */
export async function getTemplateAIConfig(
  category: string | null | undefined
): Promise<{
  aiEnabled: boolean;
  aiConfig: Record<string, unknown>;
} | null> {
  if (!category) return null;

  try {
    const mapping = await db.templateMapping.findFirst({
      where: { categoryId: category, subcategory: null },
      include: { template: { select: { aiEnabled: true, aiConfig: true } } },
    }).catch(() => null);

    if (!mapping?.template) return null;

    return {
      aiEnabled: mapping.template.aiEnabled,
      aiConfig: parseJSON(mapping.template.aiConfig, {}),
    };
  } catch {
    return null;
  }
}

/**
 * Get all fields that should be visible to Josh AI (enabled + not vendor-only).
 */
export async function getJoshAIFields(
  category: string | null | undefined
): Promise<string[] | null> {
  if (!category) return null;

  try {
    const mapping = await db.templateMapping.findFirst({
      where: { categoryId: category, subcategory: null },
      include: {
        template: {
          include: {
            fields: {
              where: { enabled: true, aiEnabled: true },
              select: { key: true, label: true, type: true, section: true },
            },
          },
        },
      },
    }).catch(() => null);

    if (!mapping?.template?.fields?.length) return null;

    return mapping.template.fields.map((f) => f.key);
  } catch {
    return null;
  }
}

/**
 * Get all fields that should be indexed for SEO.
 */
export async function getSEOFields(
  category: string | null | undefined
): Promise<string[] | null> {
  if (!category) return null;

  try {
    const mapping = await db.templateMapping.findFirst({
      where: { categoryId: category, subcategory: null },
      include: {
        template: {
          include: {
            fields: {
              where: { enabled: true, seoIndexed: true },
              select: { key: true },
            },
          },
        },
      },
    }).catch(() => null);

    if (!mapping?.template?.fields?.length) return null;

    return mapping.template.fields.map((f) => f.key);
  } catch {
    return null;
  }
}

/**
 * Get all fields that are searchable (for marketplace filtering).
 */
export async function getSearchableFields(
  category: string | null | undefined
): Promise<string[] | null> {
  if (!category) return null;

  try {
    const mapping = await db.templateMapping.findFirst({
      where: { categoryId: category, subcategory: null },
      include: {
        template: {
          include: {
            fields: {
              where: { enabled: true, searchable: true },
              select: { key: true },
            },
          },
        },
      },
    }).catch(() => null);

    if (!mapping?.template?.fields?.length) return null;

    return mapping.template.fields.map((f) => f.key);
  } catch {
    return null;
  }
}

/**
 * Export a template as JSON (for Import/Export feature).
 */
export async function exportTemplate(templateId: string): Promise<Record<string, unknown> | null> {
  try {
    const template = await db.listingTemplate.findUnique({
      where: { id: templateId },
      include: { fields: true },
    }).catch(() => null);

    if (!template) return null;

    return {
      format: "findmybites-template-v3",
      version: 1,
      exportedAt: new Date().toISOString(),
      template: {
        slug: template.slug,
        name: template.name,
        description: template.description,
        ecosystem: template.ecosystem,
        icon: template.icon,
        active: template.active,
        sections: JSON.parse(template.sections || "[]"),
        wizard: JSON.parse(template.wizard || "[]"),
        aiEnabled: template.aiEnabled,
        aiConfig: JSON.parse(template.aiConfig || "{}"),
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
          staticOptions: f.staticOptions ? JSON.parse(f.staticOptions) : null,
          condition: f.condition ? JSON.parse(f.condition) : null,
          subFields: f.subFields ? JSON.parse(f.subFields) : null,
          toggleOptions: f.toggleOptions ? JSON.parse(f.toggleOptions) : null,
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
          repeatFields: f.repeatFields ? JSON.parse(f.repeatFields) : null,
          searchable: f.searchable,
          seoIndexed: f.seoIndexed,
          aiEnabled: f.aiEnabled,
        })),
      },
    };
  } catch {
    return null;
  }
}

/**
 * Import a template from JSON.
 * Creates a new ListingTemplate + TemplateField rows.
 */
export async function importTemplate(json: Record<string, unknown>): Promise<string | null> {
  try {
    const templateData = json.template as any;
    if (!templateData?.slug || !templateData?.name) return null;

    // Create the template
    const template = await db.listingTemplate.create({
      data: {
        slug: `${templateData.slug}-${Date.now().toString(36)}`, // unique slug
        name: templateData.name,
        description: templateData.description || "",
        ecosystem: templateData.ecosystem || "BOTH",
        icon: templateData.icon || null,
        active: templateData.active ?? true,
        sections: JSON.stringify(templateData.sections || []),
        wizard: JSON.stringify(templateData.wizard || []),
        aiEnabled: templateData.aiEnabled ?? false,
        aiConfig: JSON.stringify(templateData.aiConfig || {}),
        version: 1,
        isLatest: true,
      },
    });

    // Create fields
    if (Array.isArray(templateData.fields)) {
      for (let i = 0; i < templateData.fields.length; i++) {
        const f = templateData.fields[i];
        await db.templateField.create({
          data: {
            templateId: template.id,
            key: f.key,
            label: f.label,
            type: f.type || "text",
            section: f.section || "Basic Information",
            sortOrder: f.sortOrder ?? i,
            required: f.required ?? false,
            enabled: f.enabled ?? true,
            placeholder: f.placeholder || null,
            helpText: f.helpText || null,
            unit: f.unit || null,
            span: f.span ?? 1,
            filterGroupName: f.filterGroupName || null,
            staticOptions: f.staticOptions ? JSON.stringify(f.staticOptions) : null,
            condition: f.condition ? JSON.stringify(f.condition) : null,
            subFields: f.subFields ? JSON.stringify(f.subFields) : null,
            toggleOptions: f.toggleOptions ? JSON.stringify(f.toggleOptions) : null,
            maxImages: f.maxImages || null,
            maxFileSize: f.maxFileSize || null,
            minValue: f.minValue || null,
            maxValue: f.maxValue || null,
            step: f.step || null,
            minLength: f.minLength || null,
            maxLength: f.maxLength || null,
            pattern: f.pattern || null,
            patternHint: f.patternHint || null,
            repeatable: f.repeatable ?? false,
            minRepeats: f.minRepeats || null,
            maxRepeats: f.maxRepeats || null,
            repeatLabel: f.repeatLabel || null,
            repeatFields: f.repeatFields ? JSON.stringify(f.repeatFields) : null,
            searchable: f.searchable ?? false,
            seoIndexed: f.seoIndexed ?? false,
            aiEnabled: f.aiEnabled ?? false,
          },
        });
      }
    }

    return template.id;
  } catch (err) {
    logger.error("template-engine-v3", "Import failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
