import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * GET /api/admin/templates/[id]/safe-delete-check — pre-delete safety check.
 *
 * A template is "blocked" only if it has active category mappings (admin must
 * reassign them first). Products with this templateSlug keep their `extraFields`
 * JSON intact after deletion — they simply lose their template association,
 * which is acceptable (NOT a block).
 *
 * Returns:
 *   {
 *     canDelete: boolean,         // true iff mappingCount === 0
 *     productCount: N,
 *     mappingCount: N,
 *     warning: string,            // human-readable guidance
 *     blockReasons: string[]      // empty when canDelete is true
 *   }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;

    // Resolve the slug so we can count products using this template.
    let templateSlug: string | null = null;
    try {
      const template = await db.listingTemplate.findUnique({
        where: { id },
        select: { slug: true },
      });
      templateSlug = template?.slug ?? null;
    } catch {}

    // Active mappings block deletion (admin must reassign them first).
    let mappingCount = 0;
    try {
      mappingCount =
        (await db.templateMapping.count({
          where: { templateId: id },
        })) ?? 0;
    } catch {}

    // Product usage is informational only — it's not a block.
    let productCount = 0;
    if (templateSlug) {
      try {
        productCount =
          (await db.product.count({
            where: { templateSlug },
          })) ?? 0;
      } catch {
        productCount = 0;
      }
    }

    const blockReasons: string[] = [];
    if (mappingCount > 0) {
      blockReasons.push(
        `Template has ${mappingCount} active category mapping(s). Reassign or delete them first.`
      );
    }

    const canDelete = mappingCount === 0;

    // Build a helpful warning regardless of canDelete — surfaced in the UI.
    let warning: string;
    if (productCount > 0 && mappingCount > 0) {
      warning = `This template is used by ${productCount} product(s) and ${mappingCount} category mapping(s). Reassign the mappings before deleting. Existing products will keep their data but lose their template association.`;
    } else if (productCount > 0) {
      warning = `This template is used by ${productCount} product(s). Deleting will not remove existing products but they will lose their template association.`;
    } else if (mappingCount > 0) {
      warning = `This template has ${mappingCount} active category mapping(s). Reassign or delete them before deleting.`;
    } else {
      warning = "This template is not in use and can be safely deleted.";
    }

    return NextResponse.json({
      canDelete,
      productCount,
      mappingCount,
      warning,
      blockReasons,
    });
  } catch (error: any) {
    console.error(
      "[admin/templates/[id]/safe-delete-check] GET failed:",
      error?.message
    );
    // Degrade gracefully — return a safe "blocked" state so the admin UI
    // doesn't accidentally allow a destructive delete on a broken read.
    return NextResponse.json({
      canDelete: false,
      productCount: 0,
      mappingCount: 0,
      warning: "Unable to verify template usage. Delete blocked as a precaution.",
      blockReasons: ["Usage check failed — please try again."],
    });
  }
}
