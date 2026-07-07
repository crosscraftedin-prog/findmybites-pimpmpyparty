/**
 * Shared auth helper for API routes.
 *
 * Uses getUser() first (verifies JWT with Supabase server — more reliable
 * on Vercel serverless), then falls back to getSession() (reads from cookies).
 *
 * This is the SAME pattern used by resolveVendorFromSession() but extracted
 * as a standalone function so routes that need just the userId (without
 * looking up the vendor) can use it without importing the full vendor-session
 * module.
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AuthResult {
  userId: string;
  userEmail: string | null;
}

/**
 * Resolve the authenticated user from the Supabase session.
 * Returns null if not authenticated.
 *
 * Tries getUser() first (JWT verification), then getSession() (cookie).
 */
export async function getAuthenticatedUser(): Promise<AuthResult | null> {
  try {
    const supabase = await createSupabaseServerClient();

    // Step 1: Try getUser()
    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (!userErr && user?.id) {
        userId = user.id;
        userEmail = user.email ?? null;
      }
    } catch {}

    // Step 2: Fallback to getSession()
    if (!userId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          userId = session.user.id;
          userEmail = session.user.email ?? null;
        }
      } catch {}
    }

    if (!userId) return null;
    return { userId, userEmail };
  } catch {
    return null;
  }
}
