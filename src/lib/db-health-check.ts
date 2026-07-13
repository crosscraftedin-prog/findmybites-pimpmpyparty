/**
 * Database Health Check — cached, non-blocking, production-safe.
 * ─────────────────────────────────────────────────────────────────────────
 * Verifies the production database has all critical columns and tables.
 *
 * Design:
 *   - Results cached for 60 seconds (avoids running on every request)
 *   - Never throws — returns a result object
 *   - Never exposes internal SQL or Prisma stack traces
 *   - Only exposed via GET /api/health/db
 */

import { db } from "@/lib/db";

const CRITICAL_VENDOR_COLUMNS = [
  "listingStatus", "businessSource", "adminCreated", "phone",
  "claimToken", "inviteStatus", "claimedAt", "aiSuggestions",
  "businessType", "ownership_status", "invite_type",
] as const;

const CRITICAL_TABLES = [
  "vendor_listings", "vendor_claims", "attributes",
  "vendor_attributes", "product_attributes", "marketplace_settings",
] as const;

export interface HealthCheckResult {
  healthy: boolean;
  prisma: boolean;
  missingTables: string[];
  missingColumns: string[];
}

// ── 60-second cache ────────────────────────────────────────────────────────
let _cachedResult: HealthCheckResult | null = null;
let _cachedAt = 0;
const CACHE_TTL_MS = 60_000;

/**
 * Verifies the database schema. Results are cached for 60 seconds.
 * Never throws — always returns a result object.
 */
export async function verifyDatabaseSchema(): Promise<HealthCheckResult> {
  // Return cached result if fresh
  if (_cachedResult && Date.now() - _cachedAt < CACHE_TTL_MS) {
    return _cachedResult;
  }

  const result: HealthCheckResult = {
    healthy: true,
    prisma: true,
    missingTables: [],
    missingColumns: [],
  };

  try {
    // Check tables
    const tables = await db.$queryRaw`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
    ` as { table_name: string }[];
    const tableSet = new Set(tables.map((t) => t.table_name));

    for (const table of CRITICAL_TABLES) {
      if (!tableSet.has(table)) {
        result.missingTables.push(table);
      }
    }

    // Check columns on vendor_listings
    const columns = await db.$queryRaw`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'vendor_listings' AND table_schema = 'public'
    ` as { column_name: string }[];
    const columnSet = new Set(columns.map((c) => c.column_name));

    for (const col of CRITICAL_VENDOR_COLUMNS) {
      if (!columnSet.has(col)) {
        result.missingColumns.push(col);
      }
    }

    if (result.missingColumns.length > 0 || result.missingTables.length > 0) {
      result.healthy = false;
    }
  } catch {
    // DB unreachable or query failed — don't expose the error
    result.healthy = false;
    result.prisma = false;
  }

  // Cache the result
  _cachedResult = result;
  _cachedAt = Date.now();

  return result;
}
