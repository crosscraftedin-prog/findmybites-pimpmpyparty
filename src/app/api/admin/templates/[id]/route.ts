import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { invalidateAllTemplateCaches } from "@/lib/products/template-cache";

/**
 * Parse a JSON string column into an array. Defensive — returns [] for
 * null/undefined/empty/malformed. Prevents frontend TypeErrors.
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

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

/**
 * Normalize a template's JSON-string columns into arrays/objects.
 */
function normalizeTemplate(t: any) {
  return {
    ...t,
    sections: parseJsonArray(t.sections),
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

/**
 * GET /api/admin/templates/[id] — fetch a single template with fields + mappings.
 * V3 Fix: normalizes JSON-string columns into arrays for the frontend.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;

    const template = await db.listingTemplate.findUnique({
      where: { id },
      include: {
        fields: { orderBy: { sortOrder: "asc" } },
        mappings: true,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Normalize: parse JSON-string columns into arrays
    return NextResponse.json(normalizeTemplate(template));
  } catch (error: any) {
    console.error("[admin/templates/[id]] GET failed:", error?.message);
    return NextResponse.json(
      { error: error?.message ?? "Failed to load template" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/templates/[id] — update template metadata.
 * Body may include any of: name, description, ecosystem, icon, active, sections.
 * `sections` (if provided) is an array and is stored as a JSON string.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;
    const body = (await req.json()) as {
      name?: string;
      description?: string;
      ecosystem?: string;
      icon?: string | null;
      active?: boolean;
      sections?: unknown[];
    };

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.ecosystem !== undefined) data.ecosystem = body.ecosystem;
    if (body.icon !== undefined) data.icon = body.icon ?? null;
    if (body.active !== undefined) data.active = body.active;
    if (body.sections !== undefined) {
      data.sections = Array.isArray(body.sections)
        ? JSON.stringify(body.sections)
        : "[]";
    }

    const updated = await db.listingTemplate.update({
      where: { id },
      data,
    });

    // Invalidate template cache so metadata changes are visible immediately
    invalidateAllTemplateCaches();

    // Normalize: parse JSON-string columns into arrays for the frontend
    return NextResponse.json(normalizeTemplate(updated));
  } catch (error: any) {
    console.error("[admin/templates/[id]] PUT failed:", error?.message);
    return NextResponse.json(
      { error: error?.message ?? "Failed to update template" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/templates/[id] — delete a template.
 * Prisma cascades the deletion to TemplateField + TemplateMapping via the
 * onDelete: Cascade relation declared in the schema.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;

    await db.listingTemplate.delete({ where: { id } });

    // Invalidate template cache so deletion is visible immediately
    invalidateAllTemplateCaches();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[admin/templates/[id]] DELETE failed:", error?.message);
    return NextResponse.json(
      { error: error?.message ?? "Failed to delete template" },
      { status: 500 }
    );
  }
}
