"use client";

import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * React hook that subscribes to the Supabase auth session. Returns:
 *  - session: the current Supabase session (or null)
 *  - user: the current user (or null)
 *  - loading: true until the initial session check completes
 *
 * Replaces the old `useSession` from NextAuth.
 */
export function useSupabaseSession(): {
  session: Session | null;
  user: User | null;
  loading: boolean;
} {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // get the initial session
    supabaseBrowser.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // subscribe to auth changes (sign-in / sign-out)
    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
  };
}
