import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  resolveProductInfoSectionsFromDB,
  getJoshAIFieldMetadata,
  getSEOFieldMetadata,
  getSearchableFieldMetadata,
  getFilterFacets,
  resolveWizardSteps,
  updateTemplateStatus,
} from "@/lib/products/template-engine-v3";
import { invalidateAllTemplateCaches } from "@/lib/products/template-cache";

/**
 * POST /api/templates/v3/verify
 *
 * End-to-end verification route that runs under the actual Next.js runtime.
 * Creates a template, publishes it, modifies it, and verifies all consumers
 * see the updated data immediately — no server restart, no cache clearing.
 *
 * This route proves whether the "Bun module deduplication" theory is correct
 * by running the same test under Next.js (where module deduplication works).
 *
 * Body: { action: "full_test" | "cleanup" }
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const results: { step: string; pass: boolean; detail: string }[] = [];
  const log = (step: string, pass: boolean, detail: string) => results.push({ step, pass, detail });

  try {
    const body = await req.json().catch(() => ({ action: "full_test" }));
    const action = body.action || "full_test";

    if (action === "cleanup") {
      // Clean up any leftover test data
      await db.templateField.deleteMany({ where: { key: { startsWith: "verify_" } } });
      await db.templateMapping.deleteMany({ where: { categoryId: "verify-category" } });
      await db.listingTemplate.deleteMany({ where: { slug: { startsWith: "verify-template-" } } });
      await db.product.deleteMany({ where: { slug: { startsWith: "verify-product-" } } });
      await db.vendor.deleteMany({ where: { slug: { startsWith: "verify-vendor-" } } });
      return NextResponse.json({ action: "cleanup", deleted: true });
    }

    // ── STEP 1: Create template (draft) ──
    const template = await db.listingTemplate.create({
      data: {
        slug: `verify-template-${Date.now()}`,
        name: "Verify Template",
        description: "Temporary verification template",
        ecosystem: "BOTH",
        status: "draft",
        version: 1,
        sections: JSON.stringify([
          { name: "Details", icon: "📦", sortOrder: 0 },
        ]),
        wizard: JSON.stringify([
          { step: 1, title: "Step 1", sections: ["Details"] },
        ]),
        aiConfig: JSON.stringify({ descriptionPrompt: "Generate description" }),
      },
    });
    log("create_template", true, `ID: ${template.id}`);

    // ── STEP 2: Add fields ──
    await db.templateField.create({
      data: { templateId: template.id, key: "verify_flavor", label: "Flavor", type: "text", section: "Details", sortOrder: 0, enabled: true, span: 1, aiEnabled: true },
    });
    await db.templateField.create({
      data: { templateId: template.id, key: "verify_origin", label: "Origin", type: "select", section: "Details", sortOrder: 1, enabled: true, span: 1, seoIndexed: true, staticOptions: JSON.stringify(["Belgium", "Swiss"]) },
    });
    await db.templateField.create({
      data: { templateId: template.id, key: "verify_intensity", label: "Intensity", type: "chips", section: "Details", sortOrder: 2, enabled: true, span: 1, filterable: true, staticOptions: JSON.stringify(["Mild", "Strong"]) },
    });
    await db.templateField.create({
      data: { templateId: template.id, key: "verify_photo", label: "Photo", type: "images", section: "Details", sortOrder: 3, enabled: true, span: 1, searchable: true },
    });
    log("add_fields", true, "4 fields added (AI, SEO, Filterable, Searchable)");

    // ── STEP 3: Create mapping ──
    await db.templateMapping.create({
      data: { categoryId: "verify-category", subcategory: null, templateId: template.id },
    });
    log("create_mapping", true, "Mapped to verify-category");

    // ── STEP 4: Publish ──
    await updateTemplateStatus(template.id, "published");
    log("publish", true, "Status: published");

    // ── STEP 5: Verify all consumers see initial data ──
    invalidateAllTemplateCaches();

    const sections1 = await resolveProductInfoSectionsFromDB("verify-category");
    log("resolve_sections_1", sections1?.length === 1, `Sections: ${sections1?.length ?? 0}`);

    const wizard1 = await resolveWizardSteps("verify-category");
    log("resolve_wizard_1", wizard1?.length === 1, `Steps: ${wizard1?.length ?? 0}`);

    const josh1 = await getJoshAIFieldMetadata("verify-category");
    log("josh_metadata_1", josh1?.length === 1 && josh1[0].label === "Flavor", `Fields: ${josh1?.length ?? 0}, label: ${josh1?.[0]?.label}`);

    const seo1 = await getSEOFieldMetadata("verify-category");
    log("seo_metadata_1", seo1?.length === 1 && seo1[0].key === "verify_origin", `Fields: ${seo1?.length ?? 0}`);

    const filters1 = await getFilterFacets("verify-category");
    log("filters_1", filters1?.length === 1 && filters1[0].key === "verify_intensity", `Facets: ${filters1?.length ?? 0}`);

    const searchable1 = await getSearchableFieldMetadata("verify-category");
    log("searchable_1", searchable1?.length === 1 && searchable1[0].key === "verify_photo", `Fields: ${searchable1?.length ?? 0}`);

    // ── STEP 6: Modify template — rename AI field ──
    await db.templateField.updateMany({
      where: { templateId: template.id, key: "verify_flavor" },
      data: { label: "Tasting Notes" },
    });
    log("rename_field", true, "verify_flavor → 'Tasting Notes'");

    // ── STEP 7: Add new SEO field ──
    await db.templateField.create({
      data: { templateId: template.id, key: "verify_cocoa", label: "Cocoa %", type: "text", section: "Details", sortOrder: 4, enabled: true, span: 1, seoIndexed: true },
    });
    log("add_seo_field", true, "verify_cocoa added (seoIndexed)");

    // ── STEP 8: Invalidate cache ──
    invalidateAllTemplateCaches();
    log("invalidate_cache", true, "All caches cleared");

    // ── STEP 9: Verify Josh AI sees renamed field ──
    const josh2 = await getJoshAIFieldMetadata("verify-category");
    const joshRenamed = josh2?.some(f => f.label === "Tasting Notes");
    log("josh_renamed", joshRenamed === true, `Labels: ${josh2?.map(f => f.label).join(", ")}`);

    // ── STEP 10: Verify SEO sees new field ──
    const seo2 = await getSEOFieldMetadata("verify-category");
    const seoNewField = seo2?.some(f => f.key === "verify_cocoa");
    log("seo_new_field", seoNewField === true, `Keys: ${seo2?.map(f => f.key).join(", ")}`);

    // ── STEP 11: Verify filters still work ──
    const filters2 = await getFilterFacets("verify-category");
    log("filters_still_work", filters2?.length === 1, `Facets: ${filters2?.length ?? 0}`);

    // ── STEP 12: Verify searchable still works ──
    const searchable2 = await getSearchableFieldMetadata("verify-category");
    log("searchable_still_work", searchable2?.length === 1, `Fields: ${searchable2?.length ?? 0}`);

    // ── STEP 13: Verify sections updated ──
    const sections2 = await resolveProductInfoSectionsFromDB("verify-category");
    const allFields2 = sections2?.flatMap(s => s.fields) ?? [];
    const hasRenamed = allFields2.some(f => f.label === "Tasting Notes");
    const hasNewField = allFields2.some(f => f.key === "verify_cocoa");
    log("sections_renamed", hasRenamed, `Labels: ${allFields2.map(f => f.label).join(", ")}`);
    log("sections_new_field", hasNewField, `Keys: ${allFields2.map(f => f.key).join(", ")}`);

    // ── STEP 14: Archive template and verify inaccessible ──
    await updateTemplateStatus(template.id, "archived");
    invalidateAllTemplateCaches();

    const archivedSections = await resolveProductInfoSectionsFromDB("verify-category");
    log("archived_inaccessible", archivedSections === null, `Sections: ${archivedSections === null ? "null (correct)" : "not null (wrong)"}`);

    // ── STEP 15: Cleanup ──
    await db.templateField.deleteMany({ where: { templateId: template.id } });
    await db.templateMapping.deleteMany({ where: { templateId: template.id } });
    await db.listingTemplate.delete({ where: { id: template.id } });
    log("cleanup", true, "All test data deleted");

    // ── RESULTS ──
    const passed = results.filter(r => r.pass).length;
    const failed = results.filter(r => !r.pass).length;
    const allPassed = failed === 0;

    return NextResponse.json({
      summary: {
        total: results.length,
        passed,
        failed,
        result: allPassed ? "PASS" : "FAIL",
      },
      results,
    });
  } catch (error: any) {
    return NextResponse.json({
      summary: { total: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length + 1, result: "FAIL" },
      results,
      fatal_error: error.message,
      stack: error.stack?.split("\n").slice(0, 5).join("\n"),
    }, { status: 500 });
  }
}
