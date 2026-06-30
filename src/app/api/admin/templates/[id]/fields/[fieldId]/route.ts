import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

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
 * PUT /api/admin/templates/[id]/fields/[fieldId] — update a single field.
 * Any property from FieldInput may be present; only provided ones are written.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id, fieldId } = await params;
    const body = (await req.json()) as FieldInput;

    // Ensure the field actually belongs to the path's template.
    const existing = await db.templateField.findUnique({
      where: { id: fieldId },
      select: { templateId: true },
    });
    if (!existing || existing.templateId !== id) {
      return NextResponse.json(
        { error: "Field not found for this template" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (body.key !== undefined) data.key = body.key;
    if (body.label !== undefined) data.label = body.label;
    if (body.type !== undefined) data.type = body.type;
    if (body.section !== undefined) data.section = body.section;
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
    if (body.required !== undefined) data.required = body.required;
    if (body.enabled !== undefined) data.enabled = body.enabled;
    if (body.placeholder !== undefined) data.placeholder = body.placeholder ?? null;
    if (body.helpText !== undefined) data.helpText = body.helpText ?? null;
    if (body.unit !== undefined) data.unit = body.unit ?? null;
    if (body.span !== undefined) data.span = body.span;
    if (body.filterGroupName !== undefined) data.filterGroupName = body.filterGroupName ?? null;
    if (body.staticOptions !== undefined) data.staticOptions = toJsonStr(body.staticOptions);
    if (body.condition !== undefined) data.condition = toJsonStr(body.condition);
    if (body.subFields !== undefined) data.subFields = toJsonStr(body.subFields);
    if (body.toggleOptions !== undefined) data.toggleOptions = toJsonStr(body.toggleOptions);
    if (body.maxImages !== undefined) data.maxImages = body.maxImages ?? null;
    if (body.minValue !== undefined) data.minValue = body.minValue ?? null;
    if (body.maxValue !== undefined) data.maxValue = body.maxValue ?? null;
    if (body.step !== undefined) data.step = body.step ?? null;

    const updated = await db.templateField.update({
      where: { id: fieldId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[admin/templates/[id]/fields/[fieldId]] PUT failed:", error?.message);
    return NextResponse.json(
      { error: error?.message ?? "Failed to update field" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/templates/[id]/fields/[fieldId] — delete a single field.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id, fieldId } = await params;

    // Sanity-check the field belongs to the path's template before deleting.
    const existing = await db.templateField.findUnique({
      where: { id: fieldId },
      select: { templateId: true },
    });
    if (!existing || existing.templateId !== id) {
      return NextResponse.json(
        { error: "Field not found for this template" },
        { status: 404 }
      );
    }

    await db.templateField.delete({ where: { id: fieldId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[admin/templates/[id]/fields/[fieldId]] DELETE failed:", error?.message);
    return NextResponse.json(
      { error: error?.message ?? "Failed to delete field" },
      { status: 500 }
    );
  }
}
