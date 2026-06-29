"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useVendorDashboard } from "@/lib/queries";
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
  LayoutDashboard,
  LogIn,
  Edit3,
  Loader2,
  Clock,
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
];

export function SiteHeader() {
  const router = useRouter();
  const ecosystem = useMarketplace((s) => s.ecosystem);
  const setSearch = useMarketplace((s) => s.setSearch);
  const search = useMarketplace((s) => s.search);
  const openListVendor = useMarketplace((s) => s.openListVendor);
  const openAdmin = useMarketplace((s) => s.openAdmin);
  const openAuthDialog = useMarketplace((s) => s.openAuthDialog);
  const setAuthIntent = useMarketplace((s) => s.setAuthIntent);
  const { user: session, loading: sessionLoading } = useSupabaseSession();
  const { isAdmin } = useIsAdmin();
  // Check if this user already has a vendor listing
  const { data: vendorData, isLoading: vendorLoading } = useVendorDashboard(!!session && !sessionLoading);
  const authChecking = sessionLoading || (!!session && vendorLoading);
  const hasVendor = (vendorData?.vendors?.length ?? 0) > 0;
  const vendorSlug = vendorData?.vendors?.[0]?.slug ?? null;
  const vendorApproved = vendorData?.vendors?.[0]?.approved ?? false;
  const vendorName = vendorData?.vendors?.[0]?.name ?? null;
  const vendorEmail = vendorData?.vendors?.[0]?.userEmail ?? null;
  // Vendor states: approved (show dashboard), pending (show "under review"), rejected (show "resubmit")
  const isPendingVendor = hasVendor && !vendorApproved;
  const isApprovedVendor = hasVendor && vendorApproved;
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // gate an action behind auth: if signed in, run it; otherwise store the
  // intent (as a string in localStorage so it survives the Google OAuth
  // page reload) and open the sign-in dialog.
  const requireAuth = React.useCallback(
    (intent: string, action: () => void) => {
      if (session) {
        action();
      } else {
        setAuthIntent(intent);
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
      suppressHydrationWarning
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"
          : "border-b border-transparent bg-background/0"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
        {/* Logo — plain <a> instead of <Link> to avoid Next.js Link prefetch
            handler hydration mismatch (onClick/onMouseEnter/onTouchStart) */}
        <a
          href="/"
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
        </a>

        {/* Desktop nav — plain <a> tags (hash links, no Link prefetch handlers) */}
        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

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

        {/* Auth-aware button: Checking → Dashboard → List your business */}
        {authChecking ? (
          <Button
            size="sm"
            disabled
            className="hidden bg-muted text-muted-foreground lg:inline-flex"
          >
            <Loader2 className="size-4 animate-spin" />
            <span className="hidden lg:inline">Checking…</span>
          </Button>
        ) : session && isApprovedVendor ? (
          <Button
            size="sm"
            className="hidden bg-brand text-brand-foreground hover:bg-brand/90 lg:inline-flex"
            onClick={() => router.push("/dashboard")}
          >
            <LayoutDashboard className="size-4" />
            My Dashboard
          </Button>
        ) : session && isPendingVendor ? (
          <Button
            size="sm"
            variant="outline"
            className="hidden border-amber-400/50 text-amber-700 lg:inline-flex"
            disabled
          >
            <Clock className="size-4" />
            Listing under review 🕐
          </Button>
        ) : session ? (
          <Button
            size="sm"
            className="hidden bg-brand text-brand-foreground hover:bg-brand/90 lg:inline-flex"
            onClick={() => requireAuth("list-vendor", () => openListVendor())}
          >
            <Sparkles className="size-4" />
            List your business
          </Button>
        ) : (
          <Button
            size="sm"
            className="hidden bg-brand text-brand-foreground hover:bg-brand/90 lg:inline-flex"
            onClick={() => requireAuth("vendor-login", () => router.push("/dashboard"))}
          >
            <LogIn className="size-4" />
            <span className="hidden lg:inline">Vendor Login</span>
          </Button>
        )}

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
                {/* Dashboard / List business / Vendor Login — mobile (auth-aware) */}
                {authChecking ? (
                  <Button disabled className="bg-muted text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Checking…
                  </Button>
                ) : session && isApprovedVendor ? (
                  <SheetClose asChild>
                    <Button
                      className="bg-brand text-brand-foreground hover:bg-brand/90"
                      onClick={() => router.push("/dashboard")}
                    >
                      <LayoutDashboard className="size-4" />
                      My Dashboard
                    </Button>
                  </SheetClose>
                ) : session && isPendingVendor ? (
                  <SheetClose asChild>
                    <Button
                      variant="outline"
                      className="border-amber-400/50 text-amber-700"
                      disabled
                    >
                      <Clock className="size-4" />
                      Listing under review 🕐
                    </Button>
                  </SheetClose>
                ) : session ? (
                  <SheetClose asChild>
                    <Button
                      className="bg-brand text-brand-foreground hover:bg-brand/90"
                      onClick={() => requireAuth("list-vendor", () => openListVendor())}
                    >
                      <Sparkles className="size-4" />
                      List your business
                    </Button>
                  </SheetClose>
                ) : (
                  <SheetClose asChild>
                    <Button
                      className="bg-brand text-brand-foreground hover:bg-brand/90"
                      onClick={() => requireAuth("vendor-login", () => router.push("/dashboard"))}
                    >
                      <LogIn className="size-4" />
                      Vendor Login
                    </Button>
                  </SheetClose>
                )}
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
