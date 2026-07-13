import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * Field shape coming from the admin UI. Arrays/objects are JSON-encoded before
 * being persisted (the schema stores them as String?).
 */
interface FieldInput {
  key?: string;
  label?: string;
  type?: string;
  section?: string;
  sortOrder?: number;
  required?: boolean;
  enabled?: boolean;
  placeholder?: string | null;
  helpText?: string | null;
  unit?: string | null;
  span?: number;
  filterGroupName?: string | null;
  staticOptions?: string[] | null;
  condition?: { field: string; values: string[] } | null;
  subFields?: string[] | null;
  toggleOptions?: string[] | null;
  maxImages?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
  step?: number | null;
}

function toJsonStr(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

/**
 * Parse a JSON string column into an array/object. Defensive.
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
 * Normalize a field's JSON-string columns into arrays/objects for the frontend.
 */
function normalizeField(f: any) {
  return {
    ...f,
    staticOptions: parseJsonArray(f.staticOptions),
    condition: typeof f.condition === "string" ? safeJsonParse(f.condition, null) : f.condition,
    subFields: typeof f.subFields === "string" ? safeJsonParse(f.subFields, null) : f.subFields,
    toggleOptions: typeof f.toggleOptions === "string" ? safeJsonParse(f.toggleOptions, null) : f.toggleOptions,
    repeatFields: typeof f.repeatFields === "string" ? safeJsonParse(f.repeatFields, null) : f.repeatFields,
  };
}

/**
 * GET /api/admin/templates/[id]/fields — list all fields for a template,
 * ordered by sortOrder ascending.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;

    const fields = await db.templateField.findMany({
      where: { templateId: id },
      orderBy: { sortOrder: "asc" },
    });

    // Normalize: parse JSON-string columns into arrays for the frontend
    const normalized = (fields ?? []).map(normalizeField);
    return NextResponse.json(normalized);
  } catch (error: any) {
    console.error("[admin/templates/[id]/fields] GET failed:", error?.message);
    return NextResponse.json(
      { error: error?.message ?? "Failed to load fields" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/templates/[id]/fields — add a single new field.
 * Validates that key, label, type, section are present.
 * Arrays/objects are JSON-stringified before persistence.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;
    const body = (await req.json()) as FieldInput;

    if (!body.key || !body.label || !body.type || !body.section) {
      return NextResponse.json(
        { error: "key, label, type, and section are required" },
        { status: 400 }
      );
    }

    // Make sure the parent template exists.
    const parent = await db.listingTemplate.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!parent) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const created = await db.templateField.create({
      data: {
        templateId: id,
        key: body.key,
        label: body.label,
        type: body.type,
        section: body.section,
        sortOrder: body.sortOrder ?? 0,
        required: body.required ?? false,
        enabled: body.enabled ?? true,
        placeholder: body.placeholder ?? null,
        helpText: body.helpText ?? null,
        unit: body.unit ?? null,
        span: body.span ?? 1,
        filterGroupName: body.filterGroupName ?? null,
        staticOptions: toJsonStr(body.staticOptions),
        condition: toJsonStr(body.condition),
        subFields: toJsonStr(body.subFields),
        toggleOptions: toJsonStr(body.toggleOptions),
        maxImages: body.maxImages ?? null,
        minValue: body.minValue ?? null,
        maxValue: body.maxValue ?? null,
        step: body.step ?? null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("[admin/templates/[id]/fields] POST failed:", error?.message);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create field" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/templates/[id]/fields — bulk replace all fields for a template.
 * Body: { fields: FieldInput[] }
 *
 * This supports drag-and-drop reordering + inline edits in the admin UI. The
 * implementation deletes all existing fields for the template and re-creates
 * them from the payload (upsert-by-key semantics for the UI's perspective).
 *
 * This is wrapped in a transaction so the template is never left in a partial
 * state if any single insert fails.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;
    const body = (await req.json()) as { fields?: FieldInput[] };

    if (!Array.isArray(body.fields)) {
      return NextResponse.json(
        { error: "fields (array) is required" },
        { status: 400 }
      );
    }

    // Validate required props on each field before touching the DB.
    for (const f of body.fields) {
      if (!f.key || !f.label || !f.type || !f.section) {
        return NextResponse.json(
          { error: `Field is missing required props (key/label/type/section): ${JSON.stringify(f.key ?? "(no key)")}` },
          { status: 400 }
        );
      }
    }

    const parent = await db.listingTemplate.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!parent) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    await db.$transaction([
      db.templateField.deleteMany({ where: { templateId: id } }),
      ...body.fields.map((f, i) =>
        db.templateField.create({
          data: {
            templateId: id,
            key: f.key!,
            label: f.label!,
            type: f.type!,
            section: f.section!,
            sortOrder: f.sortOrder ?? i,
            required: f.required ?? false,
            enabled: f.enabled ?? true,
            placeholder: f.placeholder ?? null,
            helpText: f.helpText ?? null,
            unit: f.unit ?? null,
            span: f.span ?? 1,
            filterGroupName: f.filterGroupName ?? null,
            staticOptions: toJsonStr(f.staticOptions),
            condition: toJsonStr(f.condition),
            subFields: toJsonStr(f.subFields),
            toggleOptions: toJsonStr(f.toggleOptions),
            maxImages: f.maxImages ?? null,
            minValue: f.minValue ?? null,
            maxValue: f.maxValue ?? null,
            step: f.step ?? null,
          },
        })
      ),
    ]);

    const refreshed = await db.templateField.findMany({
      where: { templateId: id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(refreshed);
  } catch (error: any) {
    console.error("[admin/templates/[id]/fields] PUT failed:", error?.message);
    return NextResponse.json(
      { error: error?.message ?? "Failed to update fields" },
      { status: 500 }
    );
  }
}
