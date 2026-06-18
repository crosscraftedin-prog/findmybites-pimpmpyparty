"use client";

import { useSupabaseSession } from "./use-supabase-session";
import { isAdminEmail } from "@/lib/constants";

/**
 * Returns true if the currently signed-in user is an admin (their email is in
 * ADMIN_EMAILS). Also returns the user so callers can build the avatar menu.
 */
export function useIsAdmin(): {
  isAdmin: boolean;
  loading: boolean;
} {
  const { user, loading } = useSupabaseSession();
  return {
    isAdmin: isAdminEmail(user?.email),
    loading,
  };
}
