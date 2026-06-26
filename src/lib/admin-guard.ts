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

    // Use getUser() instead of getSession() — it verifies the JWT with
    // Supabase's auth server, which is more reliable on Vercel serverless
    // functions where cookies may not propagate correctly.
    let email: string | null = null;
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (!userErr && user?.email) {
        email = user.email;
      }
    } catch {}

    // Fallback to getSession() if getUser() failed
    if (!email) {
      const { data: { session } } = await supabase.auth.getSession();
      email = session?.user?.email ?? null;
    }

    if (!email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const isAdmin = ADMIN_EMAILS.some(
      (e) => e.toLowerCase() === email!.toLowerCase()
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
