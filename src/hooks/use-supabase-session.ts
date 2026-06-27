"use client";

import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * React hook that subscribes to the Supabase auth session. Returns:
 *  - session: the current Supabase session (or null)
 *  - user: the current user (or null)
 *  - loading: true until the initial session check completes
 *
 * If Supabase env vars are not configured, short-circuits to a logged-out
 * state (session: null, loading: false) without making any network calls,
 * so the rest of the UI can render normally.
 */
export function useSupabaseSession(): {
  session: Session | null;
  user: User | null;
  loading: boolean;
} {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(isSupabaseConfigured);

  React.useEffect(() => {
    // If Supabase isn't configured, don't attempt auth calls — just stay
    // logged out. This keeps preview environments (without env vars) working.
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let subscription: { unsubscribe: () => void } | null = null;

    // get the initial session
    supabaseBrowser.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // subscribe to auth changes (sign-in / sign-out)
    const {
      data: { subscription: sub },
    } = supabaseBrowser.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });
    subscription = sub;

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
  };
}
