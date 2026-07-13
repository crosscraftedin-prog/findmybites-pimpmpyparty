/**
 * Prisma Migration Health Check
 * ─────────────────────────────────────────────────────────────────────────
 * Startup health check that verifies the production database schema is
 * compatible with the Prisma schema the application was built with.
 *
 * How it works:
 *   1. On application startup, runs a lightweight query checking for the
 *      existence of critical columns that must exist for the app to function.
 *   2. If any critical column is missing, throws a clear error that explains
 *      exactly which migration needs to be run.
 *   3. This prevents runtime Prisma errors (like "column listingStatus does
 *      not exist") and gives a actionable error message instead.
 *
 * Usage (in src/app/layout.tsx or a server component):
 *   import { verifyDatabaseSchema } from "@/lib/db-health-check";
 *   await verifyDatabaseSchema();
 */

import { db } from "@/lib/db";

// Critical columns that MUST exist on vendor_listings for the app to work.
// If any of these are missing, the app will crash at runtime with cryptic
// Prisma errors. This health check catches the problem early with a clear
// error message.
const CRITICAL_VENDOR_COLUMNS = [
  "listingStatus",
  "businessSource",
  "adminCreated",
  "phone",
  "claimToken",
  "inviteStatus",
  "claimedAt",
  "aiSuggestions",
  "businessType",
  "ownership_status",
  "invite_type",
  "openHours",
  "deliveryAvailable",
  "pickupAvailable",
  "metaTitle",
  "metaDescription",
  "latitude",
  "longitude",
  "serviceRadiusKm",
  "userEmail",
  "owner_user_id",
];

// Tables that MUST exist for the app to work
const CRITICAL_TABLES = [
  "vendor_listings",
  "vendor_claims",
  "attributes",
  "vendor_attributes",
  "product_attributes",
  "marketplace_settings",
];

export interface HealthCheckResult {
  healthy: boolean;
  missingColumns: string[];
  missingTables: string[];
  error?: string;
}

/**
 * Verifies that the production database has all critical columns and tables.
 * Returns a health check result — does NOT throw (caller decides what to do).
 */
export async function verifyDatabaseSchema(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    healthy: true,
    missingColumns: [],
    missingTables: [],
  };

  // 1. Check critical tables exist
  try {
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
  } catch (err) {
    // If we can't even query information_schema, the DB is unreachable
    result.healthy = false;
    result.error = "Database unreachable — cannot verify schema";
    return result;
  }

  // 2. Check critical columns on vendor_listings
  try {
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
  } catch (err) {
    result.healthy = false;
    result.error = "Cannot query vendor_listings columns — table may not exist";
    return result;
  }

  if (result.missingColumns.length > 0 || result.missingTables.length > 0) {
    result.healthy = false;
    result.error = buildErrorMessage(result);
  }

  return result;
}

function buildErrorMessage(result: HealthCheckResult): string {
  const parts: string[] = ["DATABASE SCHEMA MISMATCH DETECTED"];

  if (result.missingTables.length > 0) {
    parts.push(`Missing tables: ${result.missingTables.join(", ")}`);
  }

  if (result.missingColumns.length > 0) {
    parts.push(`Missing columns on vendor_listings: ${result.missingColumns.join(", ")}`);
  }

  parts.push("");
  parts.push("FIX: Run the latest migration on the production database:");
  parts.push("  psql \"$DATABASE_URL\" -f prisma/migrations/sync-production-schema.sql");
  parts.push("");
  parts.push("Or if using Prisma migrate:");
  parts.push("  bun run db:deploy");
  parts.push("");
  parts.push("The application cannot start safely until the schema is in sync.");

  return parts.join("\n");
}

/**
 * Hard check — throws if schema is out of sync.
 * Use this in server startup paths where you want to fail fast.
 */
export async function assertDatabaseSchema(): Promise<void> {
  const result = await verifyDatabaseSchema();
  if (!result.healthy) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error(result.error);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    throw new Error(result.error || "Database schema verification failed");
  }
}
