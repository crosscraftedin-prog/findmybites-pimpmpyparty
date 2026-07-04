"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  ClipboardList,
  MessageSquare,
  Calendar,
  BarChart3,
  Star,
  Settings,
  LogOut,
  ExternalLink,
  Sparkles,
  ChevronDown,
  MoreHorizontal,
  Package,
  Mail,
  Megaphone,
  LifeBuoy,
} from "lucide-react";
import { useMarketplace } from "@/lib/store";
import { useClaimAuth } from "@/hooks/use-claim-auth";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Vendor } from "@/lib/types";

export type DashboardTab =
  | "overview"
  | "listing"
  | "products"
  | "enquiries"
  | "messages"
  | "availability"
  | "analytics"
  | "marketing"
  | "billing"
  | "support"
  | "settings";

interface NavItem {
  id: DashboardTab;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "listing", label: "My Listing", icon: ClipboardList },
  { id: "products", label: "My Products", icon: Package },
  { id: "enquiries", label: "Enquiries", icon: MessageSquare },
  { id: "messages", label: "Messages", icon: Mail },
  { id: "availability", label: "Availability", icon: Calendar },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "billing", label: "Plan & Billing", icon: Star },
  { id: "support", label: "Support", icon: LifeBuoy },
  { id: "settings", label: "Settings", icon: Settings },
];

// Mobile bottom bar shows 5 main tabs; rest go in "More" drawer
const MOBILE_MAIN_TABS: DashboardTab[] = [
  "overview",
  "listing",
  "products",
  "enquiries",
  "availability",
];

interface SidebarProps {
  vendor: Vendor;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  userEmail: string;
}

export function Sidebar({ vendor, activeTab, onTabChange, userEmail }: SidebarProps) {
  const router = useRouter();
  const openAuthDialog = useMarketplace((s) => s.openAuthDialog);
  const { signOut } = useClaimAuth();
  const [moreOpen, setMoreOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const planName = vendor.featured ? "Featured" : "Free";

  return (
    <>
      {/* ── Desktop sidebar (240px fixed) ── */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
        {/* Vendor identity */}
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-3">
            <div className="size-12 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
              {vendor.avatarImage ? (
                <img
                  src={vendor.avatarImage}
                  alt={vendor.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-lg font-bold text-muted-foreground">
                  {vendor.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{vendor.name}</p>
              <Badge className="mt-0.5 border-0 bg-brand-soft text-[10px] text-brand-soft-foreground">
                {planName}
              </Badge>
            </div>
          </div>
          <button
            onClick={() => router.push(`/vendor/${vendor.slug}`)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            <ExternalLink className="size-3.5" />
            View my listing
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom: help + logout */}
        <div className="space-y-2 border-t border-border p-3">
          <div className="rounded-lg bg-brand-soft/50 p-3">
            <p className="text-xs font-medium text-brand-soft-foreground">
              Need help? Chat with Josh 👋
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Your AI event planner
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-card px-2 py-2 lg:hidden">
        {MOBILE_MAIN_TABS.map((tabId) => {
          const item = NAV_ITEMS.find((n) => n.id === tabId)!;
          const active = activeTab === tabId;
          return (
            <button
              key={tabId}
              onClick={() => onTabChange(tabId)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[10px] font-medium transition-colors",
                active ? "text-brand" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </button>
          );
        })}

        {/* More button → opens drawer with Analytics, Plan, Settings */}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[10px] font-medium transition-colors",
                ["analytics", "billing", "settings"].includes(activeTab)
                  ? "text-brand"
                  : "text-muted-foreground"
              )}
            >
              <MoreHorizontal className="size-5" />
              More
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="p-4">
            <SheetTitle className="mb-4 text-base font-bold">More options</SheetTitle>
            <div className="space-y-1">
              {(["analytics", "billing", "settings"] as DashboardTab[]).map((tabId) => {
                const item = NAV_ITEMS.find((n) => n.id === tabId)!;
                return (
                  <button
                    key={tabId}
                    onClick={() => {
                      onTabChange(tabId);
                      setMoreOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <item.icon className="size-5" />
                    {item.label}
                  </button>
                );
              })}
              <div className="my-2 border-t border-border" />
              <button
                onClick={() => {
                  router.push(`/vendor/${vendor.slug}`);
                  setMoreOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                <ExternalLink className="size-5" />
                View my listing
              </button>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="size-5" />
                Log out
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}
