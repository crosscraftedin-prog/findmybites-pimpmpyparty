"use client";

import * as React from "react";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  CheckCircle2,
  Tag,
  Confetti,
  Bell,
  Mail,
  Settings,
  Speakerphone,
  X,
  Search,
  TrendingUp,
  ShieldCheck,
  Clock,
  AlertTriangle,
  ChevronDown,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

// ── Brand colors ────────────────────────────────────────────────────────────
const CORAL = "#D85A30";
const CORAL_TINT = "#FAECE7";
const CORAL_DARK = "#993C1D";
const PURPLE = "#7F77DD";
const PURPLE_TINT = "#EEEDFE";
const PURPLE_DARK = "#534AB7";
const GREEN_BG = "#EAF3DE";
const GREEN_TEXT = "#27500A";
const PENDING_BG = "#FAEEDA";
const PENDING_TEXT = "#633806";
const FLAG_BG = "#FCEBEB";
const FLAG_TEXT = "#791F1F";

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
  status: string;
  approved: boolean;
  featured: boolean;
  verified: boolean;
  tagline: string;
  description: string;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  gallery: string[];
  createdAt: string;
  heroImage: string;
  avatarImage: string;
  rating: number;
  reviewCount: number;
  completedBookings: number;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

interface KPIData {
  totalVendors: number;
  newThisMonth: number;
  activeListings: number;
  approvalRate: number;
  totalEnquiries: number;
  enquiriesThisWeek: number;
  whatsappTaps: number;
  tapsThisMonth: number;
}

// ── Nav items ───────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    title: "OVERVIEW",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "FINDMYBITES",
    brand: "food" as const,
    items: [
      { id: "food-vendors", label: "Food vendors", icon: Users },
      { id: "food-approvals", label: "Approvals", icon: CheckCircle2 },
      { id: "food-categories", label: "Categories", icon: Tag },
    ],
  },
  {
    title: "PIMPMYPARTY",
    brand: "party" as const,
    items: [
      { id: "party-vendors", label: "Party vendors", icon: Confetti },
      { id: "party-approvals", label: "Approvals", icon: CheckCircle2 },
      { id: "party-categories", label: "Categories", icon: Tag },
    ],
  },
  {
    title: "PLATFORM",
    items: [
      { id: "ad-banners", label: "Ad banners", icon: Speakerphone },
      { id: "messages", label: "Messages", icon: Mail },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function getInitials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
}

function formatMonth(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short" });
}

// ── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-black/5", className)} />;
}

// ── Status badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    approved: { bg: GREEN_BG, text: GREEN_TEXT, label: "Active" },
    pending: { bg: PENDING_BG, text: PENDING_TEXT, label: "Pending" },
    flagged: { bg: FLAG_BG, text: FLAG_TEXT, label: "Flagged" },
    rejected: { bg: FLAG_BG, text: FLAG_TEXT, label: "Rejected" },
  };
  const s = config[status] ?? config.pending;
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

// ── Brand pill ──────────────────────────────────────────────────────────────
function BrandPill({ ecosystem }: { ecosystem: string }) {
  const isFood = ecosystem === "FINDMYBITES";
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium"
      style={{
        background: isFood ? CORAL_TINT : PURPLE_TINT,
        color: isFood ? CORAL_DARK : PURPLE_DARK,
      }}
    >
      {isFood ? "FindMyBites" : "PimpMyParty"}
    </span>
  );
}

// ── KPI Card ────────────────────────────────────────────────────────────────
function KPICard({
  label,
  value,
  delta,
  loading,
}: {
  label: string;
  value: string | number;
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
      {delta && !loading && (
        <p className="mt-0.5 text-[11px]" style={{ color: GREEN_TEXT }}>
          {delta}
        </p>
      )}
    </div>
  );
}

// ── Slide-over review panel ─────────────────────────────────────────────────
function ReviewPanel({
  vendor,
  onClose,
  onAction,
}: {
  vendor: Vendor | null;
  onClose: () => void;
  onAction: (id: string, status: string) => void;
}) {
  if (!vendor) return null;
  const isFood = vendor.ecosystem === "FINDMYBITES";
  const tint = isFood ? CORAL_TINT : PURPLE_TINT;
  const dark = isFood ? CORAL_DARK : PURPLE_DARK;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 z-50 h-full overflow-y-auto"
        style={{ width: 400, background: "#fff", borderLeft: "0.5px solid rgba(0,0,0,0.12)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.12)" }}>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium">{vendor.name}</span>
            <BrandPill ecosystem={vendor.ecosystem} />
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-black/5">
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-4">
          <Section label="Business details">
            <p className="text-[13px]">{vendor.name}</p>
            <p className="text-[12px] text-black/50">{vendor.category} · {vendor.city}, {vendor.country}</p>
          </Section>

          {vendor.whatsapp && (
            <Section label="Contact">
              <p className="text-[12px]">WhatsApp: {vendor.whatsapp}</p>
            </Section>
          )}

          {vendor.description && (
            <Section label="About">
              <p className="text-[12px] leading-relaxed text-black/70">{vendor.description}</p>
            </Section>
          )}

          {vendor.website && (
            <Section label="Links">
              <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-[12px] underline" style={{ color: dark }}>
                {vendor.website}
              </a>
            </Section>
          )}

          {vendor.gallery && vendor.gallery.length > 0 && (
            <Section label="Gallery">
              <div className="grid grid-cols-3 gap-2">
                {vendor.gallery.slice(0, 6).map((img, i) => (
                  <img key={i} src={img} alt="" className="aspect-square rounded-lg object-cover" />
                ))}
              </div>
            </Section>
          )}

          <Section label="Joined">
            <p className="text-[12px] text-black/50">
              {new Date(vendor.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </Section>

          <Section label="Current status">
            <StatusBadge status={vendor.approved ? "approved" : "pending"} />
          </Section>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 flex gap-2 border-t bg-white p-4" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
          <button
            onClick={() => onAction(vendor.id, "approved")}
            className="flex-1 rounded-lg py-2 text-[12px] font-medium text-white"
            style={{ background: GREEN_TEXT }}
          >
            Approve
          </button>
          <button
            onClick={() => onAction(vendor.id, "rejected")}
            className="flex-1 rounded-lg border py-2 text-[12px] font-medium"
            style={{ borderColor: FLAG_TEXT, color: FLAG_TEXT }}
          >
            Reject
          </button>
          <button
            onClick={() => onAction(vendor.id, "flagged")}
            className="flex-1 rounded-lg border py-2 text-[12px] font-medium"
            style={{ borderColor: "#D97706", color: "#D97706" }}
          >
            Flag
          </button>
        </div>
      </div>
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-black/40">{label}</p>
      {children}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export function AdminPanelPage({ adminEmail, adminName }: { adminEmail: string; adminName: string }) {
  const [activeNav, setActiveNav] = React.useState("dashboard");
  const [loading, setLoading] = React.useState(true);
  const [kpi, setKpi] = React.useState<KPIData | null>(null);
  const [pendingVendors, setPendingVendors] = React.useState<Vendor[]>([]);
  const [activity, setActivity] = React.useState<ActivityItem[]>([]);
  const [activityError, setActivityError] = React.useState(false);
  const [allVendors, setAllVendors] = React.useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [brandFilter, setBrandFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [reviewVendor, setReviewVendor] = React.useState<Vendor | null>(null);
  const [signupsData, setSignupsData] = React.useState<{ month: string; food: number; party: number }[]>([]);
  const [foodPending, setFoodPending] = React.useState(0);
  const [partyPending, setPartyPending] = React.useState(0);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  // Fetch all data on mount
  React.useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, adminVendorsRes, signupsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/vendors?pageSize=100"),
        fetch("/api/admin/signups"),
      ]);

      const stats = await statsRes.json();
      const adminVendors = await adminVendorsRes.json();

      // KPIs
      const totalVendors = stats.totals?.vendors ?? 0;
      const activeListings = stats.totals?.approved ?? 0;
      setKpi({
        totalVendors,
        newThisMonth: 0,
        activeListings,
        approvalRate: totalVendors > 0 ? Math.round((activeListings / totalVendors) * 1000) / 10 : 0,
        totalEnquiries: stats.totals?.bookings ?? 0,
        enquiriesThisWeek: 0,
        whatsappTaps: 0,
        tapsThisMonth: 0,
      });

      // Pending counts
      const fp = (adminVendors.vendors ?? []).filter((v: Vendor) => v.ecosystem === "FINDMYBITES" && !v.approved).length;
      const pp = (adminVendors.vendors ?? []).filter((v: Vendor) => v.ecosystem === "PIMPMYPARTY" && !v.approved).length;
      setFoodPending(fp);
      setPartyPending(pp);

      // Pending vendors (not approved)
      const pending = (adminVendors.vendors ?? []).filter((v: Vendor) => !v.approved).slice(0, 10);
      setPendingVendors(pending);

      // All vendors for table
      setAllVendors(adminVendors.vendors ?? []);

      // Signups chart
      if (signupsRes.ok) {
        const signups = await signupsRes.json();
        setSignupsData(signups.data ?? []);
      }

      // Activity feed (best-effort)
      try {
        const actRes = await fetch("/api/admin/activity");
        if (actRes.ok) {
          const act = await actRes.json();
          setActivity(act.items ?? []);
        } else {
          setActivityError(true);
        }
      } catch {
        setActivityError(true);
      }
    } catch (err) {
      console.error("Admin fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered vendors for table
  const filteredVendors = React.useMemo(() => {
    return allVendors.filter((v) => {
      if (searchQuery && !v.name.toLowerCase().includes(searchQuery.toLowerCase()) && !v.city.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (brandFilter !== "all") {
        const want = brandFilter === "food" ? "FINDMYBITES" : "PIMPMYPARTY";
        if (v.ecosystem !== want) return false;
      }
      if (statusFilter !== "all") {
        const want = statusFilter === "active" ? true : false;
        if (v.approved !== want) return false;
      }
      return true;
    });
  }, [allVendors, searchQuery, brandFilter, statusFilter]);

  // Handle vendor status change
  const handleAction = async (id: string, status: string) => {
    setActionLoading(id);
    // Optimistic update
    const approved = status === "approved";
    setAllVendors((prev) => prev.map((v) => (v.id === id ? { ...v, approved, status } : v)));
    setPendingVendors((prev) => prev.filter((v) => v.id !== id));
    setReviewVendor(null);

    try {
      const vendor = allVendors.find((v) => v.id === id);
      if (!vendor) return;
      await fetch(`/api/vendors/${vendor.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });

      // Update pending counts
      if (approved) {
        if (vendor.ecosystem === "FINDMYBITES") setFoodPending((p) => Math.max(0, p - 1));
        else setPartyPending((p) => Math.max(0, p - 1));
      }
    } catch (err) {
      // Revert on error
      setAllVendors((prev) => prev.map((v) => (v.id === id ? { ...v, approved: !approved } : v)));
      console.error("Action failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPending = foodPending + partyPending;
  const initials = getInitials(adminName);

  return (
    <div className="flex h-screen" style={{ background: "#F7F6F2" }}>
      {/* Sidebar */}
      <aside
        className="flex h-full flex-col overflow-hidden"
        style={{ width: 210, background: "#fff", borderRight: "0.5px solid rgba(0,0,0,0.12)" }}
      >
        {/* Top block */}
        <div className="p-4" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.12)" }}>
          <p className="text-[13px] font-medium">FindMyBites × PimpMyParty</p>
          <p className="text-[11px] text-black/40">Admin panel</p>
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
                const isFoodBrand = section.brand === "food";
                const isPartyBrand = section.brand === "party";
                const showPendingPill =
                  (item.id === "food-approvals" && foodPending > 0) ||
                  (item.id === "party-approvals" && partyPending > 0);
                const pillCount = item.id === "food-approvals" ? foodPending : partyPending;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id)}
                    className="mb-0.5 flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] transition-colors"
                    style={{
                      background: isActive
                        ? isFoodBrand
                          ? CORAL_TINT
                          : isPartyBrand
                            ? PURPLE_TINT
                            : "rgba(0,0,0,0.04)"
                        : "transparent",
                      color: isActive
                        ? isFoodBrand
                          ? CORAL_DARK
                          : isPartyBrand
                            ? PURPLE_DARK
                            : "inherit"
                        : "rgba(0,0,0,0.5)",
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="size-4" />
                      {item.label}
                    </span>
                    {showPendingPill && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                        style={{ background: isFoodBrand ? CORAL : PURPLE }}
                      >
                        {pillCount}
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
          <h1 className="text-[15px] font-medium">Dashboard</h1>
          <div className="flex items-center gap-3">
            {totalPending > 0 && (
              <span
                className="rounded-full px-2.5 py-1 text-[10px] font-medium text-white"
                style={{ background: CORAL }}
              >
                {totalPending} pending
              </span>
            )}
            <button className="grid size-8 place-items-center rounded-lg hover:bg-black/5">
              <Bell className="size-4 text-black/50" />
            </button>
            <div
              className="grid size-8 place-items-center rounded-full text-[11px] font-medium text-white"
              style={{ background: PURPLE }}
            >
              {initials}
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-6">
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-3">
            <KPICard label="Total vendors" value={kpi?.totalVendors ?? 0} delta={kpi ? `+${kpi.newThisMonth} this month` : undefined} loading={loading} />
            <KPICard label="Active listings" value={kpi?.activeListings ?? 0} delta={kpi ? `${kpi.approvalRate}% approval rate` : undefined} loading={loading} />
            <KPICard label="Total enquiries" value={kpi?.totalEnquiries ?? 0} delta={kpi ? `+${kpi.enquiriesThisWeek} this week` : undefined} loading={loading} />
            <KPICard label="WhatsApp taps" value={kpi?.whatsappTaps ?? 0} delta={kpi ? `+${kpi.tapsThisMonth} this month` : undefined} loading={loading} />
          </div>

          {/* Two-column row */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            {/* Pending approvals */}
            <div className="rounded-xl bg-white p-4" style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}>
              <h2 className="mb-3 text-[14px] font-medium">Pending approvals</h2>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : pendingVendors.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <CheckCircle2 className="size-8" style={{ color: GREEN_TEXT }} />
                  <p className="mt-2 text-[12px] text-black/50">All caught up — no vendors awaiting review.</p>
                </div>
              ) : (
                <>
                  <div className="mb-2 flex gap-2">
                    <TabButton label="Food" active={true} onClick={() => {}} />
                    <TabButton label="Party" active={false} onClick={() => {}} />
                  </div>
                  <div className="space-y-1">
                    {pendingVendors.map((v) => {
                      const isFood = v.ecosystem === "FINDMYBITES";
                      return (
                        <div key={v.id} className="flex items-center gap-2 rounded-lg p-2 hover:bg-black/3">
                          <div
                            className="grid size-8 shrink-0 place-items-center rounded-lg text-[11px] font-medium"
                            style={{ background: isFood ? CORAL_TINT : PURPLE_TINT, color: isFood ? CORAL_DARK : PURPLE_DARK }}
                          >
                            {getInitials(v.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium">{v.name}</p>
                            <p className="truncate text-[11px] text-black/40">{v.city} · {v.category}</p>
                          </div>
                          <StatusBadge status="pending" />
                          <button
                            onClick={() => setReviewVendor(v)}
                            className="rounded-lg px-2 py-1 text-[11px] font-medium hover:bg-black/5"
                          >
                            Review
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Activity feed */}
            <div className="rounded-xl bg-white p-4" style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}>
              <h2 className="mb-3 text-[14px] font-medium">Activity feed</h2>
              {activityError ? (
                <p className="py-8 text-center text-[12px] text-black/40">Activity log not set up yet.</p>
              ) : activity.length === 0 ? (
                <p className="py-8 text-center text-[12px] text-black/40">No recent activity.</p>
              ) : (
                <div className="space-y-2">
                  {activity.slice(0, 10).map((item) => (
                    <div key={item.id} className="flex items-start gap-2">
                      <div
                        className="mt-1 size-2 shrink-0 rounded-full"
                        style={{
                          background: item.type === "food" ? CORAL : item.type === "party" ? PURPLE : GREEN_TEXT,
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] leading-snug">{item.description}</p>
                        <p className="text-[11px] text-black/40">{timeAgo(item.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Vendor table */}
          <div className="mt-6 rounded-xl bg-white p-4" style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}>
            <h2 className="mb-3 text-[14px] font-medium">All vendors</h2>

            {/* Controls */}
            <div className="mb-3 flex gap-2">
              <input
                type="text"
                placeholder="Search vendors…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 flex-1 rounded-lg border px-3 text-[12px]"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
              />
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="h-8 rounded-lg border px-2 text-[12px]"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
              >
                <option value="all">All brands</option>
                <option value="food">FindMyBites</option>
                <option value="party">PimpMyParty</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 rounded-lg border px-2 text-[12px]"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Table */}
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : filteredVendors.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[12px] text-black/40">No vendors match this filter.</p>
                <button
                  onClick={() => { setSearchQuery(""); setBrandFilter("all"); setStatusFilter("all"); }}
                  className="mt-2 rounded-lg border px-3 py-1 text-[11px]"
                  style={{ borderColor: "rgba(0,0,0,0.12)" }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <table className="w-full" style={{ tableLayout: "fixed" }}>
                <thead>
                  <tr className="text-left text-[10px] uppercase text-black/30" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.12)" }}>
                    <th style={{ width: "28%" }} className="py-2">Vendor name</th>
                    <th style={{ width: "14%" }}>Brand</th>
                    <th style={{ width: "16%" }}>Category</th>
                    <th style={{ width: "14%" }}>Location</th>
                    <th style={{ width: "14%" }}>Status</th>
                    <th style={{ width: "14%" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map((v) => {
                    const isFood = v.ecosystem === "FINDMYBITES";
                    return (
                      <tr key={v.id} className="text-[12px]" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                        <td className="py-2 font-medium">{v.name}</td>
                        <td><BrandPill ecosystem={v.ecosystem} /></td>
                        <td className="text-black/60">{v.category}</td>
                        <td className="text-black/60">{v.city}, {v.country}</td>
                        <td><StatusBadge status={v.approved ? "approved" : "pending"} /></td>
                        <td>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleAction(v.id, "approved")}
                              disabled={actionLoading === v.id || v.approved}
                              className="grid size-7 place-items-center rounded-lg disabled:opacity-30"
                              style={{ background: GREEN_BG }}
                              title="Approve"
                            >
                              {actionLoading === v.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" style={{ color: GREEN_TEXT }} />}
                            </button>
                            <button
                              onClick={() => handleAction(v.id, "rejected")}
                              disabled={actionLoading === v.id}
                              className="grid size-7 place-items-center rounded-lg disabled:opacity-30"
                              style={{ background: FLAG_BG }}
                              title="Reject"
                            >
                              <X className="size-3" style={{ color: FLAG_TEXT }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Signups chart */}
          <div className="mt-6 rounded-xl bg-white p-4" style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}>
            <h2 className="mb-3 text-[14px] font-medium">Vendor signups (6 months)</h2>
            {/* Custom legend */}
            <div className="mb-3 flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded" style={{ background: CORAL }} />
                <span className="text-[11px]">FindMyBites</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded" style={{ background: PURPLE }} />
                <span className="text-[11px]">PimpMyParty</span>
              </div>
            </div>
            {signupsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={signupsData} barGap={4}>
                  <CartesianGrid vertical={false} stroke="rgba(136,135,128,0.15)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }} contentStyle={{ fontSize: 12, borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.12)" }} />
                  <Bar dataKey="food" fill={CORAL} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="party" fill={PURPLE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-48 w-full" />
            )}
          </div>
        </div>
      </main>

      {/* Slide-over panel */}
      <ReviewPanel vendor={reviewVendor} onClose={() => setReviewVendor(null)} onAction={handleAction} />
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg px-3 py-1 text-[11px] font-medium transition-colors"
      style={{
        background: active ? "rgba(0,0,0,0.06)" : "transparent",
        color: active ? "inherit" : "rgba(0,0,0,0.4)",
      }}
    >
      {label}
    </button>
  );
}
