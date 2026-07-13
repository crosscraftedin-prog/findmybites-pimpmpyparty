import { NextResponse } from "next/server";
import { verifyDatabaseSchema } from "@/lib/db-health-check";

/**
 * GET /api/health/db
 * ─────────────────────────────────────────────────────────────────────────
 * Lightweight database schema health check.
 *
 * Returns 200 if the database schema matches the application's expectations.
 * Returns 503 if the schema is out of sync (missing columns/tables).
 *
 * Used by:
 *   - Vercel deployment health checks
 *   - CI/CD pipeline to verify post-deploy schema
 *   - Dashboard startup (client-side fetch)
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await verifyDatabaseSchema();

    if (!result.healthy) {
      return NextResponse.json(
        {
          status: "unhealthy",
          missingColumns: result.missingColumns,
          missingTables: result.missingTables,
          error: result.error,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      message: "Database schema is in sync",
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", error: error.message },
      { status: 500 }
    );
  }
}
