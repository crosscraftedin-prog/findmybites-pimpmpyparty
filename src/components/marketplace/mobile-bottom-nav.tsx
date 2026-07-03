"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MobileBottomNav — fixed bottom navigation for mobile.
 * Shows on screens < lg (1024px).
 * Links: Home, Search, Wishlist, Bookings, Account.
 */
export function MobileBottomNav() {
  const pathname = usePathname();

  // Don't show on admin or dashboard (those have their own nav)
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/dashboard")) {
    return null;
  }

  const items = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/#explore", icon: Search, label: "Search" },
    { href: "/account", icon: Heart, label: "Saved" },
    { href: "/account", icon: Calendar, label: "Bookings" },
    { href: "/account", icon: User, label: "Account" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {items.map((item, i) => {
        const Icon = item.icon;
        const isActive = i === 0 ? pathname === "/" : pathname?.startsWith(item.href.replace("/#", ""));
        return (
          <Link
            key={i}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors",
              isActive ? "text-brand" : "text-muted-foreground"
            )}
          >
            <Icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
