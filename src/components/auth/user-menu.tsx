"use client";

import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Loader2, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMarketplace } from "@/lib/store";

export function UserMenu() {
  const { data: session, status } = useSession();
  const openAuthDialog = useMarketplace((s) => s.openAuthDialog);

  // loading state — avoid flicker
  if (status === "loading") {
    return (
      <Button variant="ghost" size="icon" disabled aria-label="Loading session">
        <Loader2 className="size-4 animate-spin" />
      </Button>
    );
  }

  // signed out → show "Sign in" button
  if (!session?.user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => openAuthDialog()}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <UserCircle2 className="size-4" />
        <span className="hidden sm:inline">Sign in</span>
      </Button>
    );
  }

  const name = session.user.name ?? "Vendor";
  const email = session.user.email ?? "";
  const image = session.user.image;
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
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
