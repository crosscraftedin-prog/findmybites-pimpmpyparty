import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import {
  parseCSV, prepareImport, executeImport, generateCSVTemplate,
} from "@/lib/vendor/import-service";

/**
 * POST /api/admin/vendor-import
 * Body: { csv: string, dryRun?: boolean }
 *
 * - dryRun=true: parse + validate + return preview (no DB writes)
 * - dryRun=false: parse + validate + create vendors
 *
 * GET /api/admin/vendor-import
 * Returns a CSV template for download.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  return NextResponse.json({
    template: generateCSVTemplate(),
    columns: ["name", "whatsapp", "ecosystem", "category", "city", "country", "tagline"],
    instructions: "Upload a CSV with these columns. name and whatsapp are required.",
  });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await req.json();
    const { csv, dryRun } = body as { csv: string; dryRun?: boolean };

    if (!csv?.trim()) {
      return NextResponse.json({ error: "CSV data is required" }, { status: 400 });
    }

    // Parse CSV
    const rows = parseCSV(csv);
    if (rows.length === 0) {
      return NextResponse.json({ error: "No valid rows found in CSV" }, { status: 400 });
    }

    // Validate + detect duplicates
    const prepared = await prepareImport(rows);

    if (dryRun) {
      return NextResponse.json({
        total: prepared.total,
        valid: prepared.rows.length,
        duplicates: prepared.duplicates.length,
        invalid: prepared.invalid.length,
        preview: prepared.rows.slice(0, 20).map(r => ({
          name: r.name,
          whatsapp: r.whatsapp,
          ecosystem: r.ecosystem || "auto-detect",
          city: r.city || "Unknown",
          country: r.country || "auto-detect",
        })),
        duplicatePreview: prepared.duplicates.slice(0, 5).map(r => r.name),
        invalidPreview: prepared.invalid.slice(0, 5).map(i => ({ name: i.row.name, reason: i.reason })),
      });
    }

    // Execute import
    const result = await executeImport(prepared.rows);

    return NextResponse.json({
      success: true,
      ...result,
      duplicates: prepared.duplicates.length,
      invalid: prepared.invalid.length,
      totalProcessed: prepared.total,
    });
  } catch (error: any) {
    console.error("[vendor-import] POST failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
