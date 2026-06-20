"use client";

import * as React from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useSupabaseSession } from "./use-supabase-session";

/**
 * Hook for the Claim My Business feature.
 * Wraps the existing useSupabaseSession + fetches the user's profile
 * from the `profiles` table (created by supabase_addon.sql).
 *
 * Returns:
 *  - session, user (from existing hook)
 *  - profile: the user's profile row (role, full_name, etc.)
 *  - role: 'customer' | 'vendor' | 'admin' | null
 *  - isAdmin, isVendor: convenience booleans
 *  - loading: true while session + profile are loading
 *  - refreshProfile(): re-fetch the profile
 *  - signOut(): sign out of Supabase
 */
export function useClaimAuth() {
  const { session, user, loading: sessionLoading } = useSupabaseSession();
  const [profile, setProfile] = React.useState<any>(null);
  const [profileLoading, setProfileLoading] = React.useState(true);

  const loadProfile = React.useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    try {
      const { data, error } = await supabaseBrowser
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (!error) setProfile(data);
    } catch {
      // Profile table may not exist yet (SQL not run)
    }
    setProfileLoading(false);
  }, []);

  React.useEffect(() => {
    if (!sessionLoading) {
      loadProfile(user?.id);
    }
  }, [user?.id, sessionLoading, loadProfile]);

  const refreshProfile = async () => {
    if (user?.id) await loadProfile(user.id);
  };

  const signOut = async () => {
    await supabaseBrowser.auth.signOut();
    setProfile(null);
  };

  const role = profile?.role ?? null;

  return {
    session,
    user,
    profile,
    role,
    isAdmin: role === "admin",
    isVendor: role === "vendor",
    loading: sessionLoading || profileLoading,
    refreshProfile,
    signOut,
  };
}
