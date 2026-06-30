import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * GET /api/admin/templates/[id]/usage — usage statistics for a template.
 *
 * Returns:
 *   {
 *     mappings: [{ categoryId, subcategory }, ...],
 *     categoryCount: N,   // distinct categories mapped
 *     productCount: N,    // products with templateSlug = template.slug
 *     vendorCount: N      // distinct vendors that own those products
 *   }
 *
 * All DB calls are wrapped in try/catch so the route degrades gracefully to
 * zeros/empty arrays if the DB is unavailable or columns are missing.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;

    // Look up the template so we can resolve its slug for the product query.
    let templateSlug: string | null = null;
    try {
      const template = await db.listingTemplate.findUnique({
        where: { id },
        select: { slug: true },
      });
      templateSlug = template?.slug ?? null;
    } catch {}

    // Fetch all mappings for this template.
    let mappings: { categoryId: string; subcategory: string | null }[] = [];
    try {
      mappings =
        (await db.templateMapping.findMany({
          where: { templateId: id },
          select: { categoryId: true, subcategory: true },
        })) ?? [];
    } catch {}

    // Distinct category count from the mappings.
    const categoryCount = new Set(mappings.map((m) => m.categoryId)).size;

    // Product + vendor counts. The `templateSlug` column was added in v2 —
    // older sandboxes may not have it migrated, so each query is isolated.
    let productCount = 0;
    let vendorCount = 0;

    if (templateSlug) {
      try {
        productCount =
          (await db.product.count({
            where: { templateSlug },
          })) ?? 0;
      } catch {
        productCount = 0;
      }

      try {
        // Distinct vendor count via a findMany + distinct on vendorId.
        const vendors = await db.product.findMany({
          where: { templateSlug },
          select: { vendorId: true },
          distinct: ["vendorId"],
        });
        vendorCount = Array.isArray(vendors) ? vendors.length : 0;
      } catch {
        vendorCount = 0;
      }
    }

    return NextResponse.json({
      mappings,
      categoryCount,
      productCount,
      vendorCount,
    });
  } catch (error: any) {
    console.error(
      "[admin/templates/[id]/usage] GET failed:",
      error?.message
    );
    // Degrade gracefully — never 500 the admin UI over a stats panel.
    return NextResponse.json({
      mappings: [],
      categoryCount: 0,
      productCount: 0,
      vendorCount: 0,
    });
  }
}
