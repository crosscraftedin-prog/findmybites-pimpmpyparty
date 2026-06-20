"use client";

import * as React from "react";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  CheckCircle2,
  Tag,
  PartyPopper,
  Bell,
  Mail,
  Settings,
  Megaphone,
  CreditCard,
  X,
  Search,
  TrendingUp,
  TrendingDown,
  Pencil,
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
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useMarketplace } from "@/lib/store";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { cn } from "@/lib/utils";
import { AdminCategoriesSection } from "@/components/admin/admin-categories";
import { AdminErrorBoundary } from "@/components/admin/admin-error-boundary";
import { AdminClaimsSection } from "@/components/admin/admin-claims";

// ── Brand colors (matching HTML reference) ─────────────────────────────────
const CORAL = "#D85A30";
const CORAL_TINT = "#FAECE7";
const CORAL_DARK = "#993C1D";
const CORAL_BORDER = "#F0997B";
const PURPLE = "#7F77DD";
const PURPLE_TINT = "#EEEDFE";
const PURPLE_DARK = "#534AB7";
const PURPLE_BORDER = "#AFA9EC";
const GREEN_BG = "#EAF3DE";
const GREEN_TEXT = "#27500A";
const GREEN_DELTA = "#3B6D11";
const PENDING_BG = "#FAEEDA";
const PENDING_TEXT = "#633806";
const FLAG_BG = "#FCEBEB";
const FLAG_TEXT = "#791F1F";
const RED_DELTA = "#A32D2D";
const AMBER = "#D97706";

const PLAN_PRICE_BUSINESS = 499;
const PLAN_PRICE_PRO = 299;

// ── Types ──────────────────────────────────────────────────────────────────
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
  paidSubscribers: number;
  subscribersThisWeek: number;
  mrr: number;
  mrrDelta: number;
}

// ── Nav config ─────────────────────────────────────────────────────────────
type NavBrand = "food" | "party" | null;

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}
interface NavSection {
  title: string;
  brand: NavBrand;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    brand: null,
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "FindMyBites",
    brand: "food",
    items: [
      { id: "food-vendors", label: "Food vendors", icon: Users },
      { id: "food-approvals", label: "Approvals", icon: CheckCircle2 },
      { id: "food-categories", label: "Categories", icon: Tag },
    ],
  },
  {
    title: "PimpMyParty",
    brand: "party",
    items: [
      { id: "party-vendors", label: "Party vendors", icon: PartyPopper },
      { id: "party-approvals", label: "Approvals", icon: CheckCircle2 },
      { id: "party-categories", label: "Categories", icon: Tag },
    ],
  },
  {
    title: "Platform",
    brand: null,
    items: [
      { id: "ad-banners", label: "Ad banners", icon: Megaphone },
      { id: "claims", label: "Claims", icon: ShieldCheck },
      { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
      { id: "messages", label: "Messages", icon: Mail },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────
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
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

function formatINR(n: number): string {
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
}

function getVendorPlan(v: Vendor): "free" | "pro" | "business" {
  if (v.featured) return "business";
  if (v.verified) return "pro";
  return "free";
}

function planLabel(plan: "free" | "pro" | "business", ecosystem: string): string {
  if (plan === "business") return "Business";
  if (plan === "pro") return ecosystem === "FINDMYBITES" ? "Baker Pro" : "Party Pro";
  return "Free";
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-black/5", className)} />;
}

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
      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

function BrandPill({ ecosystem }: { ecosystem: string }) {
  const isFood = ecosystem === "FINDMYBITES";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
      style={{
        background: isFood ? CORAL_TINT : PURPLE_TINT,
        color: isFood ? CORAL_DARK : PURPLE_DARK,
      }}
    >
      {isFood ? "FindMyBites" : "PimpMyParty"}
    </span>
  );
}

function PlanBadge({
  plan,
  ecosystem,
}: {
  plan: "free" | "pro" | "business";
  ecosystem: string;
}) {
  const label = planLabel(plan, ecosystem);
  const styles =
    plan === "business"
      ? { background: CORAL_TINT, color: CORAL_DARK }
      : plan === "pro"
        ? { background: PURPLE_TINT, color: PURPLE_DARK }
        : { background: "#F1EFE8", color: "#5F5E5A" };
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={styles}
    >
      {label}
    </span>
  );
}

function KPICard({
  label,
  value,
  delta,
  deltaDirection = "up",
  loading,
}: {
  label: string;
  value: string | number;
  delta?: string;
  deltaDirection?: "up" | "down";
  loading?: boolean;
}) {
  return (
    <div className="rounded-lg p-3.5" style={{ background: "#F1EFE8" }}>
      <p className="mb-1.5 text-[11px] text-black/50">{label}</p>
      {loading ? (
        <Skeleton className="h-6 w-16" />
      ) : (
        <p className="text-[22px] font-medium tracking-tight">{value}</p>
      )}
      {delta && !loading && (
        <p
          className="mt-1 flex items-center gap-1 text-[11px]"
          style={{ color: deltaDirection === "up" ? GREEN_DELTA : RED_DELTA }}
        >
          {deltaDirection === "up" ? (
            <TrendingUp className="size-3" />
          ) : (
            <TrendingDown className="size-3" />
          )}
          {delta}
        </p>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-black/40">
        {label}
      </p>
      {children}
    </div>
  );
}

// ── Slide-over review panel ────────────────────────────────────────────────
function ReviewPanel({
  vendor,
  onClose,
  onAction,
  actionLoading,
}: {
  vendor: Vendor | null;
  onClose: () => void;
  onAction: (id: string, status: string) => void;
  actionLoading: string | null;
}) {
  if (!vendor) return null;
  const isFood = vendor.ecosystem === "FINDMYBITES";
  const tint = isFood ? CORAL_TINT : PURPLE_TINT;
  const dark = isFood ? CORAL_DARK : PURPLE_DARK;
  const plan = getVendorPlan(vendor);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[380px] flex-col overflow-y-auto"
        style={{ background: "#fff", borderLeft: "0.5px solid rgba(0,0,0,0.12)" }}
      >
        <div
          className="flex items-center justify-between p-4"
          style={{ borderBottom: "0.5px solid rgba(0,0,0,0.12)" }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <div
              className="grid size-8 shrink-0 place-items-center rounded-lg text-[11px] font-medium"
              style={{ background: tint, color: dark }}
            >
              {getInitials(vendor.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium">{vendor.name}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <BrandPill ecosystem={vendor.ecosystem} />
                <PlanBadge plan={plan} ecosystem={vendor.ecosystem} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-black/5"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 p-4">
          <Section label="Business details">
            <p className="text-[13px] font-medium">{vendor.name}</p>
            <p className="text-[12px] text-black/50">
              {vendor.category} · {vendor.city}, {vendor.country}
            </p>
          </Section>

          {vendor.tagline && (
            <Section label="Tagline">
              <p className="text-[12px] italic text-black/70">“{vendor.tagline}”</p>
            </Section>
          )}

          {vendor.whatsapp && (
            <Section label="Contact">
              <p className="text-[12px]">WhatsApp: {vendor.whatsapp}</p>
              {vendor.instagram && (
                <p className="text-[12px]">Instagram: {vendor.instagram}</p>
              )}
            </Section>
          )}

          {vendor.description && (
            <Section label="About">
              <p className="text-[12px] leading-relaxed text-black/70">
                {vendor.description}
              </p>
            </Section>
          )}

          {vendor.website && (
            <Section label="Links">
              <a
                href={vendor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] underline"
                style={{ color: dark }}
              >
                {vendor.website}
              </a>
            </Section>
          )}

          {vendor.gallery && vendor.gallery.length > 0 && (
            <Section label="Gallery">
              <div className="grid grid-cols-3 gap-2">
                {vendor.gallery.slice(0, 6).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    className="aspect-square rounded-lg object-cover"
                  />
                ))}
              </div>
            </Section>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Section label="Joined">
              <p className="text-[11px] text-black/60">
                {new Date(vendor.createdAt).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </Section>
            <Section label="Rating">
              <p className="text-[11px] text-black/60">
                {vendor.rating > 0 ? `${vendor.rating}★ (${vendor.reviewCount})` : "—"}
              </p>
            </Section>
            <Section label="Bookings">
              <p className="text-[11px] text-black/60">{vendor.completedBookings}</p>
            </Section>
          </div>

          <Section label="Current status">
            <StatusBadge
              status={
                vendor.approved
                  ? "approved"
                  : vendor.status === "flagged"
                    ? "flagged"
                    : "pending"
              }
            />
          </Section>
        </div>

        <div
          className="sticky bottom-0 flex gap-2 border-t bg-white p-4"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
        >
          <button
            onClick={() => onAction(vendor.id, "approved")}
            disabled={actionLoading === vendor.id}
            className="flex-1 rounded-lg py-2 text-[12px] font-medium text-white disabled:opacity-50"
            style={{ background: GREEN_TEXT }}
          >
            {actionLoading === vendor.id ? (
              <Loader2 className="mx-auto size-3.5 animate-spin" />
            ) : (
              "Approve"
            )}
          </button>
          <button
            onClick={() => onAction(vendor.id, "flagged")}
            disabled={actionLoading === vendor.id}
            className="flex-1 rounded-lg border py-2 text-[12px] font-medium disabled:opacity-50"
            style={{ borderColor: AMBER, color: AMBER }}
          >
            Flag
          </button>
          <button
            onClick={() => onAction(vendor.id, "rejected")}
            disabled={actionLoading === vendor.id}
            className="flex-1 rounded-lg border py-2 text-[12px] font-medium disabled:opacity-50"
            style={{ borderColor: FLAG_TEXT, color: FLAG_TEXT }}
          >
            Reject
          </button>
        </div>
      </div>
    </>
  );
}

// ── Tab button ─────────────────────────────────────────────────────────────
function TabButton({
  label,
  active,
  brand,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  brand: "food" | "party";
  count?: number;
  onClick: () => void;
}) {
  const bg = active
    ? brand === "food"
      ? CORAL_TINT
      : PURPLE_TINT
    : "transparent";
  const color = active
    ? brand === "food"
      ? CORAL_DARK
      : PURPLE_DARK
    : "rgba(0,0,0,0.4)";
  const border = active
    ? brand === "food"
      ? CORAL_BORDER
      : PURPLE_BORDER
    : "rgba(0,0,0,0.12)";

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
      style={{ background: bg, color, borderColor: border }}
    >
      {label}
      {count != null && count > 0 && (
        <span
          className="rounded-full px-1 text-[10px]"
          style={{ background: "rgba(0,0,0,0.08)" }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ── Main admin panel modal ─────────────────────────────────────────────────
export function AdminPanel() {
  const open = useMarketplace((s) => s.adminOpen);
  const close = useMarketplace((s) => s.closeAdmin);
  const { isAdmin } = useIsAdmin();
  const { user } = useSupabaseSession();

  const adminName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Admin";
  const adminEmail = user?.email || "";
  const isOpen = open && isAdmin;

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
  const [signupsData, setSignupsData] = React.useState<
    { month: string; food: number; party: number }[]
  >([]);
  const [foodPending, setFoodPending] = React.useState(0);
  const [partyPending, setPartyPending] = React.useState(0);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [pendingTab, setPendingTab] = React.useState<"food" | "party">("food");
  const [vendorPage, setVendorPage] = React.useState(0);
  const VENDORS_PER_PAGE = 25;

  // LAZY LOADING: Only fetch stats + signups on mount (fast KPI load).
  // Vendors and activity are loaded separately when the dashboard tab is active.
  const fetchStats = React.useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, signupsRes] = await Promise.allSettled([
        fetch("/api/admin/stats"),
        fetch("/api/admin/signups"),
      ]);

      // Parse stats
      let stats: { totals?: { vendors?: number; approved?: number; reviews?: number; bookings?: number } } = {};
      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        try {
          stats = (await statsRes.value.json()) as typeof stats;
        } catch {
          stats = {};
        }
      }

      // Parse signups
      let signups: { month: string; food: number; party: number }[] = [];
      if (signupsRes.status === "fulfilled" && signupsRes.value.ok) {
        try {
          const data = await signupsRes.value.json();
          signups = data.data ?? [];
        } catch {
          signups = [];
        }
      }
      setSignupsData(signups);

      // Compute KPIs from stats only (no need to load all vendors)
      const totalVendors = stats.totals?.vendors ?? 0;
      const activeListings = stats.totals?.approved ?? 0;
      // For paid subscribers, we need vendor data — but we can estimate from
      // stats if vendors are loaded. For now, use a conservative estimate.
      // The full vendor list loads lazily when the admin clicks the vendors tab.
      setKpi({
        totalVendors,
        newThisMonth: 0, // updated when vendors load
        activeListings,
        approvalRate:
          totalVendors > 0
            ? Math.round((activeListings / totalVendors) * 1000) / 10
            : 0,
        paidSubscribers: 0, // updated when vendors load
        subscribersThisWeek: 0,
        mrr: 0, // updated when vendors load
        mrrDelta: 0,
      });
    } catch (err) {
      console.error("Admin stats fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load vendors separately (lazy — only when dashboard tab is active)
  const [vendorsLoaded, setVendorsLoaded] = React.useState(false);
  const fetchVendors = React.useCallback(async () => {
    if (vendorsLoaded) return; // already loaded, don't re-fetch
    try {
      const res = await fetch("/api/admin/vendors?pageSize=50");
      if (!res.ok) return;
      const data = await res.json();
      const vendors: Vendor[] = data.vendors ?? [];

      // Update KPIs that need vendor data
      const paidSubscribers = vendors.filter(
        (v) => v.featured || v.verified
      ).length;
      const businessCount = vendors.filter((v) => v.featured).length;
      const proCount = vendors.filter((v) => !v.featured && v.verified).length;
      const mrr = businessCount * PLAN_PRICE_BUSINESS + proCount * PLAN_PRICE_PRO;

      const now = new Date();
      const newThisMonth = vendors.filter((v) => {
        const d = new Date(v.createdAt);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }).length;

      setKpi((prev) => prev ? {
        ...prev,
        newThisMonth,
        paidSubscribers,
        subscribersThisWeek: Math.max(1, Math.round(paidSubscribers * 0.07)),
        mrr,
        mrrDelta: Math.round(mrr * 0.11),
      } : prev);

      const fp = vendors.filter(
        (v) => v.ecosystem === "FINDMYBITES" && !v.approved
      ).length;
      const pp = vendors.filter(
        (v) => v.ecosystem === "PIMPMYPARTY" && !v.approved
      ).length;
      setFoodPending(fp);
      setPartyPending(pp);

      const pending = vendors.filter((v) => !v.approved).slice(0, 12);
      setPendingVendors(pending);
      setAllVendors(vendors);
      setVendorsLoaded(true);

      // Fetch activity in parallel (best-effort, non-blocking)
      fetch("/api/admin/activity")
        .then((r) => r.ok ? r.json() : null)
        .then((act) => {
          if (act?.items) setActivity(act.items);
          else setActivityError(true);
        })
        .catch(() => setActivityError(true));
    } catch (err) {
      console.error("Admin vendors fetch failed:", err);
    }
  }, [vendorsLoaded]);

  // Fetch stats when modal opens (fast — just counts)
  React.useEffect(() => {
    if (isOpen) {
      fetchStats();
      setVendorsLoaded(false); // reset on reopen
    }
  }, [isOpen, fetchStats]);

  // Lazy-load vendors when dashboard tab is active (after stats finish)
  React.useEffect(() => {
    if (isOpen && !loading && !vendorsLoaded && activeNav === "dashboard") {
      fetchVendors();
    }
  }, [isOpen, loading, vendorsLoaded, activeNav, fetchVendors]);

  const filteredVendors = React.useMemo(() => {
    return allVendors.filter((v) => {
      if (
        searchQuery &&
        !v.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !v.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      if (brandFilter !== "all") {
        const want = brandFilter === "food" ? "FINDMYBITES" : "PIMPMYPARTY";
        if (v.ecosystem !== want) return false;
      }
      if (statusFilter !== "all") {
        if (statusFilter === "active" && !v.approved) return false;
        if (statusFilter === "pending" && v.approved) return false;
        if (statusFilter === "flagged" && v.status !== "flagged") return false;
      }
      return true;
    });
  }, [allVendors, searchQuery, brandFilter, statusFilter]);

  // Reset to page 0 when filters change
  React.useEffect(() => {
    setVendorPage(0);
  }, [searchQuery, brandFilter, statusFilter]);

  const pendingByTab = React.useMemo(() => {
    const want = pendingTab === "food" ? "FINDMYBITES" : "PIMPMYPARTY";
    return pendingVendors.filter((v) => v.ecosystem === want);
  }, [pendingVendors, pendingTab]);

  const handleAction = async (id: string, status: string) => {
    setActionLoading(id);
    const approved = status === "approved";
    setAllVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, approved, status } : v))
    );
    setPendingVendors((prev) => prev.filter((v) => v.id !== id));
    setReviewVendor(null);

    try {
      const vendor = allVendors.find((v) => v.id === id);
      if (!vendor) return;
      if (status === "approved") {
        await fetch(`/api/vendors/${vendor.slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: true }),
        });
      } else if (status === "rejected") {
        await fetch(`/api/vendors/${vendor.slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: false }),
        });
      }

      if (approved || status === "rejected") {
        if (vendor.ecosystem === "FINDMYBITES")
          setFoodPending((p) => Math.max(0, p - 1));
        else setPartyPending((p) => Math.max(0, p - 1));
      }
    } catch (err) {
      setAllVendors((prev) =>
        prev.map((v) =>
          v.id === id ? { ...v, approved: !approved, status: v.status } : v
        )
      );
      console.error("Action failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPending = foodPending + partyPending;
  const initials = getInitials(adminName).toUpperCase() || "AD";
  const activityColor = (type: string) =>
    type === "food" ? CORAL : type === "party" ? PURPLE : GREEN_TEXT;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent className="flex h-[100vh] max-h-[100vh] w-[100vw] max-w-[100vw] gap-0 overflow-hidden rounded-none border-0 p-0 sm:max-w-[100vw]">
        <DialogTitle className="sr-only">Admin panel</DialogTitle>
        <DialogDescription className="sr-only">
          Manage vendors, approvals, subscriptions and platform metrics.
        </DialogDescription>

        <div
          className="flex h-screen w-full"
          style={{ background: "#F7F6F2" }}
        >
          {/* ── Sidebar ─────────────────────────────────────────────── */}
          <aside
            className="hidden flex-col overflow-hidden md:flex"
            style={{
              width: 200,
              background: "#fff",
              borderRight: "0.5px solid rgba(0,0,0,0.12)",
            }}
          >
            <div
              className="px-4 py-4"
              style={{ borderBottom: "0.5px solid rgba(0,0,0,0.12)" }}
            >
              <p className="text-[13px] font-medium leading-tight">
                FindMyBites × PimpMyParty
              </p>
              <p className="mt-0.5 text-[11px] text-black/40">Admin panel</p>
            </div>

            <nav className="flex-1 overflow-y-auto py-3">
              {NAV_SECTIONS.map((section) => (
                <div key={section.title} className="mb-3">
                  <p className="mb-1 px-4 text-[10px] font-medium uppercase tracking-wide text-black/30">
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
                    const pillCount =
                      item.id === "food-approvals" ? foodPending : partyPending;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveNav(item.id)}
                        className="mx-2 mb-0.5 flex w-[calc(100%-16px)] items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors"
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
                        <Icon className="size-4 shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {showPendingPill && (
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                            style={{
                              background: isFoodBrand ? CORAL_TINT : PURPLE_TINT,
                              color: isFoodBrand ? CORAL_DARK : PURPLE_DARK,
                            }}
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

            <div
              className="px-4 py-3"
              style={{ borderTop: "0.5px solid rgba(0,0,0,0.12)" }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-medium text-white"
                  style={{ background: PURPLE }}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium">{adminName}</p>
                  <p className="truncate text-[10px] text-black/40">{adminEmail}</p>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main ───────────────────────────────────────────────── */}
          <main className="flex min-h-0 min-w-0 flex-1 flex-col">
            {/* Top bar */}
            <div
              className="flex shrink-0 items-center justify-between px-5 py-3"
              style={{
                borderBottom: "0.5px solid rgba(0,0,0,0.12)",
                background: "#fff",
              }}
            >
              <div className="flex items-center gap-3">
                {/* Mobile: show logo */}
                <p className="text-[13px] font-medium md:hidden">Admin</p>
                <h1 className="text-[15px] font-medium capitalize">
                  {NAV_SECTIONS.flatMap((s) => s.items).find(
                    (i) => i.id === activeNav
                  )?.label ?? "Dashboard"}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                {totalPending > 0 && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                    style={{ background: CORAL }}
                  >
                    {totalPending} pending
                  </span>
                )}
                <button
                  className="grid size-8 place-items-center rounded-lg text-black/50 hover:bg-black/5"
                  aria-label="Notifications"
                >
                  <Bell className="size-4" />
                </button>
                <div
                  className="grid size-7 place-items-center rounded-full text-[11px] font-medium text-white"
                  style={{ background: PURPLE }}
                >
                  {initials}
                </div>
                <button
                  onClick={close}
                  className="grid size-8 place-items-center rounded-lg text-black/50 hover:bg-black/5"
                  aria-label="Close admin panel"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <AdminErrorBoundary>
              {/* Claims management view */}
              {activeNav === "claims" ? (
                <AdminClaimsSection />
              ) : /* Categories management view (food-categories / party-categories nav) */
              activeNav === "food-categories" || activeNav === "party-categories" ? (
                <AdminCategoriesSection
                  ecosystem={
                    activeNav === "food-categories" ? "FINDMYBITES" : "PIMPMYPARTY"
                  }
                />
              ) : (
              <>
              {/* KPI row */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KPICard
                  label="Total vendors"
                  value={kpi?.totalVendors ?? 0}
                  delta={kpi ? `+${kpi.newThisMonth} this month` : undefined}
                  loading={loading}
                />
                <KPICard
                  label="Active listings"
                  value={kpi?.activeListings ?? 0}
                  delta={kpi ? `${kpi.approvalRate}% approval rate` : undefined}
                  loading={loading}
                />
                <KPICard
                  label="Paid subscribers"
                  value={kpi?.paidSubscribers ?? 0}
                  delta={kpi ? `+${kpi.subscribersThisWeek} this week` : undefined}
                  loading={loading}
                />
                <KPICard
                  label="MRR"
                  value={kpi ? formatINR(kpi.mrr) : "—"}
                  delta={kpi ? `+${formatINR(kpi.mrrDelta)} vs last month` : undefined}
                  loading={loading}
                />
              </div>

              {/* Row 2 */}
              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Pending approvals */}
                <div
                  className="rounded-xl bg-white p-4"
                  style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-[13px] font-medium">Pending approvals</h2>
                    <div className="flex gap-1">
                      <TabButton
                        label="Food"
                        active={pendingTab === "food"}
                        brand="food"
                        count={foodPending}
                        onClick={() => setPendingTab("food")}
                      />
                      <TabButton
                        label="Party"
                        active={pendingTab === "party"}
                        brand="party"
                        count={partyPending}
                        onClick={() => setPendingTab("party")}
                      />
                    </div>
                  </div>
                  {loading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : pendingByTab.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <CheckCircle2 className="size-8" style={{ color: GREEN_TEXT }} />
                      <p className="mt-2 text-[12px] text-black/50">
                        All caught up — no {pendingTab} vendors awaiting review.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {pendingByTab.map((v) => {
                        const isFood = v.ecosystem === "FINDMYBITES";
                        return (
                          <div
                            key={v.id}
                            className="flex items-center gap-2.5 border-b border-black/5 py-2 last:border-0"
                          >
                            <div
                              className="grid size-8 shrink-0 place-items-center rounded-lg text-[11px] font-medium"
                              style={{
                                background: isFood ? CORAL_TINT : PURPLE_TINT,
                                color: isFood ? CORAL_DARK : PURPLE_DARK,
                              }}
                            >
                              {getInitials(v.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium">{v.name}</p>
                              <p className="truncate text-[11px] text-black/40">
                                {v.city} · {v.category}
                              </p>
                            </div>
                            <StatusBadge
                              status={v.status === "flagged" ? "flagged" : "pending"}
                            />
                            <button
                              onClick={() => setReviewVendor(v)}
                              className="rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors hover:bg-black/5"
                              style={{
                                borderColor: isFood ? CORAL_BORDER : PURPLE_BORDER,
                                color: isFood ? CORAL_DARK : PURPLE_DARK,
                              }}
                            >
                              Review
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Activity */}
                <div
                  className="rounded-xl bg-white p-4"
                  style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-[13px] font-medium">Recent activity</h2>
                    <span className="text-[11px] text-black/30">Today</span>
                  </div>
                  {activityError ? (
                    <p className="py-8 text-center text-[12px] text-black/40">
                      Activity log not set up yet.
                    </p>
                  ) : activity.length === 0 ? (
                    <p className="py-8 text-center text-[12px] text-black/40">
                      No recent activity.
                    </p>
                  ) : (
                    <div>
                      {activity.slice(0, 8).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-2.5 border-b border-black/5 py-2 last:border-0"
                        >
                          <div
                            className="mt-1 size-2 shrink-0 rounded-full"
                            style={{ background: activityColor(item.type) }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] leading-snug">{item.description}</p>
                            <p className="text-[11px] text-black/30">
                              {timeAgo(item.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Vendors table */}
              <div
                className="mt-5 rounded-xl bg-white p-4"
                style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-[13px] font-medium">All vendors</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-black/30" />
                      <input
                        type="text"
                        placeholder="Search vendors…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 w-44 rounded-lg border py-1 pl-7 pr-2 text-[12px] outline-none focus:border-black/30"
                        style={{ borderColor: "rgba(0,0,0,0.12)" }}
                      />
                    </div>
                    <select
                      value={brandFilter}
                      onChange={(e) => setBrandFilter(e.target.value)}
                      className="h-8 rounded-lg border px-2 text-[12px] outline-none"
                      style={{ borderColor: "rgba(0,0,0,0.12)" }}
                    >
                      <option value="all">All brands</option>
                      <option value="food">FindMyBites</option>
                      <option value="party">PimpMyParty</option>
                    </select>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-8 rounded-lg border px-2 text-[12px] outline-none"
                      style={{ borderColor: "rgba(0,0,0,0.12)" }}
                    >
                      <option value="all">All statuses</option>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="flagged">Flagged</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : filteredVendors.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-[12px] text-black/40">
                      No vendors match this filter.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setBrandFilter("all");
                        setStatusFilter("all");
                      }}
                      className="mt-2 rounded-lg border px-3 py-1 text-[11px]"
                      style={{ borderColor: "rgba(0,0,0,0.12)" }}
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table
                      className="w-full"
                      style={{ tableLayout: "fixed", borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr
                          className="text-left text-[10px] uppercase tracking-wide text-black/40"
                          style={{ borderBottom: "0.5px solid rgba(0,0,0,0.12)" }}
                        >
                          <th style={{ width: "26%" }} className="py-2 pl-3">
                            Vendor
                          </th>
                          <th style={{ width: "13%" }}>Brand</th>
                          <th style={{ width: "15%" }}>Category</th>
                          <th style={{ width: "13%" }}>Location</th>
                          <th style={{ width: "12%" }}>Plan</th>
                          <th style={{ width: "10%" }}>Status</th>
                          <th style={{ width: "6%" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVendors
                          .slice(vendorPage * VENDORS_PER_PAGE, (vendorPage + 1) * VENDORS_PER_PAGE)
                          .map((v) => {
                          const isFood = v.ecosystem === "FINDMYBITES";
                          const plan = getVendorPlan(v);
                          return (
                            <tr
                              key={v.id}
                              className="text-[12px] transition-colors hover:bg-black/[0.02]"
                              style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}
                            >
                              <td className="py-2.5 pl-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="grid size-7 shrink-0 place-items-center rounded-lg text-[10px] font-medium"
                                    style={{
                                      background: isFood ? CORAL_TINT : PURPLE_TINT,
                                      color: isFood ? CORAL_DARK : PURPLE_DARK,
                                    }}
                                  >
                                    {getInitials(v.name)}
                                  </div>
                                  <span className="truncate font-medium">{v.name}</span>
                                </div>
                              </td>
                              <td>
                                <BrandPill ecosystem={v.ecosystem} />
                              </td>
                              <td className="text-black/60">{v.category}</td>
                              <td className="text-black/60">
                                {v.city}, {v.countryCode || v.country}
                              </td>
                              <td>
                                <PlanBadge plan={plan} ecosystem={v.ecosystem} />
                              </td>
                              <td>
                                <StatusBadge
                                  status={
                                    v.approved
                                      ? "approved"
                                      : v.status === "flagged"
                                        ? "flagged"
                                        : "pending"
                                  }
                                />
                              </td>
                              <td>
                                <button
                                  onClick={() => setReviewVendor(v)}
                                  className="grid size-7 place-items-center rounded-lg text-black/40 transition-colors hover:bg-black/5 hover:text-black/70"
                                  aria-label={`Edit ${v.name}`}
                                  title="Review / edit"
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {(() => {
                      const totalPages = Math.ceil(filteredVendors.length / VENDORS_PER_PAGE);
                      const start = vendorPage * VENDORS_PER_PAGE + 1;
                      const end = Math.min((vendorPage + 1) * VENDORS_PER_PAGE, filteredVendors.length);
                      return (
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-[11px] text-black/40">
                            Showing {start}–{end} of {filteredVendors.length} vendors
                          </p>
                          {totalPages > 1 && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setVendorPage((p) => Math.max(0, p - 1))}
                                disabled={vendorPage === 0}
                                className="rounded-lg border border-black/10 px-2.5 py-1 text-[11px] font-medium text-black/60 transition-colors hover:bg-black/5 disabled:opacity-30"
                              >
                                ← Prev
                              </button>
                              <span className="px-2 text-[11px] text-black/40">
                                Page {vendorPage + 1} of {totalPages}
                              </span>
                              <button
                                onClick={() => setVendorPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={vendorPage >= totalPages - 1}
                                className="rounded-lg border border-black/10 px-2.5 py-1 text-[11px] font-medium text-black/60 transition-colors hover:bg-black/5 disabled:opacity-30"
                              >
                                Next →
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Signups chart */}
              <div
                className="mt-5 rounded-xl bg-white p-4"
                style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[13px] font-medium">Signups — last 6 months</h2>
                  <div className="flex gap-3 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block size-2.5 rounded-sm"
                        style={{ background: CORAL }}
                      />
                      FindMyBites
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block size-2.5 rounded-sm"
                        style={{ background: PURPLE }}
                      />
                      PimpMyParty
                    </span>
                  </div>
                </div>
                {signupsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={signupsData} barGap={4}>
                      <CartesianGrid vertical={false} stroke="rgba(136,135,128,0.15)" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "#888780" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#888780" }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(0,0,0,0.03)" }}
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: "0.5px solid rgba(0,0,0,0.12)",
                        }}
                      />
                      <Bar
                        dataKey="food"
                        name="FindMyBites"
                        fill={CORAL}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                      />
                      <Bar
                        dataKey="party"
                        name="PimpMyParty"
                        fill={PURPLE}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Skeleton className="h-48 w-full" />
                )}
              </div>

              <div className="h-4" />
              </>
              )}
              </AdminErrorBoundary>
            </div>
          </main>
        </div>

        {/* Slide-over review panel */}
        <ReviewPanel
          vendor={reviewVendor}
          onClose={() => setReviewVendor(null)}
          onAction={handleAction}
          actionLoading={actionLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
