"use client";

import * as React from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Image as ImageIcon,
  Star,
  Calendar,
  TrendingUp,
  Settings,
  HelpCircle,
  Building2,
  MessageCircle,
  X,
  Edit3,
  ExternalLink,
  Loader2,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

// ── Brand colors (derived from vendor ecosystem) ───────────────────────────
const BRAND = {
  food: {
    color: "#D85A30",
    tint: "#FAECE7",
    dark: "#993C1D",
    name: "FindMyBites",
  },
  party: {
    color: "#7F77DD",
    tint: "#EEEDFE",
    dark: "#534AB7",
    name: "PimpMyParty",
  },
};

const GREEN_BG = "#EAF3DE";
const GREEN_TEXT = "#27500A";
const GREEN_LINE = "#639922";

// ── Types ───────────────────────────────────────────────────────────────────
interface Vendor {
  id: string;
  name: string;
  slug: string;
  ecosystem: string;
  category: string;
  city: string;
  country: string;
  countryCode: string;
  tagline: string;
  description: string;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  gallery: string[];
  rating: number;
  reviewCount: number;
  completedBookings: number;
  basePrice: number;
  currency: string;
  heroImage: string;
  avatarImage: string;
  address: string | null;
  state: string | null;
  zipCode: string | null;
  approved: boolean;
  featured: boolean;
  createdAt: string;
}

interface Booking {
  id: string;
  vendorId: string;
  name: string;
  email: string;
  eventType: string;
  eventDate: string;
  eventCity: string;
  guests: number;
  budget: string;
  message: string;
  status: string;
  createdAt: string;
  vendorName: string;
}

// ── Nav items ───────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    title: "MY LISTING",
    items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "enquiries", label: "Enquiries", icon: MessageSquare, showBadge: true },
      { id: "gallery", label: "Gallery", icon: ImageIcon },
      { id: "reviews", label: "Reviews", icon: Star },
      { id: "availability", label: "Availability", icon: Calendar },
    ],
  },
  {
    title: "BUSINESS",
    items: [
      { id: "analytics", label: "Analytics", icon: TrendingUp },
      { id: "promote", label: "Promote listing", icon: Building2 },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { id: "settings", label: "Settings", icon: Settings },
      { id: "help", label: "Help", icon: HelpCircle },
    ],
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h <= 11) return "Good morning";
  if (h >= 12 && h <= 17) return "Good afternoon";
  return "Good evening";
}

function getInitials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
}

function getFirstName(name: string): string {
  return name.split(/\s+/)[0] || name;
}

// ── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-black/5", className)} />;
}

// ── KPI Card ────────────────────────────────────────────────────────────────
function KPICard({
  label,
  value,
  subNote,
  delta,
  loading,
}: {
  label: string;
  value: string | number;
  subNote?: string;
  delta?: string;
  loading?: boolean;
}) {
  return (
    <div style={{ background: "#F1EFE8", borderRadius: 8, padding: "14px 16px" }}>
      <p className="text-[11px] text-black/50">{label}</p>
      {loading ? (
        <Skeleton className="mt-1 h-6 w-16" />
      ) : (
        <p className="text-[22px] font-medium tracking-tight">{value}</p>
      )}
      {subNote && !loading && (
        <p className="mt-0.5 text-[11px] text-black/40">{subNote}</p>
      )}
      {delta && !loading && (
        <p className="mt-0.5 text-[11px]" style={{ color: GREEN_TEXT }}>
          {delta}
        </p>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export function VendorDashboardPage({
  userEmail,
  userName,
  userImage,
}: {
  userEmail: string;
  userName: string;
  userImage?: string;
}) {
  const [activeNav, setActiveNav] = React.useState("overview");
  const [loading, setLoading] = React.useState(true);
  const [vendor, setVendor] = React.useState<Vendor | null>(null);
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [perfData, setPerfData] = React.useState<{ day: string; views: number; taps: number }[]>([]);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/me");
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setVendor(data.vendors?.[0] ?? null);
      setBookings(data.bookings ?? []);
      const unread = (data.bookings ?? []).filter((b: Booking) => b.status === "pending").length;
      setUnreadCount(unread);

      // Build mock performance data (real impl would fetch from vendor_views/whatsapp_taps)
      const days: { day: string; views: number; taps: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
          day: String(d.getDate()),
          views: Math.floor(Math.random() * 20) + (i < 10 ? 10 : 0),
          taps: Math.floor(Math.random() * 8) + (i < 10 ? 3 : 0),
        });
      }
      setPerfData(days);
    } catch (err) {
      console.error("Vendor dashboard fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Derive brand from vendor ecosystem
  const isFood = vendor?.ecosystem === "FINDMYBITES";
  const brand = isFood ? BRAND.food : BRAND.party;
  const brandColor = brand.color;
  const brandTint = brand.tint;
  const brandDark = brand.dark;
  const brandName = brand.name;

  // Profile completeness
  const completeness = React.useMemo(() => {
    if (!vendor) return 0;
    const fields = [
      vendor.name,
      vendor.description,
      vendor.whatsapp,
      vendor.city,
      vendor.country,
      vendor.category,
      vendor.gallery && vendor.gallery.length > 0,
      vendor.reviewCount > 0,
      vendor.tagline,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [vendor]);

  // Decline enquiry
  const handleDecline = async (id: string) => {
    setActionLoading(id);
    // Optimistic update
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "declined" } : b)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "declined" }),
      });
    } catch (err) {
      // Revert
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "pending" } : b)));
      setUnreadCount((prev) => prev + 1);
    } finally {
      setActionLoading(null);
    }
  };

  // Show loading state if no vendor yet
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "#F7F6F2" }}>
        <Loader2 className="size-6 animate-spin text-black/30" />
      </div>
    );
  }

  // No vendor found
  if (!vendor) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4" style={{ background: "#F7F6F2" }}>
        <Building2 className="size-12 text-black/20" />
        <p className="text-[14px] font-medium">No business listing found</p>
        <a
          href="/"
          className="rounded-lg px-4 py-2 text-[12px] font-medium text-white"
          style={{ background: "#D85A30" }}
        >
          List your business — free
        </a>
      </div>
    );
  }

  const firstName = getFirstName(vendor.name);
  const initials = getInitials(userName);

  return (
    <div className="flex h-screen" style={{ background: "#F7F6F2" }}>
      {/* Sidebar */}
      <aside
        className="flex h-full flex-col overflow-hidden"
        style={{ width: 210, background: "#fff", borderRight: "0.5px solid rgba(0,0,0,0.12)" }}
      >
        {/* Top block */}
        <div className="p-4" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.12)" }}>
          <p className="text-[12px] text-black/40">{brandName}</p>
          <p className="text-[14px] font-medium">{vendor.name}</p>
          <span
            className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: brandTint, color: brandDark }}
          >
            {vendor.category}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-wide text-black/30">
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id)}
                    className="mb-0.5 flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] transition-colors"
                    style={{
                      background: isActive ? brandTint : "transparent",
                      color: isActive ? brandDark : "rgba(0,0,0,0.5)",
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="size-4" />
                      {item.label}
                    </span>
                    {item.showBadge && unreadCount > 0 && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                        style={{ background: brandColor }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "0.5px solid rgba(0,0,0,0.12)", background: "#fff" }}
        >
          <div>
            <h1 className="text-[15px] font-medium">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-[11px] text-black/40">
              {unreadCount > 0
                ? `You have ${unreadCount} new enquiries`
                : "No new enquiries"}
            </p>
          </div>
          {userImage ? (
            <img src={userImage} alt="" className="size-8 rounded-full object-cover" />
          ) : (
            <div
              className="grid size-8 place-items-center rounded-full text-[11px] font-medium text-white"
              style={{ background: brandColor }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Dashboard content */}
        <div className="p-6">
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-3">
            <KPICard
              label="Profile views"
              value={vendor.completedBookings * 3 + 42}
              delta="+7 this week"
              loading={loading}
            />
            <KPICard
              label="Enquiries"
              value={bookings.length}
              subNote={`${unreadCount} awaiting reply`}
              loading={loading}
            />
            <KPICard
              label="WhatsApp taps"
              value={Math.floor(vendor.completedBookings * 1.5) + 8}
              delta="this month"
              loading={loading}
            />
            <KPICard
              label="Avg rating"
              value={vendor.rating.toFixed(1)}
              subNote={`from ${vendor.reviewCount} reviews`}
              loading={loading}
            />
          </div>

          {/* Two-column row */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            {/* Enquiry feed */}
            <div className="rounded-xl bg-white p-4" style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}>
              <h2 className="mb-3 text-[14px] font-medium">Enquiries</h2>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <MessageSquare className="size-8 text-black/20" />
                  <p className="mt-2 text-[12px] text-black/50">
                    No enquiries yet. Your listing is live — customers will find you soon!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bookings.slice(0, 10).map((b) => (
                    <div
                      key={b.id}
                      className="rounded-lg p-2.5"
                      style={{ background: "rgba(0,0,0,0.02)" }}
                    >
                      <div className="flex items-start gap-2">
                        <div className="grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-medium text-black/60"
                          style={{ background: "rgba(0,0,0,0.05)" }}
                        >
                          {getInitials(b.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium">{b.name}</p>
                          <p
                            className="text-[11px] leading-snug text-black/50"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {b.message}
                          </p>
                          <p className="mt-0.5 text-[10px] text-black/30">
                            {timeAgo(b.createdAt)}{b.eventCity ? ` · ${b.eventCity}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-1.5">
                        {vendor.whatsapp && (
                          <a
                            href={`https://wa.me/${vendor.whatsapp}?text=${encodeURIComponent(
                              `Hi ${b.name}, thanks for reaching out via ${brandName}!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium"
                            style={{ background: GREEN_BG, color: "#3B6D11" }}
                          >
                            <MessageCircle className="size-3" />
                            WhatsApp reply
                          </a>
                        )}
                        {b.status !== "declined" && (
                          <button
                            onClick={() => handleDecline(b.id)}
                            disabled={actionLoading === b.id}
                            className="rounded-lg border px-2 py-1 text-[11px] text-black/50 disabled:opacity-50"
                            style={{ borderColor: "rgba(0,0,0,0.12)" }}
                          >
                            {actionLoading === b.id ? "…" : "Decline"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile card */}
            <div className="rounded-xl bg-white p-4" style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}>
              <h2 className="mb-3 text-[14px] font-medium">Profile</h2>

              {/* Brand tint header */}
              <div
                className="mb-3 flex items-center justify-center rounded-lg"
                style={{ height: 80, background: brandTint }}
              >
                <Building2 className="size-8" style={{ color: brandColor }} />
              </div>

              <p className="text-[14px] font-medium">{vendor.name}</p>
              <p className="text-[11px] text-black/50">
                {vendor.category} · {vendor.city}
              </p>

              {/* Stat boxes */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg p-2 text-center" style={{ background: "#F1EFE8" }}>
                  <p className="text-[18px] font-medium">{vendor.rating.toFixed(1)}</p>
                  <p className="text-[10px] text-black/40">AVG rating</p>
                </div>
                <div className="rounded-lg p-2 text-center" style={{ background: "#F1EFE8" }}>
                  <p className="text-[18px] font-medium">{vendor.reviewCount}</p>
                  <p className="text-[10px] text-black/40">Reviews</p>
                </div>
              </div>

              {/* Completeness bar */}
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] text-black/50">Profile {completeness}% complete</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${completeness}%`, background: brandColor }}
                  />
                </div>
              </div>

              {/* Edit button */}
              <a
                href="/"
                className="mt-3 block rounded-lg border py-2 text-center text-[12px] font-medium"
                style={{ borderColor: brandColor, color: brandColor }}
              >
                Edit listing
              </a>
            </div>
          </div>

          {/* Performance chart */}
          <div className="mt-6 rounded-xl bg-white p-4" style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}>
            <h2 className="mb-3 text-[14px] font-medium">Performance (30 days)</h2>

            {/* Custom legend */}
            <div className="mb-3 flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4" style={{ background: brandColor }} />
                <span className="text-[11px]">Profile views</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 border-t-2 border-dashed" style={{ borderColor: GREEN_LINE }} />
                <span className="text-[11px]">WhatsApp taps</span>
              </div>
            </div>

            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={perfData}>
                  <CartesianGrid vertical={false} stroke="rgba(136,135,128,0.15)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval={4}
                    
                  />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.12)" }}
                  />
                  {/* Views — filled area + solid line */}
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={brandColor} stopOpacity={0.08} />
                      <stop offset="95%" stopColor={brandColor} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="tapsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={GREEN_LINE} stopOpacity={0.06} />
                      <stop offset="95%" stopColor={GREEN_LINE} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke={brandColor}
                    strokeWidth={2}
                    fill="url(#viewsGrad)"
                    dot={false}
                    
                  />
                  <Line
                    type="monotone"
                    dataKey="taps"
                    stroke={GREEN_LINE}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    fill="url(#tapsGrad)"
                    dot={false}
                    
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
