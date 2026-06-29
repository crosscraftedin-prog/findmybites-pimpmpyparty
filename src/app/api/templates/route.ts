import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ALL_TEMPLATES, type TemplateDef, type TemplateSectionDef } from "@/lib/template-definitions";

/**
 * GET /api/templates
 * Returns all active templates (metadata only, no fields).
 * Merges DB templates with code-defined templates.
 */
export async function GET() {
  try {
    let dbTemplates: any[] = [];
    try {
      dbTemplates = await db.listingTemplate.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
      });
    } catch {
      // DB unavailable
    }

    // Merge: DB templates override code templates with the same slug
    const codeSlugs = new Set(ALL_TEMPLATES.map((t) => t.slug));
    const dbSlugs = new Set(dbTemplates.map((t: any) => t.slug));

    const merged: TemplateDef[] = [
      // DB templates (admin-managed)
      ...dbTemplates.map((t: any) => ({
        slug: t.slug,
        name: t.name,
        description: t.description,
        ecosystem: t.ecosystem,
        icon: t.icon || undefined,
        sections: [], // not needed for list view
        fields: [],
      })),
      // Code templates that don't exist in DB
      ...ALL_TEMPLATES.filter((t) => !dbSlugs.has(t.slug)).map((t) => ({
        slug: t.slug,
        name: t.name,
        description: t.description,
        ecosystem: t.ecosystem,
        icon: t.icon,
        sections: [],
        fields: [],
      })),
    ];

    return NextResponse.json({ templates: merged });
  } catch (err) {
    console.error("[api/templates] GET failed:", err);
    return NextResponse.json({ templates: ALL_TEMPLATES });
  }
}
