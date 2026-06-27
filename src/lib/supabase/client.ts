"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Uses the public anon key (safe to expose).
 * Used for: Google OAuth sign-in, session management, and reading the
 * current user on the client.
 *
 * If the Supabase env vars are not configured (e.g. local preview without
 * a .env.local), we fall back to placeholder values so the module still
 * loads and the rest of the app can render. Auth features simply won't
 * work until the real keys are provided. Check `isSupabaseConfigured`
 * before relying on auth.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabaseBrowser = createBrowserClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY || "placeholder-anon-key"
);
