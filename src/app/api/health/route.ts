/**
 * GET /api/health — health check endpoint for uptime monitoring.
 *
 * Returns 200 if the server is running and can reach the database.
 * Returns 503 if the database is unreachable.
 *
 * Used by: Vercel uptime monitoring, external monitors (UptimeRobot, etc.)
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const startTime = Date.now();
  try {
    // Quick DB ping — count 1 vendor (lightweight query)
    await db.vendor.count({ take: 1 });
    const latency = Date.now() - startTime;
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      latency: `${latency}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    const latency = Date.now() - startTime;
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "error",
        error: err.message,
        latency: `${latency}ms`,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
