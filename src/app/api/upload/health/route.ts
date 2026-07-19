import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/upload/health
 *
 * Upload system health check.
 *
 * Returns the status of every dependency the upload pipeline needs:
 *   - Storage reachable (Supabase URL responds)
 *   - Bucket exists (vendor-uploads bucket is accessible)
 *   - Permissions OK (service role key can list the bucket)
 *   - Environment OK (all required env vars are set)
 *   - Supabase latency (time to fetch the bucket list)
 *   - Version (upload pipeline version)
 *
 * This endpoint is NOT authenticated — it's a public health check used by
 * monitoring tools and the admin dashboard. It does NOT expose sensitive
 * information (no keys, no user data).
 *
 * Response:
 *   {
 *     status: "ok" | "degraded" | "down",
 *     version: "2.0.0",
 *     timestamp: ISO string,
 *     environment: { supabaseUrl, serviceRoleKey, anonKey },
 *     storage: { reachable, bucketExists, permissionsOk, latencyMs },
 *     checks: [{ name, status, durationMs, detail? }]
 *   }
 */

const BUCKET_NAME = "vendor-uploads";
const VERSION = "2.0.0";

interface HealthCheck {
  name: string;
  status: "pass" | "fail";
  durationMs: number;
  detail?: string;
}

export async function GET() {
  const startTime = Date.now();
  const checks: HealthCheck[] = [];

  // ── 1. Environment check ──
  const envStart = Date.now();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const envOk = !!(supabaseUrl && serviceRoleKey && anonKey);
  checks.push({
    name: "environment",
    status: envOk ? "pass" : "fail",
    durationMs: Date.now() - envStart,
    detail: envOk
      ? undefined
      : `Missing: ${[
          !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
          !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
          !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        ].filter(Boolean).join(", ")}`,
  });

  // ── 2. Storage reachability + bucket existence + permissions ──
  let storageReachable = false;
  let bucketExists = false;
  let permissionsOk = false;
  let storageLatencyMs = 0;

  if (envOk) {
    // ── 2a. Check if Supabase URL is reachable ──
    const reachStart = Date.now();
    try {
      const reachResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${serviceRoleKey}` },
        signal: AbortSignal.timeout(5000), // 5s timeout
      });
      storageLatencyMs = Date.now() - reachStart;
      storageReachable = reachResponse.ok;

      checks.push({
        name: "storage.reachable",
        status: storageReachable ? "pass" : "fail",
        durationMs: storageLatencyMs,
        detail: storageReachable ? undefined : `HTTP ${reachResponse.status}`,
      });

      // ── 2b. Check if the bucket exists ──
      if (storageReachable) {
        const buckets = await reachResponse.json().catch(() => []);
        const bucket = Array.isArray(buckets)
          ? buckets.find((b: any) => b.id === BUCKET_NAME || b.name === BUCKET_NAME)
          : null;
        bucketExists = !!bucket;

        checks.push({
          name: "storage.bucketExists",
          status: bucketExists ? "pass" : "fail",
          durationMs: 0,
          detail: bucketExists
            ? undefined
            : `Bucket "${BUCKET_NAME}" not found. Run prisma/create-storage-bucket.sql in Supabase SQL Editor.`,
        });

        // ── 2c. Check permissions (can we list objects in the bucket?) ──
        if (bucketExists) {
          const permStart = Date.now();
          try {
            const permResponse = await fetch(
              `${supabaseUrl}/storage/v1/object/list/${BUCKET_NAME}`,
              {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${serviceRoleKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ prefix: "", limit: 1 }),
                signal: AbortSignal.timeout(5000),
              }
            );
            permissionsOk = permResponse.ok || permResponse.status === 200;

            checks.push({
              name: "storage.permissions",
              status: permissionsOk ? "pass" : "fail",
              durationMs: Date.now() - permStart,
              detail: permissionsOk
                ? undefined
                : `Cannot list objects in bucket (HTTP ${permResponse.status})`,
            });
          } catch (err: any) {
            checks.push({
              name: "storage.permissions",
              status: "fail",
              durationMs: Date.now() - permStart,
              detail: `Error: ${err.message}`,
            });
          }
        }
      }
    } catch (err: any) {
      storageLatencyMs = Date.now() - reachStart;
      checks.push({
        name: "storage.reachable",
        status: "fail",
        durationMs: storageLatencyMs,
        detail: `Error: ${err.message}`,
      });
    }
  }

  // ── 3. Overall status ──
  const allPassed = checks.every((c) => c.status === "pass");
  const somePassed = checks.some((c) => c.status === "pass");
  const overallStatus = allPassed ? "ok" : somePassed ? "degraded" : "down";

  const totalDurationMs = Date.now() - startTime;

  logger.info("upload-health", "Health check completed", {
    status: overallStatus,
    durationMs: totalDurationMs,
    checks: checks.length,
  });

  return NextResponse.json({
    status: overallStatus,
    version: VERSION,
    timestamp: new Date().toISOString(),
    durationMs: totalDurationMs,
    environment: {
      supabaseUrl: !!supabaseUrl,
      serviceRoleKey: !!serviceRoleKey,
      anonKey: !!anonKey,
    },
    storage: {
      reachable: storageReachable,
      bucketExists,
      permissionsOk,
      latencyMs: storageLatencyMs,
      bucket: BUCKET_NAME,
    },
    checks,
  }, {
    status: overallStatus === "ok" ? 200 : overallStatus === "degraded" ? 200 : 503,
  });
}
