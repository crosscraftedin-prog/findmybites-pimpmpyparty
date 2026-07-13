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
// (Bun may create separate instances for the same module when imported from different paths)
import {
  type InfoSection,
  type InfoField,
  type FieldType,
} from "./product-info";
import { getCached } from "./template-cache";

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
  filterable: boolean;
  priority: number;
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
  subcategory?: string | null,
  opts?: { bypassCache?: boolean }
): Promise<InfoSection[] | null> {
  if (!category) return null;

  // Use runtime cache — prevents repeated DB queries for the same category
  // bypassCache option is for testing — forces a fresh DB query
  if (opts?.bypassCache) {
    return resolveSectionsFromDBUncached(category, subcategory);
  }

  return getCached<InfoSection[] | null>(
    "sections",
    category,
    subcategory,
    async () => resolveSectionsFromDBUncached(category, subcategory)
  );
}

/**
 * Internal: uncached DB query for sections. Used by the cached wrapper
 * and by tests that need to bypass the cache.
 */
async function resolveSectionsFromDBUncached(
  category: string,
  subcategory?: string | null
): Promise<InfoSection[] | null> {
      try {
        // Query mapping + template separately (avoids Prisma include stale-read issue with SQLite)
        const mapping = await db.templateMapping.findFirst({
          where: {
            OR: [
              { categoryId: category, subcategory: subcategory ?? null },
              { categoryId: category, subcategory: null },
            ],
          },
          orderBy: [{ subcategory: "desc" }],
        }).catch(() => null);

        if (!mapping) return null;

        // Query template separately
        const template = await db.listingTemplate.findUnique({
          where: { id: mapping.templateId },
        }).catch(() => null);

        if (!template) return null;

        // Query fields separately (avoids stale include data)
        const fields = await db.templateField.findMany({
          where: { templateId: template.id, enabled: true },
          orderBy: [{ section: "asc" }, { sortOrder: "asc" }],
        }).catch(() => null);

        const rawResult = await db.$queryRaw`SELECT key, label FROM template_fields WHERE "templateId" = ${template.id} AND enabled = 1`.catch(() => []);


        if (!fields || fields.length === 0) return null;
        // Don't return draft or archived templates' sections publicly
        const status = (template as any).status || "published";
        if (status !== "published") return null;

        const sectionMeta = parseJSON<DBTemplateSection[]>(template.sections, []);
        const sections = dbFieldsToSections(fields, sectionMeta);

        logger.info("template-engine-v3", "Resolved sections from DB (cache miss)", {
          category,
          templateSlug: template.slug,
          sectionCount: sections.length,
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

// ───────────────────────────────────────────────────────────────────────────
// V3 EXPANDED CAPABILITIES
// ───────────────────────────────────────────────────────────────────────────
// The following functions make EVERY consumer of product metadata
// template-driven: Wizard, Product Page, Josh AI, Search, SEO, Filters,
// Compare, and Admin Preview.

// ── 1. Dynamic Wizard Resolver ─────────────────────────────────────────────

export interface WizardStep {
  step: number;
  title: string;
  description?: string;
  icon?: string;
  sections: string[]; // section names
}

/**
 * Resolve wizard steps from the DB template.
 * The template's `wizard` JSON column defines:
 *   [{ step, title, description, sections: ["Basic Information", ...] }]
 *
 * If the template doesn't define a wizard, returns null (caller falls back
 * to the hardcoded STEPS array in product-wizard.tsx).
 *
 * This makes the wizard 100% template-driven — admins can add/remove/reorder
 * steps without code changes.
 */
export async function resolveWizardSteps(
  category: string | null | undefined
): Promise<WizardStep[] | null> {
  if (!category) return null;

  try {
    const mapping = await db.templateMapping.findFirst({
      where: { categoryId: category, subcategory: null },
      include: { template: { select: { wizard: true, status: true } } },
    }).catch(() => null);

    if (!mapping?.template) return null;
    // Don't return draft or archived templates' wizard steps
    const wizStatus = mapping.template.status || "published";
    if (wizStatus !== "published") return null;

    const wizard = parseJSON<WizardStep[]>(mapping.template.wizard, []);
    if (wizard.length === 0) return null;

    return wizard.sort((a, b) => a.step - b.step);
  } catch {
    return null;
  }
}

// ── 2. Josh AI Metadata (not just field keys) ──────────────────────────────

export interface JoshAIFieldMetadata {
  key: string;
  label: string;
  description?: string;
  aiPrompt?: string;
  priority: number;
  visibility: "public" | "vendor-only";
  type: string;
  section: string;
}

/**
 * Get full field metadata for Josh AI — not just field keys.
 * Josh receives: field labels, descriptions, AI prompts, priority, visibility.
 * This lets Josh understand templates automatically without hardcoded mapping.
 */
/**
 * Helper: resolve template + fields using separate queries (avoids Prisma include stale-read issue).
 */
async function resolveTemplateAndFields(
  category: string,
  fieldFilter?: Record<string, boolean>
): Promise<{ template: any; fields: any[] } | null> {
  try {
    const mapping = await db.templateMapping.findFirst({
      where: { categoryId: category, subcategory: null },
    }).catch(() => null);
    if (!mapping) return null;

    const template = await db.listingTemplate.findUnique({
      where: { id: mapping.templateId },
    }).catch(() => null);
    if (!template) return null;

    const where: Record<string, unknown> = { templateId: template.id, enabled: true };
    if (fieldFilter) Object.assign(where, fieldFilter);

    const fields = await db.templateField.findMany({
      where,
      orderBy: [{ priority: "desc" }, { sortOrder: "asc" }],
    }).catch(() => []);
    if (!fields || fields.length === 0) return null;

    return { template, fields };
  } catch {
    return null;
  }
}

export async function getJoshAIFieldMetadata(
  category: string | null | undefined
): Promise<JoshAIFieldMetadata[] | null> {
  if (!category) return null;

  try {
    const result = await resolveTemplateAndFields(category, { aiEnabled: true });
    if (!result) return null;

    const aiConfig = parseJSON<Record<string, any>>(result.template.aiConfig, {});

    return result.fields.map((f) => ({
      key: f.key,
      label: f.label,
      description: f.helpText || f.placeholder || undefined,
      aiPrompt: aiConfig[f.key]?.prompt || aiConfig.descriptionPrompt,
      priority: f.priority,
      visibility: "public" as const,
      type: f.type,
      section: f.section,
    }));
  } catch {
    return null;
  }
}

// ── 3. Searchable Fields (for marketplace search indexing) ─────────────────

export interface SearchableField {
  key: string;
  label: string;
  type: string;
  boost: number; // higher = more relevant in search results
}

/**
 * Get fields that should be indexed for marketplace search.
 * Search automatically indexes any field with `searchable=true`.
 * The `priority` field acts as a search boost factor.
 */
export async function getSearchableFieldMetadata(
  category: string | null | undefined
): Promise<SearchableField[] | null> {
  if (!category) return null;

  try {
    const result = await resolveTemplateAndFields(category, { searchable: true });
    if (!result) return null;

    return result.fields.map((f) => ({
      key: f.key,
      label: f.label,
      type: f.type,
      boost: f.priority,
    }));
  } catch {
    return null;
  }
}

// ── 4. Dynamic SEO Schema Generator ────────────────────────────────────────

export interface SEOFieldMetadata {
  key: string;
  label: string;
  type: string;
  priority: number;
}

/**
 * Get fields flagged `seoIndexed` for dynamic SEO schema generation.
 * The SEO generator builds Product/FAQ/Offer schema from these fields.
 */
export async function getSEOFieldMetadata(
  category: string | null | undefined
): Promise<SEOFieldMetadata[] | null> {
  if (!category) return null;

  try {
    const result = await resolveTemplateAndFields(category, { seoIndexed: true });
    if (!result) return null;

    return result.fields.map((f) => ({
      key: f.key,
      label: f.label,
      type: f.type,
      priority: f.priority,
    }));
  } catch {
    return null;
  }
}

/**
 * Generate JSON-LD Product schema from productInfo + template SEO fields.
 * Automatically includes all fields flagged `seoIndexed`.
 */
export function generateProductSchema(
  product: { name: string; description?: string | null; price: number; currency?: string | null; image?: string | null },
  productInfo: Record<string, unknown>,
  seoFields: SEOFieldMetadata[]
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.image || undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency || "INR",
    },
  };

  // Add additional properties from seoIndexed fields
  const additionalProperties: Record<string, unknown> = {};
  for (const field of seoFields) {
    const value = productInfo[field.key];
    if (value !== undefined && value !== null && value !== "") {
      additionalProperties[field.key] = value;
    }
  }
  if (Object.keys(additionalProperties).length > 0) {
    schema.additionalProperty = Object.entries(additionalProperties).map(([name, value]) => ({
      "@type": "PropertyValue",
      name,
      value,
    }));
  }

  return schema;
}

// ── 5. Dynamic Filter Builder ──────────────────────────────────────────────

export interface FilterFacet {
  key: string;
  label: string;
  type: string; // select, chips, toggle, etc.
  options?: string[];
  filterGroupName?: string;
}

/**
 * Get filter facets from the template.
 * Any field with `filterable=true` becomes a marketplace filter facet.
 * Options come from staticOptions or the Universal Filter Engine (filterGroupName).
 */
export async function getFilterFacets(
  category: string | null | undefined
): Promise<FilterFacet[] | null> {
  if (!category) return null;

  try {
    const result = await resolveTemplateAndFields(category, { filterable: true });
    if (!result) return null;

    return result.fields.map((f) => ({
      key: f.key,
      label: f.label,
      type: f.type,
      options: f.staticOptions ? parseJSON<string[]>(f.staticOptions, []) : undefined,
      filterGroupName: f.filterGroupName || undefined,
    }));
  } catch {
    return null;
  }
}

// ── 6. Compare Products ────────────────────────────────────────────────────

export interface CompareResult {
  field: { key: string; label: string; type: string };
  productA: { value: unknown; productName: string };
  productB: { value: unknown; productName: string };
}

/**
 * Compare two products by their template fields.
 * Automatically compares every field defined in the template.
 */
export async function compareProducts(
  productIdA: string,
  productIdB: string
): Promise<CompareResult[] | null> {
  try {
    const [productA, productB] = await Promise.all([
      db.product.findUnique({
        where: { id: productIdA },
        select: { id: true, name: true, category: true, extraFields: true, price: true, currency: true },
      }).catch(() => null),
      db.product.findUnique({
        where: { id: productIdB },
        select: { id: true, name: true, category: true, extraFields: true, price: true, currency: true },
      }).catch(() => null),
    ]);

    if (!productA || !productB) return null;

    // Get template fields for the category
    const category = productA.category || undefined;
    const mapping = await db.templateMapping.findFirst({
      where: { categoryId: category, subcategory: null },
      include: {
        template: {
          include: {
            fields: {
              where: { enabled: true },
              select: { key: true, label: true, type: true, sortOrder: true },
              orderBy: [{ sortOrder: "asc" }],
            },
          },
        },
      },
    }).catch(() => null);

    if (!mapping?.template?.fields?.length) return null;

    // Extract productInfo from extraFields
    const { extractFromExtraFields } = await import("./product-info");
    const infoA = extractFromExtraFields(productA.extraFields);
    const infoB = extractFromExtraFields(productB.extraFields);

    // Build comparison rows
    const results: CompareResult[] = mapping.template.fields.map((f) => ({
      field: { key: f.key, label: f.label, type: f.type },
      productA: { value: (infoA as any)[f.key] ?? null, productName: productA.name },
      productB: { value: (infoB as any)[f.key] ?? null, productName: productB.name },
    }));

    // Add price as the first comparison row
    results.unshift({
      field: { key: "price", label: "Price", type: "currency" },
      productA: { value: `${productA.currency || "₹"}${productA.price}`, productName: productA.name },
      productB: { value: `${productB.currency || "₹"}${productB.price}`, productName: productB.name },
    });

    return results;
  } catch (err) {
    logger.error("template-engine-v3", "compareProducts failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

// ── 7. Admin Preview ───────────────────────────────────────────────────────

export interface TemplatePreview {
  template: {
    id: string;
    slug: string;
    name: string;
    description: string;
    icon: string | null;
    status: string;
    version: number;
  };
  wizardSteps: WizardStep[];
  sections: InfoSection[];
  filterFacets: FilterFacet[];
  seoFields: SEOFieldMetadata[];
  aiFields: JoshAIFieldMetadata[];
  searchableFields: SearchableField[];
}

/**
 * Get a complete preview of a template for the Admin Preview panel.
 * Admins can see exactly how the template will render (wizard, product page,
 * filters, SEO, AI) without publishing.
 *
 * Works with draft templates — `status: "draft"` templates are returned here
 * but NOT by resolveProductInfoSectionsFromDB (which only returns published).
 */
export async function getTemplatePreview(
  templateId: string
): Promise<TemplatePreview | null> {
  try {
    const template = await db.listingTemplate.findUnique({
      where: { id: templateId },
      include: {
        fields: {
          where: { enabled: true },
          orderBy: [{ section: "asc" }, { sortOrder: "asc" }],
        },
      },
    }).catch(() => null);

    if (!template) return null;

    const sectionMeta = parseJSON<DBTemplateSection[]>(template.sections, []);
    const sections = dbFieldsToSections(template.fields, sectionMeta);
    const wizardSteps = parseJSON<WizardStep[]>(template.wizard, []).sort((a, b) => a.step - b.step);

    // Build filter facets from filterable fields
    const filterFacets: FilterFacet[] = template.fields
      .filter((f) => (f as any).filterable)
      .map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        options: f.staticOptions ? parseJSON<string[]>(f.staticOptions, []) : undefined,
        filterGroupName: f.filterGroupName || undefined,
      }));

    // Build SEO fields
    const seoFields: SEOFieldMetadata[] = template.fields
      .filter((f) => f.seoIndexed)
      .map((f) => ({ key: f.key, label: f.label, type: f.type, priority: (f as any).priority || 0 }))
      .sort((a, b) => b.priority - a.priority);

    // Build AI fields
    const aiConfig = parseJSON<Record<string, any>>(template.aiConfig, {});
    const aiFields: JoshAIFieldMetadata[] = template.fields
      .filter((f) => f.aiEnabled)
      .map((f) => ({
        key: f.key,
        label: f.label,
        description: f.helpText || f.placeholder || undefined,
        aiPrompt: aiConfig[f.key]?.prompt || aiConfig.descriptionPrompt,
        priority: (f as any).priority || 0,
        visibility: "public" as const,
        type: f.type,
        section: f.section,
      }))
      .sort((a, b) => b.priority - a.priority);

    // Build searchable fields
    const searchableFields: SearchableField[] = template.fields
      .filter((f) => f.searchable)
      .map((f) => ({ key: f.key, label: f.label, type: f.type, boost: (f as any).priority || 0 }));

    return {
      template: {
        id: template.id,
        slug: template.slug,
        name: template.name,
        description: template.description,
        icon: template.icon,
        status: (template as any).status || "published",
        version: template.version,
      },
      wizardSteps,
      sections,
      filterFacets,
      seoFields,
      aiFields,
      searchableFields,
    };
  } catch (err) {
    logger.error("template-engine-v3", "getTemplatePreview failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

// ── 8. Template Status Management ──────────────────────────────────────────

/**
 * Update a template's status (draft → published → archived).
 * Draft templates are not shown to vendors.
 * Archived templates keep working for existing products but can't be selected for new ones.
 */
export async function updateTemplateStatus(
  templateId: string,
  status: "draft" | "published" | "archived"
): Promise<boolean> {
  try {
    await db.listingTemplate.update({
      where: { id: templateId },
      data: { status },
    });
    // Invalidate the cache so the new status takes effect immediately
    const { invalidateAllTemplateCaches } = await import("./template-cache");
    invalidateAllTemplateCaches();
    return true;
  } catch (err) {
    logger.error("template-engine-v3", "updateTemplateStatus failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/**
 * Get all templates by status (for admin dashboard).
 */
export async function getTemplatesByStatus(
  status?: "draft" | "published" | "archived"
): Promise<Array<{ id: string; name: string; slug: string; status: string; version: number; ecosystem: string }>> {
  try {
    const where = status ? { status } : {};
    const templates = await db.listingTemplate.findMany({
      where,
      select: { id: true, name: true, slug: true, status: true, version: true, ecosystem: true },
      orderBy: { updatedAt: "desc" },
    }).catch(() => []);
    return templates.map((t: any) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      status: t.status || "published",
      version: t.version,
      ecosystem: t.ecosystem,
    }));
  } catch {
    return [];
  }
}
