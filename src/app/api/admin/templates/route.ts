import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { ALL_TEMPLATES } from "@/lib/template-definitions";

/**
 * Parse a JSON string column (sections, staticOptions, etc.) into an array.
 * Defensive: returns [] for null, undefined, empty, or malformed JSON.
 * This prevents "TypeError: .slice(...).sort is not a function" when the
 * frontend expects an array but gets a string.
 */
function parseJsonArray<T>(value: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Normalize a template's JSON-string columns into arrays so the frontend
 * never receives a string where it expects an array.
 */
function normalizeTemplate(t: any) {
  return {
    ...t,
    sections: parseJsonArray(t.sections),
    // Normalize field-level JSON strings too (defensive)
    fields: (t.fields ?? []).map((f: any) => ({
      ...f,
      staticOptions: parseJsonArray(f.staticOptions),
      condition: typeof f.condition === "string" ? safeJsonParse(f.condition, null) : f.condition,
      subFields: typeof f.subFields === "string" ? safeJsonParse(f.subFields, null) : f.subFields,
      toggleOptions: typeof f.toggleOptions === "string" ? safeJsonParse(f.toggleOptions, null) : f.toggleOptions,
      repeatFields: typeof f.repeatFields === "string" ? safeJsonParse(f.repeatFields, null) : f.repeatFields,
    })),
  };
}

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

/**
 * GET /api/admin/templates — list all templates with fields + mappings.
 * If the DB is unavailable (sandbox) and returns no rows, fall back to the
 * metadata from ALL_TEMPLATES so the admin UI can still render.
 *
 * V3 Fix: All JSON-string columns (sections, staticOptions, condition, etc.)
 * are parsed into arrays/objects before sending to the frontend. This prevents
 * "TypeError: o.slice(...).sort is not a function" crashes.
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
      // Normalize: parse JSON-string columns into arrays for the frontend
      const normalized = templates.map(normalizeTemplate);
      return NextResponse.json(normalized);
    }

    // Fallback: project the seed definitions as metadata-only payloads.
    // Return sections as PARSED ARRAY (not JSON string) — V3 fix.
    const fallback = ALL_TEMPLATES.map((t) => ({
      id: t.slug,
      slug: t.slug,
      name: t.name,
      description: t.description,
      ecosystem: t.ecosystem,
      icon: t.icon ?? null,
      active: true,
      sections: t.sections, // already an array in template-definitions.ts
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
