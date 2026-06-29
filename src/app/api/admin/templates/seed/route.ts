import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import {
  ALL_TEMPLATES,
  TEMPLATE_MAPPINGS,
  type TemplateFieldDef,
} from "@/lib/template-definitions";

/**
 * POST /api/admin/templates/seed — sync the canonical template definitions
 * from `template-definitions.ts` into the database. Idempotent: re-running
 * just upserts the latest definitions.
 *
 * Flow:
 *   1. Upsert each template (by slug) → collect slug → templateId map.
 *   2. For each template: delete existing fields, then re-create from the def
 *      (arrays/objects JSON-stringified for storage).
 *   3. For each mapping in TEMPLATE_MAPPINGS: upsert by [categoryId, subcategory],
 *      resolving the templateId via the slug map.
 *   4. Return counts: { success, templates, fields, mappings }.
 *
 * If the DB is unavailable (sandbox), respond 500 with a clear error.
 */
export async function POST() {
  const guard = await requireAdmin();
  if (guard) return guard;

  let templateCount = 0;
  let fieldCount = 0;
  let mappingCount = 0;

  try {
    // 1. Upsert all templates. Build a slug → id lookup table for later steps.
    const slugToId = new Map<string, string>();

    for (const t of ALL_TEMPLATES) {
      const upserted = await db.listingTemplate.upsert({
        where: { slug: t.slug },
        create: {
          slug: t.slug,
          name: t.name,
          description: t.description,
          ecosystem: t.ecosystem,
          icon: t.icon ?? null,
          sections: JSON.stringify(t.sections),
          active: true,
        },
        update: {
          name: t.name,
          description: t.description,
          ecosystem: t.ecosystem,
          icon: t.icon ?? null,
          sections: JSON.stringify(t.sections),
          active: true,
        },
        select: { id: true, slug: true },
      });

      slugToId.set(upserted.slug, upserted.id);
      templateCount += 1;
    }

    // 2. Replace each template's fields with the seeded definitions.
    const buildFieldData = (templateId: string, f: TemplateFieldDef, i: number) => ({
      templateId,
      key: f.key,
      label: f.label,
      type: f.type,
      section: f.section,
      sortOrder: f.sortOrder ?? i,
      required: f.required ?? false,
      enabled: f.enabled ?? true,
      placeholder: f.placeholder ?? null,
      helpText: f.helpText ?? null,
      unit: f.unit ?? null,
      span: f.span ?? 1,
      filterGroupName: f.filterGroupName ?? null,
      staticOptions: f.staticOptions ? JSON.stringify(f.staticOptions) : null,
      condition: f.condition ? JSON.stringify(f.condition) : null,
      subFields: f.subFields ? JSON.stringify(f.subFields) : null,
      toggleOptions: f.toggleOptions ? JSON.stringify(f.toggleOptions) : null,
      maxImages: f.maxImages ?? null,
      minValue: f.minValue ?? null,
      maxValue: f.maxValue ?? null,
      step: f.step ?? null,
    });

    for (const t of ALL_TEMPLATES) {
      const templateId = slugToId.get(t.slug);
      if (!templateId) continue;

      // Wipe existing fields for this template, then re-create from the def.
      await db.templateField.deleteMany({ where: { templateId } });

      for (let i = 0; i < t.fields.length; i++) {
        await db.templateField.create({
          data: buildFieldData(templateId, t.fields[i], i),
        });
        fieldCount += 1;
      }
    }

    // 3. Upsert each category/subcategory → template mapping.
    for (const m of TEMPLATE_MAPPINGS) {
      const templateId = slugToId.get(m.templateSlug);
      if (!templateId) continue;

      const subcategory =
        m.subcategory && m.subcategory.trim() !== "" ? m.subcategory : null;

      // Prisma's compound-unique `where` is typed as `string` for nullable
      // columns even though it accepts `null` at runtime (matches via
      // `IS NOT DISTINCT FROM`). Cast to satisfy the type checker.
      await db.templateMapping.upsert({
        where: {
          categoryId_subcategory: {
            categoryId: m.categoryId,
            subcategory: (subcategory ?? null) as unknown as string,
          },
        },
        create: {
          categoryId: m.categoryId,
          subcategory: subcategory ?? null,
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
      templates: templateCount,
      fields: fieldCount,
      mappings: mappingCount,
    });
  } catch (error: any) {
    console.error("[admin/templates/seed] POST failed:", error?.message);

    // The resilient DB proxy surfaces sandbox unavailability as a thrown error
    // (e.g. PrismaClientInitializationError) only for write operations; the
    // spec asks us to return a 500 with this exact payload when DB unavailable.
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
      { success: false, error: msg || "Seed failed" },
      { status: 500 }
    );
  }
}
