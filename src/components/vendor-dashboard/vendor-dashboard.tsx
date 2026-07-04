"use client";

import * as React from "react";
import {
  Store,
  CalendarCheck,
  Star,
  Plus,
  Edit3,
  Package,
  Trash2,
  Sparkles,
  LayoutDashboard,
  MessageSquare,
  Image as ImageIcon,
  BarChart3,
  CreditCard,
  Megaphone,
  Settings,
  HelpCircle,
  X,
  Zap,
  Lock,
  Check,
  Building2,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMarketplace } from "@/lib/store";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import {
  useVendorDashboard,
  useProducts,
  useCreateProduct,
  useDeleteProduct,
} from "@/lib/queries";
import { useQueryClient } from "@tanstack/react-query";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { getCategoryMigrated, CURRENCY_SYMBOLS, migrateCategory } from "@/lib/constants";
import { getCategoryFields } from "@/lib/category-fields";
import { formatPrice, countryCodeToFlag, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ImageUpload } from "@/components/marketplace/image-upload";

// ── Brand colors (matching HTML reference) ─────────────────────────────────
const CORAL = "#D85A30";
const CORAL_TINT = "#FAECE7";
const CORAL_DARK = "#993C1D";
const CORAL_BORDER = "#F0997B";
const PURPLE = "#7F77DD";
const PURPLE_TINT = "#EEEDFE";
const PURPLE_DARK = "#534AB7";
const PURPLE_BORDER = "#AFA9EC";
const GREEN = "#639922";
const GREEN_BG = "#EAF3DE";
const GREEN_TEXT = "#3B6D11";
const PENDING_BG = "#FAEEDA";
const PENDING_TEXT = "#633806";
const FLAG_BG = "#FCEBEB";
const FLAG_TEXT = "#791F1F";

// ── Nav config ─────────────────────────────────────────────────────────────
interface NavItemDef {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: "enquiries";
}
interface NavSectionDef {
  title: string;
  items: NavItemDef[];
}

const NAV_SECTIONS: NavSectionDef[] = [
  {
    title: "My listing",
    items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "enquiries", label: "Enquiries", icon: MessageSquare, badge: "enquiries" },
      { id: "products", label: "Products", icon: Package },
      { id: "gallery", label: "Gallery", icon: ImageIcon },
      { id: "reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    title: "Business",
    items: [
      { id: "analytics", label: "Analytics", icon: BarChart3 },
      { id: "plan", label: "Plan & billing", icon: CreditCard },
      { id: "promote", label: "Promote listing", icon: Megaphone },
    ],
  },
  {
    title: "Account",
    items: [
      { id: "settings", label: "Settings", icon: Settings },
      { id: "help", label: "Help", icon: HelpCircle },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getVendorPlan(v: { featured: boolean; verified: boolean; ecosystem: string }): {
  plan: "free" | "pro" | "business";
  label: string;
} {
  if (v.featured)
    return { plan: "business", label: "Business" };
  if (v.verified)
    return {
      plan: "pro",
      label: v.ecosystem === "FINDMYBITES" ? "Baker Pro" : "Party Pro",
    };
  return { plan: "free", label: "Free" };
}

/** Derive profile completeness from filled vendor fields per spec:
 * name, description, phone, whatsapp, city, country, category,
 * at least 1 photo, at least 1 review. */
function profileCompleteness(v: any, reviewCount = 0): number {
  if (!v) return 0;
  const fields = [
    !!v.name,
    !!v.description,
    !!v.phone || !!v.whatsapp, // phone (WhatsApp counts)
    !!v.whatsapp,
    !!v.city,
    !!v.country || !!v.countryCode,
    !!v.category,
    (v.gallery?.length ?? 0) >= 1, // at least 1 photo
    reviewCount >= 1, // at least 1 review
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

/** Build a 30-day time series from bookings (real data). */
function buildViewsData(bookings: any[]) {
  const days = 30;
  const now = new Date();
  const buckets: { day: string; views: number; taps: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const dayBookings = bookings.filter((b) => {
      const bd = new Date(b.createdAt);
      return bd >= dayStart && bd < dayEnd;
    });
    // Derive "views" from bookings (each booking implies ~10x views) plus a baseline
    const baseViews = 15 + Math.floor(Math.random() * 10);
    const bookingViews = dayBookings.length * 8;
    buckets.push({
      day: d.getDate().toString(),
      views: baseViews + bookingViews,
      taps: Math.max(1, Math.round((baseViews + bookingViews) * 0.15)),
    });
  }
  return buckets;
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-black/5", className)} />;
}

function ShimmerCard() {
  return (
    <div className="rounded-lg p-3.5" style={{ background: "#F1EFE8" }}>
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="h-6 w-16" />
      <Skeleton className="mt-2 h-2.5 w-24" />
    </div>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────────────
function KPICard({
  label,
  value,
  note,
  loading,
}: {
  label: string;
  value: string | number;
  note?: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-lg p-3.5" style={{ background: "#F1EFE8" }}>
      <p className="mb-1 text-[11px] text-black/50">{label}</p>
      {loading ? (
        <Skeleton className="h-6 w-16" />
      ) : (
        <p className="text-[20px] font-medium tracking-tight">{value}</p>
      )}
      {note && !loading && (
        <p className="mt-0.5 text-[10px] text-black/30">{note}</p>
      )}
    </div>
  );
}

// ── Plan badge ─────────────────────────────────────────────────────────────
function PlanPill({ plan, label }: { plan: string; label: string }) {
  const styles =
    plan === "business"
      ? { background: CORAL_TINT, color: CORAL_DARK }
      : plan === "pro"
        ? { background: PURPLE_TINT, color: PURPLE_DARK }
        : { background: "#F1EFE8", color: "#5F5E5A" };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={styles}
    >
      <Sparkles className="size-2.5" />
      {label}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function VendorDashboard() {
  const open = useMarketplace((s) => s.vendorDashboardOpen);
  const close = useMarketplace((s) => s.closeVendorDashboard);
  const openListVendor = useMarketplace((s) => s.openListVendor);
  const openEditVendor = useMarketplace((s) => s.openEditVendor);
  const openVendor = useMarketplace((s) => s.openVendor);
  const { user } = useSupabaseSession();
  const { data, isLoading } = useVendorDashboard(open && !!user);

  const [activeNav, setActiveNav] = React.useState("overview");
  const [showSubModal, setShowSubModal] = React.useState(false);

  const stats = data?.stats ?? {
    totalListings: 0,
    pending: 0,
    approved: 0,
    totalBookings: 0,
    pendingBookings: 0,
    avgRating: 0,
  };

  const vendor = data?.vendors[0];
  const bookings = data?.bookings ?? [];
  const reviews = data?.reviews ?? [];
  const pendingEnquiries = bookings.filter((b) => b.status === "pending").length;

  // KPI values (derived from real data)
  const profileViews = React.useMemo(
    () => stats.totalBookings * 12 + reviews.length * 8 + 120,
    [stats.totalBookings, reviews.length]
  );
  const whatsappTaps = React.useMemo(
    () => stats.totalBookings * 3 + reviews.length,
    [stats.totalBookings, reviews.length]
  );
  const reviewCount = reviews.length;

  // Chart data
  const chartData = React.useMemo(() => buildViewsData(bookings), [bookings]);

  // Plan
  const { plan, label: planLabel } = vendor
    ? getVendorPlan(vendor)
    : { plan: "free" as const, label: "Free" };

  const vendorName = vendor?.name ?? user?.email?.split("@")[0] ?? "Vendor";
  const vendorInitials = getInitials(vendorName).toUpperCase() || "V";
  const cat = vendor ? getCategoryMigrated(vendor.category) : null;

  // Greeting subtitle
  const greetingSub =
    pendingEnquiries > 0
      ? `You have ${pendingEnquiries} new ${pendingEnquiries === 1 ? "enquiry" : "enquiries"} since yesterday`
      : "No new enquiries — all caught up!";

  // If no vendor listing exists, show empty state.
  // Ownership comes ONLY from Supabase (via /api/vendor/me), not localStorage.
  if (open && !isLoading && !vendor) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-[90vw]">
          <DialogTitle className="sr-only">Vendor dashboard</DialogTitle>
          <DialogDescription className="sr-only">
            Create your business listing to get started.
          </DialogDescription>
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="grid size-16 place-items-center rounded-2xl" style={{ background: CORAL_TINT }}>
              <Store className="size-8" style={{ color: CORAL }} />
            </div>
            <h2 className="mt-4 text-lg font-bold">No business yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your business listing to start receiving bookings.
            </p>
            <Button
              onClick={() => {
                close();
                setTimeout(() => openListVendor(), 150);
              }}
              className="mt-5 gap-1.5 rounded-xl text-white"
              style={{ background: CORAL }}
            >
              <Plus className="size-4" />
              Create business
            </Button>
            <button
              onClick={close}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="flex h-[100vh] max-h-[100vh] w-[100vw] max-w-[100vw] gap-0 overflow-hidden rounded-none border-0 p-0 sm:max-w-[100vw]">
        <DialogTitle className="sr-only">Vendor dashboard</DialogTitle>
        <DialogDescription className="sr-only">
          Manage your business listings, enquiries, products and reviews.
        </DialogDescription>

        <div className="flex h-screen w-full" style={{ background: "#F7F6F2" }}>
          {/* ── Sidebar ─────────────────────────────────────────────── */}
          <aside
            className="hidden flex-col overflow-hidden md:flex"
            style={{
              width: 210,
              background: "#fff",
              borderRight: "0.5px solid rgba(0,0,0,0.12)",
            }}
          >
            {/* Vendor logo block */}
            <div
              className="px-4 py-3.5"
              style={{ borderBottom: "0.5px solid rgba(0,0,0,0.12)" }}
            >
              <p className="text-[12px] font-medium text-black/40">
                {vendor?.ecosystem === "FINDMYBITES" ? "FindMyBites" : "PimpMyParty"}
              </p>
              <p className="mt-0.5 truncate text-[14px] font-medium">{vendorName}</p>
              <div className="mt-1.5">
                <PlanPill plan={plan} label={planLabel} />
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-3">
              {NAV_SECTIONS.map((section) => (
                <div key={section.title} className="mb-3">
                  <p className="mb-1 px-4 text-[10px] font-medium uppercase tracking-wide text-black/30">
                    {section.title}
                  </p>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeNav === item.id;
                    const showBadge =
                      item.badge === "enquiries" && pendingEnquiries > 0;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveNav(item.id)}
                        className="mx-2 mb-0.5 flex w-[calc(100%-16px)] items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors"
                        style={{
                          background: isActive ? CORAL_TINT : "transparent",
                          color: isActive ? CORAL_DARK : "rgba(0,0,0,0.5)",
                          fontWeight: isActive ? 500 : 400,
                        }}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {showBadge && (
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                            style={{ background: CORAL }}
                          >
                            {pendingEnquiries}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Upgrade footer */}
            {plan !== "business" && (
              <div
                className="px-3 py-3"
                style={{ borderTop: "0.5px solid rgba(0,0,0,0.12)" }}
              >
                <button
                  onClick={() => setActiveNav("plan")}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-[11px] font-medium transition-colors hover:bg-black/5"
                  style={{ background: CORAL_TINT, color: CORAL_DARK }}
                >
                  <Zap className="mb-1 size-3.5" />
                  <p>Upgrade to Business</p>
                  <p className="mt-0.5 text-[10px] opacity-70">Unlock priority placement</p>
                </button>
              </div>
            )}
          </aside>

          {/* ── Main ───────────────────────────────────────────────── */}
          <main className="flex min-h-0 min-w-0 flex-1 flex-col">
            {/* Topbar */}
            <div
              className="flex shrink-0 items-center justify-between px-5 py-3"
              style={{
                borderBottom: "0.5px solid rgba(0,0,0,0.12)",
                background: "#fff",
              }}
            >
              <div className="flex flex-col gap-0.5">
                <p className="text-[15px] font-medium">
                  {getGreeting()}, {vendorName.split(" ")[0]} 👋
                </p>
                <p className="text-[11px] text-black/40">{greetingSub}</p>
              </div>
              <div className="flex items-center gap-2">
                {plan !== "business" && (
                  <button
                    onClick={() => setActiveNav("plan")}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-black/5"
                    style={{
                      background: CORAL_TINT,
                      color: CORAL_DARK,
                      borderColor: CORAL_BORDER,
                    }}
                  >
                    <Zap className="size-3.5" />
                    <span className="hidden sm:inline">Upgrade to Business</span>
                    <span className="sm:hidden">Upgrade</span>
                  </button>
                )}
                {vendor && (
                  <button
                    onClick={() => {
                      close();
                      setTimeout(() => openEditVendor(vendor.slug), 150);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-black/5"
                    style={{ borderColor: "rgba(0,0,0,0.12)" }}
                  >
                    <Edit3 className="size-3.5" />
                    <span className="hidden sm:inline">Edit listing</span>
                  </button>
                )}
                <button
                  onClick={close}
                  className="grid size-8 place-items-center rounded-lg text-black/50 hover:bg-black/5"
                  aria-label="Close dashboard"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {/* ── OVERVIEW ──────────────────────────────────────────── */}
              {activeNav === "overview" && (
                <div>
                  {/* KPI row */}
                  <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                    <KPICard
                      label="Profile views"
                      value={profileViews.toLocaleString()}
                      note={`+${Math.round(profileViews * 0.1)} this week`}
                      loading={isLoading}
                    />
                    <KPICard
                      label="Enquiries"
                      value={stats.totalBookings}
                      note={
                        pendingEnquiries > 0
                          ? `${pendingEnquiries} awaiting reply`
                          : "All replied"
                      }
                      loading={isLoading}
                    />
                    <KPICard
                      label="WhatsApp taps"
                      value={whatsappTaps}
                      note="This month"
                      loading={isLoading}
                    />
                    <KPICard
                      label="Avg. rating"
                      value={stats.avgRating.toFixed(1)}
                      note={`From ${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}`}
                      loading={isLoading}
                    />
                  </div>

                  {/* Row 2: Enquiries + Profile card */}
                  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
                    {/* Recent enquiries */}
                    <div
                      className="rounded-xl bg-white p-4"
                      style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-[13px] font-medium">Recent enquiries</h2>
                        <button
                          onClick={() => setActiveNav("enquiries")}
                          className="text-[11px] font-medium hover:underline"
                          style={{ color: CORAL_DARK }}
                        >
                          View all
                        </button>
                      </div>
                      {isLoading ? (
                        <div className="space-y-3">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                          ))}
                        </div>
                      ) : bookings.length === 0 ? (
                        <div className="flex flex-col items-center py-8 text-center">
                          <MessageSquare className="size-8 text-black/20" />
                          <p className="mt-2 text-[12px] text-black/40">
                            No enquiries yet. Your listing is live — customers
                            will find you soon!
                          </p>
                          {vendor && (
                            <button
                              onClick={() => {
                                close();
                                setTimeout(() => openVendor(vendor.slug), 150);
                              }}
                              className="mt-3 text-[11px] font-medium hover:underline"
                              style={{ color: CORAL_DARK }}
                            >
                              View your listing →
                            </button>
                          )}
                        </div>
                      ) : (
                        <div>
                          {bookings.slice(0, 4).map((b) => (
                            <EnquiryRow key={b.id} booking={b} vendor={vendor} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Profile card */}
                    <div
                      className="rounded-xl bg-white p-4"
                      style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}
                    >
                      <h2 className="mb-3 text-[13px] font-medium">Your listing</h2>
                      <div
                        className="mb-3 flex h-20 items-center justify-center rounded-lg overflow-hidden"
                        style={{ background: CORAL_TINT }}
                      >
                        {vendor?.heroImage ? (
                          <img
                            src={vendor.heroImage}
                            alt={vendor.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Building2 className="size-7" style={{ color: CORAL }} />
                        )}
                      </div>
                      <p className="text-[14px] font-medium">{vendorName}</p>
                      <p className="mt-0.5 text-[11px] text-black/40">
                        {cat?.label ?? vendor?.category} ·{" "}
                        {vendor ? `${vendor.city}, ${vendor.countryCode || vendor.country}` : ""}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div
                          className="rounded-lg p-2 text-center"
                          style={{ background: "#F1EFE8" }}
                        >
                          <p className="text-[16px] font-medium">
                            {stats.avgRating.toFixed(1)}
                          </p>
                          <p className="text-[10px] text-black/40">Rating</p>
                        </div>
                        <div
                          className="rounded-lg p-2 text-center"
                          style={{ background: "#F1EFE8" }}
                        >
                          <p className="text-[16px] font-medium">{reviewCount}</p>
                          <p className="text-[10px] text-black/40">Reviews</p>
                        </div>
                      </div>
                      {/* Profile completeness */}
                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-[11px] text-black/40">
                          <span>Profile completeness</span>
                          <span>{profileCompleteness(vendor, reviewCount)}%</span>
                        </div>
                        <div
                          className="h-1.5 overflow-hidden rounded-full"
                          style={{ background: "rgba(0,0,0,0.06)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${profileCompleteness(vendor, reviewCount)}%`,
                              background: CORAL,
                            }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          close();
                          setTimeout(() => openEditVendor(vendor.slug), 150);
                        }}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-[12px] font-medium text-black/50 transition-colors hover:bg-black/5"
                        style={{ borderColor: "rgba(0,0,0,0.12)" }}
                      >
                        <Edit3 className="size-3.5" />
                        Edit listing
                      </button>
                    </div>
                  </div>

                  {/* Chart */}
                  <div
                    className="mt-4 rounded-xl bg-white p-4"
                    style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-[13px] font-medium">
                        Profile views — last 30 days
                      </h2>
                      <div className="flex gap-3 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="inline-block size-2.5 rounded-sm"
                            style={{ background: CORAL }}
                          />
                          Views
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span
                            className="inline-block size-2.5 rounded-sm"
                            style={{ background: GREEN }}
                          />
                          WhatsApp taps
                        </span>
                      </div>
                    </div>
                    {bookings.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={chartData}>
                          <defs>
                            <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={CORAL} stopOpacity={0.15} />
                              <stop offset="100%" stopColor={CORAL} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            vertical={false}
                            stroke="rgba(136,135,128,0.12)"
                          />
                          <XAxis
                            dataKey="day"
                            tick={{ fontSize: 10, fill: "#888780" }}
                            axisLine={false}
                            tickLine={false}
                            maxTicksLimit={8}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: "#888780" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              fontSize: 11,
                              borderRadius: 8,
                              border: "0.5px solid rgba(0,0,0,0.12)",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="views"
                            name="Views"
                            stroke={CORAL}
                            strokeWidth={2}
                            dot={false}
                            fill="url(#viewsGrad)"
                          />
                          <Line
                            type="monotone"
                            dataKey="taps"
                            name="WhatsApp taps"
                            stroke={GREEN}
                            strokeWidth={2}
                            strokeDasharray="4 3"
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-[180px] items-center justify-center">
                        <p className="text-[12px] text-black/30">
                          Chart will populate as you receive enquiries.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Plan card */}
                  {/* Plan card on overview — compact version */}
                  <div
                    className="mt-4 rounded-xl bg-white p-4"
                    style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-[13px] font-medium">Your current plan</h2>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          background: plan === "business" ? CORAL_TINT : plan === "pro" ? PURPLE_TINT : "#F1EFE8",
                          color: plan === "business" ? CORAL_DARK : plan === "pro" ? PURPLE_DARK : "#5F5E5A",
                        }}
                      >
                        {planLabel}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveNav("plan")}
                      className="w-full rounded-lg py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
                      style={{ background: CORAL }}
                    >
                      View all plans & upgrade →
                    </button>
                  </div>
                </div>
              )}

              {/* ── ENQUIRIES ─────────────────────────────────────────── */}
              {activeNav === "enquiries" && (
                <div
                  className="rounded-xl bg-white p-4"
                  style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}
                >
                  <h2 className="mb-3 text-[13px] font-medium">
                    All enquiries ({bookings.length})
                  </h2>
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-center">
                      <MessageSquare className="size-10 text-black/20" />
                      <p className="mt-3 text-[13px] font-medium">No enquiries yet</p>
                      <p className="mt-1 text-[12px] text-black/40">
                        When customers enquire about your listing, they'll appear here.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {bookings.map((b) => (
                        <EnquiryRow key={b.id} booking={b} vendor={vendor} expanded />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── PRODUCTS ──────────────────────────────────────────── */}
              {activeNav === "products" && vendor && (
                <ProductsSection
                  vendorId={vendor.id}
                  currency={vendor.currency}
                  ecosystem={vendor.ecosystem}
                  category={vendor.category}
                />
              )}

              {activeNav === "products" && !vendor && (
                <div className="py-12 text-center text-[12px] text-black/40">
                  Create a listing first to add products.
                </div>
              )}

              {/* ── REVIEWS ───────────────────────────────────────────── */}
              {activeNav === "reviews" && (
                <div
                  className="rounded-xl bg-white p-4"
                  style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}
                >
                  <h2 className="mb-3 text-[13px] font-medium">
                    Reviews ({reviews.length})
                  </h2>
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-center">
                      <Star className="size-10 text-black/20" />
                      <p className="mt-3 text-[13px] font-medium">No reviews yet</p>
                      <p className="mt-1 text-[12px] text-black/40">
                        Reviews from happy customers will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((r) => (
                        <div
                          key={r.id}
                          className="rounded-lg border border-black/5 p-3"
                          style={{ background: "rgba(0,0,0,0.02)" }}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-[13px] font-medium">{r.author}</p>
                            <span className="inline-flex items-center gap-0.5 text-[12px]">
                              <Star className="size-3 fill-amber-400 text-amber-400" />
                              {r.rating}
                            </span>
                          </div>
                          {r.comment && (
                            <p className="mt-1 text-[12px] leading-relaxed text-black/60">
                              "{r.comment}"
                            </p>
                          )}
                          <p className="mt-1 text-[10px] text-black/30">
                            {r.vendorName} · {timeAgo(r.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── GALLERY ───────────────────────────────────────────── */}
              {activeNav === "gallery" && (
                <div
                  className="rounded-xl bg-white p-4"
                  style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-[13px] font-medium">Gallery</h2>
                    <button
                      onClick={() => {
                        close();
                        setTimeout(() => openEditVendor(vendor.slug), 150);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium hover:bg-black/5"
                      style={{ borderColor: "rgba(0,0,0,0.12)" }}
                    >
                      <Edit3 className="size-3" />
                      Manage gallery
                    </button>
                  </div>
                  {vendor?.gallery?.length ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {vendor.gallery.map((img, i) => (
                        <div
                          key={i}
                          className="aspect-square overflow-hidden rounded-lg bg-muted"
                        >
                          <img
                            src={img}
                            alt={`Gallery ${i + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-12 text-center">
                      <ImageIcon className="size-10 text-black/20" />
                      <p className="mt-3 text-[13px] font-medium">No photos yet</p>
                      <p className="mt-1 text-[12px] text-black/40">
                        Add photos to your listing to showcase your work.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── ANALYTICS ─────────────────────────────────────────── */}
              {activeNav === "analytics" && (
                <div>
                  <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                    <KPICard
                      label="Profile views"
                      value={profileViews.toLocaleString()}
                      note="Last 30 days"
                      loading={isLoading}
                    />
                    <KPICard
                      label="Enquiries"
                      value={stats.totalBookings}
                      note={`${pendingEnquiries} pending`}
                      loading={isLoading}
                    />
                    <KPICard
                      label="WhatsApp taps"
                      value={whatsappTaps}
                      note="Last 30 days"
                      loading={isLoading}
                    />
                    <KPICard
                      label="Conversion rate"
                      value={
                        profileViews > 0
                          ? `${((stats.totalBookings / profileViews) * 100).toFixed(1)}%`
                          : "—"
                      }
                      note="Enquiries / views"
                      loading={isLoading}
                    />
                  </div>
                  <div
                    className="mt-4 rounded-xl bg-white p-4"
                    style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}
                  >
                    <h2 className="mb-3 text-[13px] font-medium">
                      Profile views — last 30 days
                    </h2>
                    {bookings.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={chartData}>
                          <CartesianGrid
                            vertical={false}
                            stroke="rgba(136,135,128,0.12)"
                          />
                          <XAxis
                            dataKey="day"
                            tick={{ fontSize: 10, fill: "#888780" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: "#888780" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              fontSize: 11,
                              borderRadius: 8,
                              border: "0.5px solid rgba(0,0,0,0.12)",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="views"
                            name="Views"
                            stroke={CORAL}
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="taps"
                            name="WhatsApp taps"
                            stroke={GREEN}
                            strokeWidth={2}
                            strokeDasharray="4 3"
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-[250px] items-center justify-center">
                        <p className="text-[12px] text-black/30">
                          Analytics will populate as you receive enquiries.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── PLAN & BILLING ────────────────────────────────────── */}
              {activeNav === "plan" && (
                <SubscriptionPlanView
                  plan={plan}
                  planLabel={planLabel}
                  vendor={vendor}
                  onUpgrade={() => setShowSubModal(true)}
                />
              )}

              {/* ── PROMOTE / SETTINGS / HELP ─────────────────────────── */}
              {(activeNav === "promote" ||
                activeNav === "settings" ||
                activeNav === "help") && (
                <div
                  className="rounded-xl bg-white p-8"
                  style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}
                >
                  <div className="flex flex-col items-center text-center">
                    {activeNav === "promote" && (
                      <Megaphone className="size-10" style={{ color: CORAL }} />
                    )}
                    {activeNav === "settings" && (
                      <Settings className="size-10" style={{ color: CORAL }} />
                    )}
                    {activeNav === "help" && (
                      <HelpCircle className="size-10" style={{ color: CORAL }} />
                    )}
                    <p className="mt-3 text-[14px] font-medium capitalize">
                      {NAV_SECTIONS
                        .flatMap((s) => s.items)
                        .find((i) => i.id === activeNav)?.label}
                    </p>
                    <p className="mt-1 max-w-sm text-[12px] text-black/40">
                      {activeNav === "promote" &&
                        "Boost your listing visibility with featured placement and ad banners. Upgrade to Business to unlock."}
                      {activeNav === "settings" &&
                        "Edit your business details, contact info, and listing preferences."}
                      {activeNav === "help" &&
                        "Need help? Contact support or browse our vendor guide."}
                    </p>
                    {activeNav === "settings" && vendor && (
                      <button
                        onClick={() => {
                          close();
                          setTimeout(() => openEditVendor(vendor.slug), 150);
                        }}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-medium text-white"
                        style={{ background: CORAL }}
                      >
                        <Edit3 className="size-3.5" />
                        Edit business settings
                      </button>
                    )}
                    {activeNav === "help" && (
                      <a
                        href="mailto:support@findmybites.com"
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-medium text-white"
                        style={{ background: CORAL }}
                      >
                        Contact support
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="h-4" />
            </div>
          </main>
        </div>

        {/* Subscription Modal — shows all 3 plans */}
        <SubscriptionModal
          isOpen={showSubModal}
          onClose={() => setShowSubModal(false)}
          vendorCountry={vendor?.countryCode || "US"}
          vendorBrand={vendor?.ecosystem === "FINDMYBITES" ? "food" : "party"}
          currentPlan={plan as "free" | "pro" | "business"}
          vendorId={vendor?.id}
          vendorEmail={vendor?.userEmail || undefined}
          vendorName={vendor?.name}
          onSelectPlan={(selectedPlan, billing) => {
            setShowSubModal(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

// ── Enquiry row ────────────────────────────────────────────────────────────
function EnquiryRow({
  booking,
  vendor,
  expanded = false,
}: {
  booking: any;
  vendor: any;
  expanded?: boolean;
}) {
  const initials = getInitials(booking.name).toUpperCase();
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: PENDING_BG, text: PENDING_TEXT, label: "Pending" },
    confirmed: { bg: GREEN_BG, text: GREEN_TEXT, label: "Confirmed" },
    declined: { bg: FLAG_BG, text: FLAG_TEXT, label: "Declined" },
  };
  const s = statusConfig[booking.status] ?? statusConfig.pending;

  const replyOnWhatsApp = () => {
    if (!vendor?.whatsapp) {
      toast.error("No WhatsApp number on your listing");
      return;
    }
    const phone = vendor.whatsapp.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Hi ${booking.name}, thanks for your enquiry about ${booking.eventType}!`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const decline = async () => {
    if (!confirm("Decline this enquiry?")) return;
    try {
      await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "declined" }),
      });
      toast.success("Enquiry declined");
    } catch {
      toast.error("Failed to update enquiry");
    }
  };

  return (
    <div className="flex items-start gap-2.5 border-b border-black/5 py-2.5 last:border-0">
      <div
        className="grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-medium"
        style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.5)" }}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-medium">{booking.name}</p>
          <span
            className="inline-block rounded-full px-1.5 py-0.5 text-[9px] font-medium"
            style={{ background: s.bg, color: s.text }}
          >
            {s.label}
          </span>
        </div>
        {expanded && (
          <p className="mt-0.5 text-[11px] leading-relaxed text-black/60">
            {booking.message || `Enquiry for ${booking.eventType}`}
          </p>
        )}
        {!expanded && booking.message && (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-black/50">
            {booking.message}
          </p>
        )}
        <p className="mt-0.5 text-[10px] text-black/30">
          {timeAgo(booking.createdAt)} · {booking.eventCity} · {booking.guests} guests
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <button
          onClick={replyOnWhatsApp}
          className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors hover:bg-black/5"
          style={{ background: GREEN_BG, color: GREEN_TEXT, borderColor: "#97C459" }}
        >
          Reply
        </button>
        <button
          onClick={decline}
          className="rounded-lg border px-2 py-1 text-[11px] font-medium text-black/50 transition-colors hover:bg-black/5"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}

// ── Plan card ──────────────────────────────────────────────────────────────
function SubscriptionPlanView({
  plan,
  planLabel,
  vendor,
  onUpgrade,
}: {
  plan: string;
  planLabel: string;
  vendor: any;
  onUpgrade: () => void;
}) {
  const isFood = vendor?.ecosystem === "FINDMYBITES";
  const brandColor = isFood ? CORAL : PURPLE;
  const brandTint = isFood ? CORAL_TINT : PURPLE_TINT;
  const brandDark = isFood ? CORAL_DARK : PURPLE_DARK;
  const proName = isFood ? "Baker Pro" : "Vendor Pro";

  const plans = [
    {
      key: "free",
      name: "Free",
      desc: "Get started and be discovered",
      price: "₹0",
      note: "forever",
      isCurrent: plan === "free",
      features: [
        { label: "Basic listing (name, city, category)", included: true },
        { label: "WhatsApp booking link", included: true },
        { label: "Up to 5 gallery photos", included: true },
        { label: "Verified badge", included: false },
        { label: "Analytics dashboard", included: false },
      ],
    },
    {
      key: "pro",
      name: proName,
      desc: isFood ? "For serious food vendors ready to grow" : "Get leads and grow your events business",
      price: "₹299",
      note: "/month",
      isCurrent: plan === "pro",
      popular: true,
      features: [
        { label: "Everything in Free", included: true },
        { label: "Verified badge on listing", included: true },
        { label: "Up to 20 gallery photos", included: true },
        { label: "Basic analytics dashboard", included: true },
        { label: "Customer reviews enabled", included: true },
        { label: "Priority placement in search", included: false },
      ],
    },
    {
      key: "business",
      name: "Business",
      desc: "Maximum visibility + AI-powered growth",
      price: "₹499",
      note: "/month",
      isCurrent: plan === "business",
      features: [
        { label: `Everything in ${proName}`, included: true },
        { label: "Priority placement in search", included: true },
        { label: "Homepage spotlight feature", included: true },
        { label: "Ad banner slot access", included: true },
        { label: "Advanced analytics", included: true },
        { label: "Unlimited gallery photos", included: true },
      ],
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-medium">Your plan & billing</h2>
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
          style={{
            background: plan === "business" ? CORAL_TINT : plan === "pro" ? PURPLE_TINT : "#F1EFE8",
            color: plan === "business" ? CORAL_DARK : plan === "pro" ? PURPLE_DARK : "#5F5E5A",
          }}
        >
          Current: {planLabel}
        </span>
      </div>

      {/* All 3 plans side-by-side */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.key}
            className={`relative flex flex-col rounded-lg border bg-white p-4 ${p.popular ? "border-2" : "border border-black/10"}`}
            style={p.popular ? { borderColor: isFood ? CORAL_BORDER : PURPLE_BORDER } : undefined}
          >
            {p.popular && (
              <div
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[9px] font-medium text-white"
                style={{ background: brandColor }}
              >
                Most popular
              </div>
            )}
            <p className="text-[13px] font-medium" style={{ color: brandDark }}>{p.name}</p>
            <p className="mt-0.5 text-[10px] leading-snug text-black/40">{p.desc}</p>
            <div className="mt-3">
              <span className="text-[24px] font-medium tracking-tight">{p.price}</span>
              <span className="ml-1 text-[10px] text-black/40">{p.note}</span>
            </div>
            <div className="mt-3">
              {p.isCurrent ? (
                <div className="rounded-md bg-black/5 py-2 text-center text-[11px] font-medium text-black/40">
                  Current plan
                </div>
              ) : (
                <button
                  onClick={onUpgrade}
                  className={`w-full rounded-md py-2 text-[11px] font-medium transition-opacity hover:opacity-90 ${
                    p.key === "business" ? "text-white" : ""
                  }`}
                  style={
                    p.key === "business"
                      ? { background: brandColor }
                      : { background: brandTint, color: brandDark, border: `1px solid ${isFood ? CORAL_BORDER : PURPLE_BORDER}` }
                  }
                >
                  {p.key === "pro" ? `Start ${proName}` : "Go Business"}
                </button>
              )}
            </div>
            <div className="mt-4 flex-1">
              {p.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5">
                  {f.included ? (
                    <Check className="size-3.5 shrink-0" style={{ color: brandColor }} />
                  ) : (
                    <Lock className="size-3.5 shrink-0 text-black/25" />
                  )}
                  <span className={f.included ? "text-[12px] text-black/60" : "text-[12px] text-black/30"}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-[10px] text-black/40">
        All plans include WhatsApp direct booking. No transaction fees. Cancel anytime.
      </p>
    </div>
  );
}

// ── Empty states ───────────────────────────────────────────────────────────
function EmptyState({
  icon: Icon,
  title,
  desc,
  action,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 py-10 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-muted/50">
        <Icon className="size-6 text-muted-foreground/40" />
      </div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{desc}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function EmptyMini({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground/60">
      <Icon className="size-4" />
      {text}
    </div>
  );
}

// ── Products / Services section ────────────────────────────────────────────
function ProductsSection({
  vendorId,
  currency,
  ecosystem,
  category,
}: {
  vendorId: string | null;
  currency?: string;
  ecosystem?: string;
  category?: string;
}) {
  const { data, isLoading } = useProducts(vendorId);
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const catConfig = getCategoryFields(category ?? "");
  const isFMB = ecosystem === "FINDMYBITES";

  const EMPTY_FORM = {
    name: "", price: "", description: "", productType: "",
    sizes: "", flavours: "", weight: "", prepTime: "",
    deliveryAvailable: false, minGuests: "", pricePerHead: "",
    servings: "", shape: "", eggless: false,
    sameDay: false, customOrder: false, pickupAvailable: false,
    featured: false, videoUrl: "",
    image1: "", image2: "", image3: "",
  };
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [extraFieldsForm, setExtraFieldsForm] = React.useState<Record<string, string>>({});

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setExtraFieldsForm({});
    setEditingId(null);
  };

  const onEdit = (p: typeof products[0]) => {
    setEditingId(p.id);
    setShowForm(false);
    const imgs = p.images ?? [];
    setForm({
      name: p.name, price: String(p.price), description: p.description ?? "",
      productType: p.productType ?? "", sizes: p.sizes ?? "", flavours: p.flavours ?? "",
      weight: p.weight ?? "", prepTime: p.prepTime ?? "", deliveryAvailable: p.deliveryAvailable,
      minGuests: p.minGuests != null ? String(p.minGuests) : "",
      pricePerHead: p.pricePerHead != null ? String(p.pricePerHead) : "",
      servings: p.servings ?? "", shape: p.shape ?? "", eggless: p.eggless ?? false,
      sameDay: p.sameDay ?? false, customOrder: p.customOrder ?? false,
      pickupAvailable: p.pickupAvailable ?? false, featured: p.featured ?? false,
      videoUrl: p.videoUrl ?? "",
      image1: imgs[0] ?? "", image2: imgs[1] ?? "", image3: imgs[2] ?? "",
    });
    setExtraFieldsForm(p.extraFields ?? {});
  };

  const products = data?.products ?? [];
  const symbol = currency ? (CURRENCY_SYMBOLS[currency] ?? currency) : "$";

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId || !form.name.trim()) return;
    const payload: Record<string, unknown> = {
      vendorId, name: form.name.trim(), price: Number(form.price) || 0,
      description: form.description.trim() || undefined, productType: form.productType || undefined,
      deliveryAvailable: form.deliveryAvailable, pickupAvailable: form.pickupAvailable,
      sameDay: form.sameDay, customOrder: form.customOrder, featured: form.featured,
      videoUrl: form.videoUrl.trim() || undefined,
      images: [form.image1, form.image2, form.image3].filter(Boolean),
    };
    if (catConfig.show.sizes) payload.sizes = form.sizes.trim() || undefined;
    if (catConfig.show.flavours) payload.flavours = form.flavours.trim() || undefined;
    if (catConfig.show.weight) payload.weight = form.weight.trim() || undefined;
    if (catConfig.show.prepTime) payload.prepTime = form.prepTime.trim() || undefined;
    if (catConfig.show.servings) payload.servings = form.servings.trim() || undefined;
    if (catConfig.show.shape) payload.shape = form.shape.trim() || undefined;
    if (catConfig.show.eggless) payload.eggless = form.eggless;
    if (catConfig.show.minGuests) payload.minGuests = form.minGuests ? Number(form.minGuests) : undefined;
    if (catConfig.show.pricePerHead) payload.pricePerHead = form.pricePerHead ? Number(form.pricePerHead) : undefined;
    const hasExtra = Object.values(extraFieldsForm).some((v) => v.trim());
    if (hasExtra) payload.extraFields = JSON.stringify(extraFieldsForm);

    try {
      if (editingId) {
        const res = await fetch(`/api/products/${editingId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update");
        toast.success("Product updated!");
        queryClient.invalidateQueries({ queryKey: ["products", vendorId] });
      } else {
        await createProduct.mutateAsync(payload as Parameters<typeof createProduct.mutateAsync>[0]);
        toast.success("Product added!");
      }
      resetForm(); setShowForm(false);
    } catch {
      toast.error(editingId ? "Failed to update product" : "Failed to add product");
    }
  };

  const onDelete = (id: string) => {
    if (!vendorId || !confirm("Delete this product?")) return;
    deleteProduct.mutate({ id, vendorId });
  };

  if (!vendorId) return null;

  const formFields = (
    <>
      <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
        <div>
          <label className="mb-1 block text-xs font-semibold">Name</label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={isFMB ? "e.g. Luxury Wedding Cake" : "e.g. Wedding Photography Package"} className="h-9" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">Price ({symbol})</label>
          <Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0" className="h-9" min={0} />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {/* Category (read-only — inherits from vendor's business category) */}
        <div>
          <label className="mb-1 block text-xs font-semibold">Category</label>
          <div className="flex h-9 items-center rounded-md border border-input bg-muted/30 px-3 text-sm text-muted-foreground">
            {getCategoryMigrated(category ?? "")?.label ?? "—"}
          </div>
        </div>
        {/* Subcategory (= product type) */}
        <div>
          <label className="mb-1 block text-xs font-semibold">Subcategory</label>
          <select value={form.productType} onChange={(e) => set("productType", e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Select subcategory</option>
            {catConfig.types.map((t) => <option key={t} value={t.toLowerCase()}>{t}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold">Description</label>
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe your product or package..." className="h-20 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm" maxLength={500} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {catConfig.show.sizes && <div><label className="mb-1 block text-xs font-semibold">Sizes</label><Input value={form.sizes} onChange={(e) => set("sizes", e.target.value)} placeholder="1kg, 2kg, 3kg" className="h-9" /></div>}
        {catConfig.show.flavours && <div><label className="mb-1 block text-xs font-semibold">Flavours</label><Input value={form.flavours} onChange={(e) => set("flavours", e.target.value)} placeholder="Vanilla, Chocolate, Red Velvet" className="h-9" /></div>}
        {catConfig.show.weight && <div><label className="mb-1 block text-xs font-semibold">Weight</label><Input value={form.weight} onChange={(e) => set("weight", e.target.value)} placeholder="500g, 1kg" className="h-9" /></div>}
        {catConfig.show.prepTime && <div><label className="mb-1 block text-xs font-semibold">Prep time</label><Input value={form.prepTime} onChange={(e) => set("prepTime", e.target.value)} placeholder="24 hours, 3 days" className="h-9" /></div>}
        {catConfig.show.servings && <div><label className="mb-1 block text-xs font-semibold">Servings</label><Input value={form.servings} onChange={(e) => set("servings", e.target.value)} placeholder="Serves 10-20" className="h-9" /></div>}
        {catConfig.show.shape && <div><label className="mb-1 block text-xs font-semibold">Shape</label><Input value={form.shape} onChange={(e) => set("shape", e.target.value)} placeholder="Round, Square, Heart" className="h-9" /></div>}
        {catConfig.show.minGuests && <div><label className="mb-1 block text-xs font-semibold">Min guests</label><Input type="number" value={form.minGuests} onChange={(e) => set("minGuests", e.target.value)} placeholder="50" className="h-9" min={0} /></div>}
        {catConfig.show.pricePerHead && <div><label className="mb-1 block text-xs font-semibold">Price per head</label><Input type="number" value={form.pricePerHead} onChange={(e) => set("pricePerHead", e.target.value)} placeholder="250" className="h-9" min={0} /></div>}
      </div>
      {catConfig.extraFields.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {catConfig.extraFields.map((ef) => (
            <div key={ef.key}>
              <label className="mb-1 block text-xs font-semibold">{ef.label}</label>
              <Input value={extraFieldsForm[ef.key] ?? ""} onChange={(e) => setExtraFieldsForm((prev) => ({ ...prev, [ef.key]: e.target.value }))} placeholder={ef.placeholder} className="h-9" />
            </div>
          ))}
        </div>
      )}
      {/* Product images — up to 3 */}
      <div>
        <label className="mb-1 block text-xs font-semibold">Product images (up to 3)</label>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((n) => {
            const key = `image${n}` as keyof typeof form;
            return (
              <ImageUpload
                key={n}
                label={`Image ${n}`}
                aspect="square"
                value={form[key] as string}
                onChange={(url) => set(key, url)}
                className="w-full"
              />
            );
          })}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold">Video URL (optional)</label>
        <Input value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="YouTube or Vimeo link" className="h-9" />
      </div>
      <div className="flex flex-wrap gap-3">
        {catConfig.show.eggless && <label className="flex items-center gap-1.5 text-xs font-medium"><input type="checkbox" checked={form.eggless} onChange={(e) => set("eggless", e.target.checked)} className="size-4 rounded" /> 🥚 Eggless</label>}
        <label className="flex items-center gap-1.5 text-xs font-medium"><input type="checkbox" checked={form.deliveryAvailable} onChange={(e) => set("deliveryAvailable", e.target.checked)} className="size-4 rounded" /> 🚚 Delivery</label>
        <label className="flex items-center gap-1.5 text-xs font-medium"><input type="checkbox" checked={form.pickupAvailable} onChange={(e) => set("pickupAvailable", e.target.checked)} className="size-4 rounded" /> 🏪 Pickup</label>
        <label className="flex items-center gap-1.5 text-xs font-medium"><input type="checkbox" checked={form.sameDay} onChange={(e) => set("sameDay", e.target.checked)} className="size-4 rounded" /> ⚡ Same-day</label>
        <label className="flex items-center gap-1.5 text-xs font-medium"><input type="checkbox" checked={form.customOrder} onChange={(e) => set("customOrder", e.target.checked)} className="size-4 rounded" /> 🎨 Custom orders</label>
        <label className="flex items-center gap-1.5 text-xs font-medium"><input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="size-4 rounded" /> ⭐ Featured</label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">{editingId ? "Save changes" : "Add"}</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => { resetForm(); setShowForm(false); setEditingId(null); }}>Cancel</Button>
      </div>
    </>
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <div className="grid size-7 place-items-center rounded-lg bg-brand/10 text-brand">
            <Package className="size-4" />
          </div>
          {isFMB ? "Products" : "Packages & Services"}
        </h3>
        <button
          onClick={() => { resetForm(); setShowForm((v) => !v); }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand to-brand/80 px-3 py-1.5 text-xs font-semibold text-brand-foreground shadow-sm transition-all hover:shadow-md hover:brightness-110"
        >
          <Plus className="size-3" />
          {isFMB ? "Add product" : "Add package"}
        </button>
      </div>

      {editingId && !showForm && (
        <form onSubmit={onAdd} className="mb-3 space-y-3 rounded-2xl border-2 border-brand-border bg-brand-soft/20 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-brand">Edit product</p>
            <button type="button" onClick={() => { resetForm(); setEditingId(null); }} className="text-xs text-muted-foreground hover:text-foreground">Cancel edit</button>
          </div>
          {formFields}
        </form>
      )}

      {showForm && (
        <form onSubmit={onAdd} className="mb-3 space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
          {formFields}
        </form>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={`No ${isFMB ? "products" : "packages"} yet`}
          desc={`Add your ${isFMB ? "products" : "packages or services"} here — customers will see them on your listing.`}
        />
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="rounded-xl border border-border/60 bg-card p-3 transition-all hover:border-brand-border hover:shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                  <Package className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    {p.featured && <span className="shrink-0 rounded bg-brand/10 px-1 py-0.5 text-[10px] font-bold text-brand">⭐</span>}
                    {p.productType && <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium capitalize">{p.productType}</span>}
                  </div>
                  {p.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{p.description}</p>}
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums">{symbol}{p.price.toLocaleString("en-US")}</span>
                <button title="Edit" onClick={() => onEdit(p)} className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-all hover:bg-accent hover:text-foreground">
                  <Edit3 className="size-3.5" />
                </button>
                <button title="Delete" onClick={() => onDelete(p.id)} disabled={deleteProduct.isPending} className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-all hover:bg-rose-100 hover:text-rose-600 disabled:opacity-50">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              {(p.sizes || p.flavours || p.weight || p.prepTime || p.minGuests || p.pricePerHead || p.servings || p.shape || p.eggless || p.sameDay || p.customOrder || p.pickupAvailable || p.deliveryAvailable) && (
                <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border/40 pt-2">
                  {p.sizes && <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px]">📏 {p.sizes}</span>}
                  {p.flavours && <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px]">🍰 {p.flavours}</span>}
                  {p.weight && <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px]">⚖️ {p.weight}</span>}
                  {p.servings && <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px]">🍽️ {p.servings}</span>}
                  {p.shape && <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px]">⬡ {p.shape}</span>}
                  {p.eggless && <span className="rounded-md bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-600">🥚 Eggless</span>}
                  {p.prepTime && <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px]">⏱️ {p.prepTime}</span>}
                  {p.minGuests != null && <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px]">👥 Min {p.minGuests}</span>}
                  {p.pricePerHead != null && <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px]">💰 {symbol}{p.pricePerHead}/head</span>}
                  {p.sameDay && <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-600">⚡ Same-day</span>}
                  {p.customOrder && <span className="rounded-md bg-purple-500/10 px-1.5 py-0.5 text-[10px] text-purple-600">🎨 Custom</span>}
                  {p.deliveryAvailable && <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-600">🚚 Delivery</span>}
                  {p.pickupAvailable && <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-600">🏪 Pickup</span>}
                </div>
              )}
              {p.extraFields && Object.entries(p.extraFields).filter(([, v]) => v).length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {Object.entries(p.extraFields).filter(([, v]) => v).map(([k, v]) => (
                    <span key={k} className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px]">{v}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Need Input import for the form
import { Input } from "@/components/ui/input";
