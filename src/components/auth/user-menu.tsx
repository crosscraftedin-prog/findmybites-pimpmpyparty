"use client";

import * as React from "react";
import { Loader2, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Shows the signed-in vendor/admin avatar + dropdown (sign out).
 * Renders NOTHING when signed out — customers browse without an account.
 * Vendor sign-in is triggered only by "List your business" / "Edit" actions.
 * Admin sign-in is triggered by the admin shield button.
 */
export function UserMenu() {
  const { user, loading } = useSupabaseSession();

  // loading state — avoid flicker, but stay invisible (no spinner in header)
  if (loading || !user) return null;

  const name =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    user.email?.split("@")[0] ||
    "Vendor";
  const email = user.email ?? "";
  const image = user.user_metadata?.avatar_url as string | undefined;
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3 transition-colors hover:bg-accent"
          aria-label="Account menu"
        >
          {image ? (
            <img
              src={image}
              alt={name}
              className="size-7 rounded-full object-cover"
            />
          ) : (
            <span className="grid size-7 place-items-center rounded-full bg-brand text-xs font-bold text-brand-foreground">
              {initials || "V"}
            </span>
          )}
          <span className="hidden max-w-[100px] truncate text-sm font-medium sm:inline">
            {name}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-semibold">{name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => supabaseBrowser.auth.signOut()}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
