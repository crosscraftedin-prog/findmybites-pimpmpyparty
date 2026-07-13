import { NextResponse } from "next/server";
import { verifyDatabaseSchema } from "@/lib/db-health-check";

/**
 * GET /api/health/db
 * ─────────────────────────────────────────────────────────────────────────
 * Lightweight database schema health check (cached 60s).
 * Never blocks production requests — runs only when this endpoint is called.
 *
 * 200: { healthy: true, prisma: true, missingTables: [], missingColumns: [] }
 * 503: { healthy: false, prisma: false, missingTables: [...], missingColumns: [...] }
 *
 * Never exposes internal SQL or Prisma stack traces.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const result = await verifyDatabaseSchema();

  if (!result.healthy) {
    return NextResponse.json(result, { status: 503 });
  }

  return NextResponse.json(result);
}
