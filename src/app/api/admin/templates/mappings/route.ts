import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * GET /api/admin/templates/mappings — list all template mappings with the
 * parent template's slug + name for display in the admin UI.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const mappings = await db.templateMapping.findMany({
      include: {
        template: { select: { slug: true, name: true } },
      },
      orderBy: { categoryId: "asc" },
      take: 500,
    });

    return NextResponse.json(mappings ?? []);
  } catch (error: any) {
    console.error("[admin/templates/mappings] GET failed:", error?.message);
    return NextResponse.json(
      { error: error?.message ?? "Failed to load mappings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/templates/mappings — create (upsert) a mapping.
 * Body: { categoryId, subcategory?, templateId }
 * Empty-string subcategory is normalized to null. Uses upsert on the
 * [categoryId, subcategory] unique constraint to avoid duplicates.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = (await req.json()) as {
      categoryId?: string;
      subcategory?: string | null;
      templateId?: string;
    };

    if (!body.categoryId || !body.templateId) {
      return NextResponse.json(
        { error: "categoryId and templateId are required" },
        { status: 400 }
      );
    }

    // Normalize empty string -> null for the unique key.
    const subcategory =
      body.subcategory && body.subcategory.trim() !== ""
        ? body.subcategory
        : null;

    // Verify the template exists.
    const template = await db.listingTemplate.findUnique({
      where: { id: body.templateId },
      select: { id: true },
    });
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Prisma's compound-unique `where` is typed as `string` for nullable
    // columns even though it accepts `null` at runtime (matches via
    // `IS NOT DISTINCT FROM`). Cast to satisfy the type checker.
    const upserted = await db.templateMapping.upsert({
      where: {
        categoryId_subcategory: {
          categoryId: body.categoryId,
          subcategory: (subcategory ?? null) as unknown as string,
        },
      },
      create: {
        categoryId: body.categoryId,
        subcategory: subcategory ?? null,
        templateId: body.templateId,
      },
      update: {
        templateId: body.templateId,
      },
      include: {
        template: { select: { slug: true, name: true } },
      },
    });

    return NextResponse.json(upserted, { status: 201 });
  } catch (error: any) {
    console.error("[admin/templates/mappings] POST failed:", error?.message);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create mapping" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/templates/mappings — delete a mapping.
 * Accepts categoryId + subcategory either from query params (?categoryId=...&subcategory=...)
 * or from the JSON body. Empty-string subcategory is normalized to null.
 */
export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const url = new URL(req.url);
    const fromQuery = {
      categoryId: url.searchParams.get("categoryId"),
      subcategory: url.searchParams.get("subcategory"),
    };

    let categoryId: string | undefined;
    let subcategoryRaw: string | null | undefined;

    if (fromQuery.categoryId) {
      categoryId = fromQuery.categoryId;
      subcategoryRaw = fromQuery.subcategory;
    } else {
      // Fall back to JSON body
      let body: any = {};
      try {
        body = await req.json();
      } catch {
        body = {};
      }
      categoryId = body?.categoryId;
      subcategoryRaw = body?.subcategory ?? null;
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId is required (via query or body)" },
        { status: 400 }
      );
    }

    const subcategory =
      subcategoryRaw && String(subcategoryRaw).trim() !== ""
        ? String(subcategoryRaw)
        : null;

    const deleted = await db.templateMapping.deleteMany({
      where: {
        categoryId,
        subcategory: subcategory ?? null,
      },
    });

    if (deleted?.count === 0) {
      return NextResponse.json(
        { error: "Mapping not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, count: deleted?.count ?? 0 });
  } catch (error: any) {
    console.error("[admin/templates/mappings] DELETE failed:", error?.message);
    return NextResponse.json(
      { error: error?.message ?? "Failed to delete mapping" },
      { status: 500 }
    );
  }
}
