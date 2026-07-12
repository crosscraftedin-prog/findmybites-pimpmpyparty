import { NextRequest, NextResponse } from "next/server";
import { listAttributes, listAttributesGrouped } from "@/lib/attributes/attribute-service";

/**
 * GET /api/attributes — list all active attributes.
 *
 * Query params:
 *   ?group=dietary          — filter by group
 *   ?ecosystem=FINDMYBITES  — filter by ecosystem (includes "BOTH")
 *   ?grouped=true           — return grouped structure { group, groupLabel, attributes[] }
 *   ?activeOnly=false       — include inactive (admin only; public always true)
 *
 * Public endpoint (no auth) — attributes are reference data, not secrets.
 * Cached: s-maxage=3600, stale-while-revalidate=86400 (attributes rarely change).
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const group = url.searchParams.get("group") ?? undefined;
  const ecosystem = url.searchParams.get("ecosystem") ?? undefined;
  const grouped = url.searchParams.get("grouped") === "true";
  const activeOnly = url.searchParams.get("activeOnly") !== "false";

  try {
    if (grouped) {
      const data = await listAttributesGrouped({ ecosystem, activeOnly });
      const res = NextResponse.json({ groups: data });
      res.headers.set("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
      return res;
    }

    const data = await listAttributes({ group, ecosystem, activeOnly });
    const res = NextResponse.json({ attributes: data });
    res.headers.set("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res;
  } catch (error: any) {
    console.error("[api/attributes] GET failed:", error);
    return NextResponse.json({ error: "Failed to fetch attributes" }, { status: 500 });
  }
}
