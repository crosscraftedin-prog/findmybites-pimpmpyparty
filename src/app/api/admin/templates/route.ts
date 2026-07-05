import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { ALL_TEMPLATES } from "@/lib/template-definitions";

/**
 * GET /api/admin/templates — list all templates with fields + mappings.
 * If the DB is unavailable (sandbox) and returns no rows, fall back to the
 * metadata from ALL_TEMPLATES so the admin UI can still render.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const templates = await db.listingTemplate.findMany({
      include: {
        fields: { orderBy: { sortOrder: "asc" } },
        mappings: true,
      },
      orderBy: { name: "asc" },
      take: 100,
    });

    if (templates && templates.length > 0) {
      return NextResponse.json(templates);
    }

    // Fallback: project the seed definitions as metadata-only payloads.
    const fallback = ALL_TEMPLATES.map((t) => ({
      id: t.slug,
      slug: t.slug,
      name: t.name,
      description: t.description,
      ecosystem: t.ecosystem,
      icon: t.icon ?? null,
      active: true,
      sections: JSON.stringify(t.sections),
      fields: [],
      mappings: [],
      _seed: true,
    }));

    return NextResponse.json(fallback);
  } catch (error: any) {
    console.error("[admin/templates] GET failed:", error?.message);
    return NextResponse.json(
      { error: error?.message ?? "Failed to load templates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/templates — create a new template.
 * Body: { slug, name, description?, ecosystem?, icon?, sections? }
 * `sections` is an array — it is stored as a JSON string.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = (await req.json()) as {
      slug?: string;
      name?: string;
      description?: string;
      ecosystem?: string;
      icon?: string | null;
      sections?: unknown[];
    };

    if (!body.slug || !body.name) {
      return NextResponse.json(
        { error: "slug and name are required" },
        { status: 400 }
      );
    }

    // Validate slug uniqueness
    const existing = await db.listingTemplate.findUnique({
      where: { slug: body.slug },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A template with this slug already exists" },
        { status: 409 }
      );
    }

    const sectionsStr = Array.isArray(body.sections)
      ? JSON.stringify(body.sections)
      : "[]";

    const created = await db.listingTemplate.create({
      data: {
        slug: body.slug,
        name: body.name,
        description: body.description ?? "",
        ecosystem: body.ecosystem ?? "BOTH",
        icon: body.icon ?? null,
        sections: sectionsStr,
        active: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("[admin/templates] POST failed:", error?.message);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create template" },
      { status: 500 }
    );
  }
}
