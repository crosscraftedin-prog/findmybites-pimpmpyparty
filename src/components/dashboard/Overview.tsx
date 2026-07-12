"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SupportWidget } from "@/components/support/support-widget";
import {
  Eye,
  MessageSquare,
  Star,
  MapPin,
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowRight,
  TrendingUp,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import type { Vendor, Booking } from "@/lib/types";
import type { DashboardTab } from "./Sidebar";

interface OverviewProps {
  vendor: Vendor;
  bookings: (Booking & { vendorName: string })[];
  onNavigate: (tab: DashboardTab) => void;
}

export function Overview({ vendor, bookings, onNavigate }: OverviewProps) {
  const router = useRouter();
  const [showUpgrade, setShowUpgrade] = React.useState(false);

  // Profile completion checklist — comprehensive with "why it matters"
  const checklist = [
    { label: "Add Logo", why: "Brands your listing on cards & search", done: !!vendor.avatarImage, tab: "listing" as DashboardTab },
    { label: "Add Banner", why: "Eye-catching header on your profile page", done: !!vendor.heroImage, tab: "listing" as DashboardTab },
    { label: "Add Gallery", why: "Show your work — 3+ photos recommended", done: vendor.gallery.length >= 3, tab: "listing" as DashboardTab },
    { label: "Verify WhatsApp", why: "Customers contact you directly", done: !!vendor.whatsapp, tab: "listing" as DashboardTab },
    { label: "Add Pricing", why: "Customers filter by budget — show your range", done: !!vendor.basePrice && vendor.basePrice > 0, tab: "listing" as DashboardTab },
    { label: "Add Products", why: "Products get 3x more enquiries", done: (vendor as any).productCount > 0, tab: "products" as DashboardTab },
    { label: "Add Business Hours", why: "Customers know when you're available", done: !!vendor.openHours, tab: "availability" as DashboardTab },
    { label: "Add Delivery Area", why: "Appear in location-based searches", done: !!(vendor as any).serviceRadiusKm, tab: "listing" as DashboardTab },
    { label: "Add Instagram", why: "Showcase your work and build trust", done: !!vendor.instagram, tab: "listing" as DashboardTab },
    { label: "Add Website", why: "Drive traffic to your own site", done: !!vendor.website, tab: "listing" as DashboardTab },
    { label: "Add Tags", why: "Improve search visibility & SEO", done: vendor.tags.length >= 3, tab: "listing" as DashboardTab },
    { label: "Add SEO Meta", why: "Help Google index your page", done: !!(vendor as any).metaDescription, tab: "listing" as DashboardTab },
  ];
  const completedCount = checklist.filter((c) => c.done).length;
  const completionPct = Math.round((completedCount / checklist.length) * 100);

  // Stats (using real data where available, placeholder for views/searches)
  const enquiryCount = bookings.length;
  const newEnquiries = bookings.filter((b) => b.status === "pending").length;
  const isFreePlan = !vendor.featured;

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      {/* ── A) Welcome banner + Business Status ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Welcome back, {vendor.name}! 👋
        </h1>
        {/* Business Status + Plan Badge */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold",
            vendor.approved
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          )}>
            {vendor.approved ? (
              <>
                <CheckCircle2 className="size-4" />
                Business Live
              </>
            ) : (
              <>
                <Circle className="size-4" />
                Pending Approval
              </>
            )}
          </div>
          {/* Free Plan badge */}
          {isFreePlan ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">
              🟢 Free Plan
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-700">
              ⭐ Pro Plan
            </span>
          )}
        </div>
        {isFreePlan ? (
          <div className="mt-4 rounded-xl border border-brand-border bg-brand-soft p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Sparkles className="size-5 shrink-0 text-brand" />
                <div>
                  <p className="text-sm font-semibold text-brand-soft-foreground">
                    You&apos;re on the Free plan — upgrade to get priority placement and AI-powered suggestions
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setShowUpgrade(true)}
                className="shrink-0 bg-brand text-brand-foreground hover:bg-brand/90"
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-800">
              ✓ Featured plan active — your listing is live and getting priority placement
            </p>
          </div>
        )}
      </div>

      {/* ── B) Profile completion ── */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-bold">Complete your profile to get more customers</h2>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <span className="text-sm font-bold tabular-nums">{completionPct}%</span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {checklist.map((item) => (
            <button
              key={item.label}
              onClick={() => onNavigate(item.tab)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                item.done ? "border-transparent bg-emerald-50/50 text-foreground dark:bg-emerald-950/10" : "border-border bg-card text-foreground"
              )}
            >
              {item.done ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground/40" />
              )}
              <div className="min-w-0 flex-1">
                <div className="font-medium">{item.label}</div>
                {!item.done && <div className="text-[11px] text-muted-foreground">{item.why}</div>}
              </div>
              {!item.done && (
                <span className="shrink-0 text-[11px] font-medium text-brand">
                  + Add
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Recommended next step */}
        {completionPct < 70 && (() => {
          const nextItem = checklist.find((c) => !c.done);
          if (!nextItem) return null;
          return (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-brand-border bg-brand-soft/30 p-3">
              <div>
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">Recommended Next Step</p>
                <p className="text-sm font-medium">{nextItem.label}</p>
                <p className="text-xs text-muted-foreground">{nextItem.why}</p>
              </div>
              <Button size="sm" className="shrink-0 gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => onNavigate(nextItem.tab)}>
                <Plus className="size-3.5" /> Add
              </Button>
            </div>
          );
        })()}
      </div>

      {/* ── C) Stats cards ── */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Eye}
          label="Profile Views"
          value="0"
          subtext="This month"
        />
        <StatCard
          icon={MessageSquare}
          label="Enquiries"
          value={String(enquiryCount)}
          subtext="Total received"
          badge={newEnquiries > 0 ? `${newEnquiries} new` : undefined}
        />
        <StatCard
          icon={Star}
          label="Avg Rating"
          value={vendor.rating.toFixed(1)}
          subtext={`From ${vendor.reviewCount} reviews`}
        />
        <StatCard
          icon={MapPin}
          label="Search Appearances"
          value="0"
          subtext="Times shown this month"
        />
      </div>

      {/* Recent activity feed */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-base font-bold">Recent activity</h2>
        {bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center gap-3 text-sm">
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                  <MessageSquare className="size-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    New enquiry from {b.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {b.eventType} · {b.guests} guests · {new Date(b.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              No activity yet. Share your listing to start getting enquiries!
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => router.push(`/vendor/${vendor.slug}`)}
            >
              View my listing
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Subscription modal */}
      <SubscriptionModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        vendorCountry={vendor.countryCode || "US"}
        vendorBrand={vendor.ecosystem === "FINDMYBITES" ? "food" : "party"}
        currentPlan={vendor.featured ? "pro" : "free"}
        vendorId={vendor.id}
        vendorEmail={vendor.userEmail || undefined}
        vendorName={vendor.name}
        onSelectPlan={() => setShowUpgrade(false)}
      />

      {/* Support widget */}
      <div className="mt-6">
        <SupportWidget onNavigate={(tab) => onNavigate(tab as DashboardTab)} />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext: string;
  badge?: string;
}) {
  return (
    <div className="relative rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <Icon className="size-5 text-muted-foreground" />
        {badge && (
          <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-brand-foreground">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-extrabold tabular-nums">{value}</p>
      <p className="text-xs font-medium">{label}</p>
      <p className="text-[10px] text-muted-foreground">{subtext}</p>
    </div>
  );
}
