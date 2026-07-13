import { NextRequest, NextResponse } from "next/server";
import { resolveWizardSteps } from "@/lib/products/template-engine-v3";

/**
 * GET /api/templates/v3/wizard?category=bakers-bakery
 *
 * Resolves wizard steps from the DB template.
 * Returns null if no template wizard is defined (caller falls back to code).
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category") || undefined;
    if (!category) {
      return NextResponse.json({ error: "category is required" }, { status: 400 });
    }

    const steps = await resolveWizardSteps(category);
    return NextResponse.json({ steps, source: steps ? "db" : "default" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
