"use client";

import * as React from "react";
import Link from "next/link";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { useIsAdmin } from "@/hooks/use-is-admin";
import {
  Menu,
  Search,
  Sparkles,
  UtensilsCrossed,
  PartyPopper,
  X,
  Globe2,
  Compass,
  LayoutGrid,
  Star,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { EcosystemToggle } from "./ecosystem-toggle";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "@/components/auth/user-menu";
import { useMarketplace } from "@/lib/store";
import { ECOSYSTEM_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#explore", label: "Explore", icon: Compass },
  { href: "#categories", label: "Categories", icon: LayoutGrid },
  { href: "#featured", label: "Featured", icon: Star },
  { href: "#how-it-works", label: "How it works", icon: Sparkles },
];

export function SiteHeader() {
  const ecosystem = useMarketplace((s) => s.ecosystem);
  const setSearch = useMarketplace((s) => s.setSearch);
  const search = useMarketplace((s) => s.search);
  const openListVendor = useMarketplace((s) => s.openListVendor);
  const openAdmin = useMarketplace((s) => s.openAdmin);
  const openAuthDialog = useMarketplace((s) => s.openAuthDialog);
  const setAuthIntent = useMarketplace((s) => s.setAuthIntent);
  const { user: session } = useSupabaseSession();
  const { isAdmin } = useIsAdmin();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // gate an action behind auth: if signed in, run it; otherwise open the
  // sign-in dialog and run it after successful sign-in.
  const requireAuth = React.useCallback(
    (action: () => void) => {
      if (session) {
        action();
      } else {
        setAuthIntent(action);
        openAuthDialog();
      }
    },
    [session, setAuthIntent, openAuthDialog]
  );

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"
          : "border-b border-transparent bg-background/0"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="#top"
          className="flex shrink-0 items-center gap-2 font-bold tracking-tight"
        >
          <span className="relative flex items-center gap-1">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
              <UtensilsCrossed className="size-4" />
            </span>
            <span className="grid size-8 -ml-2 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-sm ring-2 ring-background">
              <PartyPopper className="size-4" />
            </span>
          </span>
          <span className="hidden text-[15px] leading-none sm:block">
            <span className="text-foreground">FindMyBites</span>
            <span className="mx-1 text-muted-foreground">×</span>
            <span className="text-foreground">PimpMyParty</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Search (desktop) */}
        <div className="relative ml-auto hidden max-w-xs flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${ECOSYSTEM_META[ecosystem].label}…`}
            className="h-9 rounded-full border-border bg-muted/50 pl-9 pr-3 text-sm"
          />
        </div>

        {/* Ecosystem toggle (desktop) */}
        <div className="hidden md:block">
          <EcosystemToggle size="sm" />
        </div>

        <ThemeToggle />

        <UserMenu />

        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => openAdmin()}
            aria-label="Admin panel"
            title="Admin panel"
          >
            <ShieldCheck className="size-4" />
          </Button>
        )}

        <Button
          size="sm"
          className="hidden bg-brand text-brand-foreground hover:bg-brand/90 sm:inline-flex"
          onClick={() => requireAuth(() => openListVendor())}
        >
          <Sparkles className="size-4" />
          List your business
        </Button>

        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-xs p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border p-4">
                <span className="font-bold">Menu</span>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" aria-label="Close">
                    <X className="size-5" />
                  </Button>
                </SheetClose>
              </div>
              <div className="flex flex-col gap-4 p-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Marketplace
                  </p>
                  <EcosystemToggle className="w-full" />
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search vendors, cities…"
                    className="h-10 rounded-lg border-border pl-9"
                  />
                </div>
                <nav className="flex flex-col gap-1">
                  {NAV_LINKS.map((l) => {
                    const Icon = l.icon;
                    return (
                      <SheetClose asChild key={l.href}>
                        <Link
                          href={l.href}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                        >
                          <Icon className="size-4 text-muted-foreground" />
                          {l.label}
                        </Link>
                      </SheetClose>
                    );
                  })}
                </nav>
                <SheetClose asChild>
                  <Button
                    className="bg-brand text-brand-foreground hover:bg-brand/90"
                    onClick={() => requireAuth(() => openListVendor())}
                  >
                    <Sparkles className="size-4" />
                    List your business
                  </Button>
                </SheetClose>
                {isAdmin && (
                  <SheetClose asChild>
                    <Button variant="outline" onClick={() => openAdmin()}>
                      <ShieldCheck className="size-4" />
                      Admin panel
                    </Button>
                  </SheetClose>
                )}
                <div className="mt-auto flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  <Globe2 className="size-4 shrink-0" />
                  Serving vendors & customers across 6 continents.
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
