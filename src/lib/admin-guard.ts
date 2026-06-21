import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_EMAILS } from "@/lib/constants";
import { NextResponse } from "next/server";

/**
 * Server-side admin guard. Call at the top of any /api/admin/* route handler.
 * Returns null if the current user is an admin, or a 401/403 NextResponse
 * if not authenticated / not authorized.
 *
 * Usage:
 *   const guard = await requireAdmin();
 *   if (guard) return guard; // unauthorized
 *   // ... admin logic here
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const isAdmin = ADMIN_EMAILS.some(
      (e) => e.toLowerCase() === session.user.email!.toLowerCase()
    );

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return null; // authorized
  } catch (err) {
    console.error("[requireAdmin] Auth check failed:", err);
    return NextResponse.json(
      { error: "Authentication check failed" },
      { status: 500 }
    );
  }
}
