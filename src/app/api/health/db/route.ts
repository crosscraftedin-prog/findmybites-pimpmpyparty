import { NextResponse } from "next/server";
import { verifyDatabaseSchema } from "@/lib/db-health-check";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/constants";

/**
 * GET /api/health/db
 * ─────────────────────────────────────────────────────────────────────────
 * Public: returns only { healthy: true/false } — no internal details.
 * Admin:  returns full diagnostics (missingTables, missingColumns) when
 *         authenticated as admin.
 *
 * Cached 60 seconds server-side. Never blocks production requests.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const result = await verifyDatabaseSchema();

  // Check if the caller is an admin (for detailed diagnostics)
  let isAdmin = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    isAdmin = !!user && isAdminEmail(user.email);
  } catch { /* not authenticated — public response */ }

  if (!result.healthy) {
    // Public: only show healthy=false
    // Admin: show full details
    return NextResponse.json(
      isAdmin ? result : { healthy: false },
      { status: 503 }
    );
  }

  // Healthy — same response for everyone
  return NextResponse.json(
    isAdmin ? result : { healthy: true }
  );
}
