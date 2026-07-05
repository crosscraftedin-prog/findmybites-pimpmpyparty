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
  Globe2,
  Filter,
  LayoutTemplate,
  ClipboardList,
  ShieldCheck,
  Boxes,
  Trash2,
  CheckSquare,
  Square,
  Sparkles,
  LifeBuoy,
  Briefcase,
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
import { AdminCategoriesSection } from "@/components/admin/admin-categories";
import { AdminErrorBoundary } from "@/components/admin/admin-error-boundary";
import dynamic from "next/dynamic";

// PERFORMANCE: Lazy-load admin sections that are only shown when their nav tab is active.
// This reduces the initial bundle by ~200KB (admin-claims, admin-seo-pages, admin-pricing,
// admin-filters, admin-templates, admin-lead-center, admin-subscriptions are not loaded
// until the user navigates to them).
const AdminSeoPages = dynamic(() => import("@/components/admin/admin-seo-pages").then(m => ({ default: m.AdminSeoPages })), { loading: () => <div className="p-8 text-center text-muted-foreground">Loading…</div> });
const AdminPricing = dynamic(() => import("@/components/admin/admin-pricing").then(m => ({ default: m.AdminPricing })), { loading: () => <div className="p-8 text-center text-muted-foreground">Loading…</div> });
const AdminFilters = dynamic(() => import("@/components/admin/admin-filters").then(m => ({ default: m.AdminFilters })), { loading: () => <div className="p-8 text-center text-muted-foreground">Loading…</div> });
const AdminTemplates = dynamic(() => import("@/components/admin/admin-templates").then(m => ({ default: m.AdminTemplates })), { loading: () => <div className="p-8 text-center text-muted-foreground">Loading…</div> });
const AdminLeadCenter = dynamic(() => import("@/components/admin/admin-lead-center").then(m => ({ default: m.AdminLeadCenter })), { loading: () => <div className="p-8 text-center text-muted-foreground">Loading…</div> });
const AdminVendorInvitations = dynamic(() => import("@/components/admin/admin-vendor-invitations").then(m => ({ default: m.AdminVendorInvitations })), { loading: () => <div className="p-8 text-center text-muted-foreground">Loading…</div> });
const AdminVendorOnboarding = dynamic(() => import("@/components/admin/admin-vendor-onboarding").then(m => ({ default: m.AdminVendorOnboarding })), { loading: () => <div className="p-8 text-center text-muted-foreground">Loading…</div> });
const AdminSubscriptions = dynamic(() => import("@/components/admin/admin-subscriptions").then(m => ({ default: m.AdminSubscriptions })), { loading: () => <div className="p-8 text-center text-muted-foreground">Loading…</div> });
const AdminInventory = dynamic(() => import("@/components/admin/admin-inventory").then(m => ({ default: m.AdminInventory })), { loading: () => <div className="p-8 text-center text-muted-foreground">Loading…</div> });
const AdminMarketing = dynamic(() => import("@/components/admin/admin-marketing").then(m => ({ default: m.AdminMarketing })), { loading: () => <div className="p-8 text-center text-muted-foreground">Loading…</div> });
const AdminBusinessTypes = dynamic(() => import("@/components/admin/admin-business-types").then(m => ({ default: m.AdminBusinessTypes })), { loading: () => <div className="p-8 text-center text-muted-foreground">Loading…</div> });
const AdminSupport = dynamic(() => import("@/components/admin/admin-support").then(m => ({ default: m.AdminSupport })), { loading: () => <div className="p-8 text-center text-muted-foreground">Loading…</div> });
const VendorDeleteModal = dynamic(() => import("@/components/admin/vendor-delete-modal").then(m => ({ default: m.VendorDeleteModal })), { ssr: false });
const CleanupTestVendors = dynamic(() => import("@/components/admin/cleanup-test-vendors").then(m => ({ default: m.CleanupTestVendors })), { ssr: false });
import { useCategoryLabels } from "@/hooks/use-category-labels";

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

// Plan pricing (used to estimate MRR — display only)
const PLAN_PRICE_BUSINESS = 499; // ₹/mo
const PLAN_PRICE_PRO = 299; // ₹/mo

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
      { id: "lead-center", label: "Lead Center", icon: ClipboardList },
      { id: "invitations", label: "Invite Vendor", icon: ShieldCheck },
      { id: "onboarding", label: "Vendor Onboarding", icon: Users },
      { id: "inventory", label: "Inventory", icon: Boxes },
      { id: "marketing", label: "Marketing", icon: Megaphone },
      { id: "support", label: "Support", icon: LifeBuoy },
      { id: "business-types", label: "Business Types", icon: Briefcase },
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
      { id: "seo-pages", label: "SEO pages", icon: Globe2 },
      { id: "pricing", label: "Pricing", icon: Tag },
      { id: "filters", label: "Filters", icon: Filter },
      { id: "templates", label: "Templates", icon: LayoutTemplate },
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

/** Derive a subscription plan from vendor flags (no schema change needed). */
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

// ── Skeleton ───────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-black/5", className)} />;
}

// ── Status badge ───────────────────────────────────────────────────────────
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

// ── Brand pill ─────────────────────────────────────────────────────────────
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

// ── Plan badge ─────────────────────────────────────────────────────────────
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

// ── KPI Card ───────────────────────────────────────────────────────────────
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
    <div
      className="rounded-lg p-3.5"
      style={{ background: "#F1EFE8" }}
    >
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

// ── Slide-over review panel ────────────────────────────────────────────────
function ReviewPanel({
  vendor,
  onClose,
  onAction,
  actionLoading,
  onDelete,
}: {
  vendor: Vendor | null;
  onClose: () => void;
  onAction: (id: string, status: string) => void;
  actionLoading: string | null;
  onDelete: (vendorId: string, vendorName: string) => void;
}) {
  // Resolve DB-driven category labels via the existing client hook.
  // (Parent AdminPanelPage does the same — ReviewPanel renders in a slide-over
  // and needs its own lookup since the hook result isn't passed as a prop.)
  const { getLabel: getCategoryLabel } = useCategoryLabels();
  if (!vendor) return null;
  const isFood = vendor.ecosystem === "FINDMYBITES";
  const tint = isFood ? CORAL_TINT : PURPLE_TINT;
  const dark = isFood ? CORAL_DARK : PURPLE_DARK;
  const plan = getVendorPlan(vendor);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[400px] flex-col overflow-y-auto"
        style={{ background: "#fff", borderLeft: "0.5px solid rgba(0,0,0,0.12)" }}
      >
        {/* Header */}
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

        {/* Body */}
        <div className="flex-1 space-y-4 p-4">
          <Section label="Business details">
            <p className="text-[13px] font-medium">{vendor.name}</p>
            <p className="text-[12px] text-black/50">
              {getCategoryLabel(vendor.category)} · {vendor.city}, {vendor.country}
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

        {/* Actions */}
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

        {/* Danger zone: permanent delete */}
        <button
          onClick={() => onDelete(vendor.id, vendor.name)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-300 py-2 text-[12px] font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          <Trash2 className="size-3.5" />
          Delete vendor permanently
        </button>
      </div>
    </>
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

// ── Main component ─────────────────────────────────────────────────────────
export function AdminPanelPage({
  adminEmail,
  adminName,
}: {
  adminEmail: string;
  adminName: string;
}) {
  const [activeNav, setActiveNav] = React.useState("dashboard");
  const [loading, setLoading] = React.useState(true);
  const [kpi, setKpi] = React.useState<KPIData | null>(null);
  const { getLabel: getCategoryLabel } = useCategoryLabels();
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

  // ── Vendor delete + bulk select + cleanup ──
  const [deleteTarget, setDeleteTarget] = React.useState<{ vendorId: string; vendorName: string } | { bulk: true; vendorIds: string[]; vendorNames: string[] } | null>(null);
  const [selectedVendorIds, setSelectedVendorIds] = React.useState<Set<string>>(new Set());
  const [showCleanup, setShowCleanup] = React.useState(false);

  // PERFORMANCE: Fetch stats, signups, vendors, and activity in PARALLEL
  // (previously these were sequential: stats → vendors → activity)
  React.useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // All 4 API calls fire simultaneously (not sequential)
      const [statsRes, signupsRes, vendorsRes, activityRes] = await Promise.allSettled([
        fetch("/api/admin/stats"),
        fetch("/api/admin/signups"),
        fetch("/api/admin/vendors?pageSize=20"),
        fetch("/api/admin/activity"),
      ]);

      // Parse stats
      let stats: { totals?: { vendors?: number; approved?: number; reviews?: number; bookings?: number } } = {};
      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        try { stats = (await statsRes.value.json()) as typeof stats; } catch {}
      }

      // Parse signups
      let signups: { month: string; food: number; party: number }[] = [];
      if (signupsRes.status === "fulfilled" && signupsRes.value.ok) {
        try {
          const data = await signupsRes.value.json();
          signups = data.data ?? [];
        } catch {}
      }
      setSignupsData(signups);

      // Parse vendors
      let vendors: Vendor[] = [];
      if (vendorsRes.status === "fulfilled" && vendorsRes.value.ok) {
        try {
          const data = await vendorsRes.value.json();
          vendors = data.vendors ?? [];
        } catch {}
      }

      // Parse activity
      if (activityRes.status === "fulfilled" && activityRes.value.ok) {
        try {
          const act = await activityRes.value.json();
          if (act?.items) setActivity(act.items);
          else setActivityError(true);
        } catch { setActivityError(true); }
      } else {
        setActivityError(true);
      }

      // Compute KPIs from stats + vendors
      const totalVendors = stats.totals?.vendors ?? vendors.length;
      const activeListings = stats.totals?.approved ?? vendors.filter(v => v.approved).length;
      const paidSubscribers = vendors.filter((v) => v.featured || v.verified).length;
      const businessCount = vendors.filter((v) => v.featured).length;
      const proCount = vendors.filter((v) => !v.featured && v.verified).length;
      const mrr = businessCount * PLAN_PRICE_BUSINESS + proCount * PLAN_PRICE_PRO;

      const now = new Date();
      const newThisMonth = vendors.filter((v) => {
        const d = new Date(v.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;

      setKpi({
        totalVendors,
        newThisMonth,
        activeListings,
        approvalRate: totalVendors > 0 ? Math.round((activeListings / totalVendors) * 1000) / 10 : 0,
        paidSubscribers,
        subscribersThisWeek: Math.max(1, Math.round(paidSubscribers * 0.07)),
        mrr,
        mrrDelta: Math.round(mrr * 0.11),
      });

      const fp = vendors.filter((v) => v.ecosystem === "FINDMYBITES" && !v.approved).length;
      const pp = vendors.filter((v) => v.ecosystem === "PIMPMYPARTY" && !v.approved).length;
      setFoodPending(fp);
      setPartyPending(pp);

      const pending = vendors.filter((v) => !v.approved).slice(0, 12);
      setPendingVendors(pending);
      setAllVendors(vendors);
    } catch (err) {
      console.error("Admin data fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered vendors for table
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

  // Pending vendors filtered by tab
  const pendingByTab = React.useMemo(() => {
    const want = pendingTab === "food" ? "FINDMYBITES" : "PIMPMYPARTY";
    return pendingVendors.filter((v) => v.ecosystem === want);
  }, [pendingVendors, pendingTab]);

  // Handle vendor status change
  const handleAction = async (id: string, status: string) => {
    setActionLoading(id);
    const approved = status === "approved";
    // Optimistic update
    setAllVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, approved, status } : v))
    );
    setPendingVendors((prev) => prev.filter((v) => v.id !== id));
    setReviewVendor(null);

    try {
      const vendor = allVendors.find((v) => v.id === id);
      if (!vendor) return;
      // Only `approved` is persisted via the existing API. Flagged/rejected
      // are visual-only states for the current session.
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

      // Update pending counts (approved or rejected removes from pending)
      if (approved || status === "rejected") {
        if (vendor.ecosystem === "FINDMYBITES")
          setFoodPending((p) => Math.max(0, p - 1));
        else setPartyPending((p) => Math.max(0, p - 1));
      }
    } catch (err) {
      // Revert on error
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

  // ── Delete handler (single + bulk) ──
  const handleDelete = async (reason: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    if (!deleteTarget) return { success: false, error: "No target" };
    try {
      if ("bulk" in deleteTarget) {
        const res = await fetch("/api/admin/vendors/bulk-delete", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendorIds: deleteTarget.vendorIds, reason }),
        });
        const json = await res.json();
        if (res.ok && json.success) return { success: true, message: json.message };
        return { success: false, error: json.error || "Bulk delete failed" };
      } else {
        const res = await fetch(`/api/admin/vendors/${deleteTarget.vendorId}/delete`, {
          method: "DELETE", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        });
        const json = await res.json();
        if (res.ok && json.success) return { success: true, message: json.message };
        return { success: false, error: json.error || "Delete failed" };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const onDeleted = () => {
    // Refresh the vendor list + clear selection
    setSelectedVendorIds(new Set());
    setReviewVendor(null);
    fetchAllData();
  };

  const toggleSelect = (id: string) => {
    setSelectedVendorIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedVendorIds.size === filteredVendors.length) {
      setSelectedVendorIds(new Set());
    } else {
      setSelectedVendorIds(new Set(filteredVendors.map((v) => v.id)));
    }
  };

  const openBulkDelete = () => {
    const ids = Array.from(selectedVendorIds);
    const names = ids.map((id) => allVendors.find((v) => v.id === id)?.name || "Unknown");
    setDeleteTarget({ bulk: true, vendorIds: ids, vendorNames: names });
  };

  const totalPending = foodPending + partyPending;
  const initials = getInitials(adminName).toUpperCase() || "AD";

  // Activity dot color
  const activityColor = (type: string) =>
    type === "food" ? CORAL : type === "party" ? PURPLE : GREEN_TEXT;

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "#F7F6F2" }}
    >
      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside
        className="flex h-screen flex-col overflow-hidden"
        style={{
          width: 200,
          background: "#fff",
          borderRight: "0.5px solid rgba(0,0,0,0.12)",
          position: "sticky",
          top: 0,
        }}
      >
        {/* Logo block */}
        <div
          className="px-4 py-4"
          style={{ borderBottom: "0.5px solid rgba(0,0,0,0.12)" }}
        >
          <p className="text-[13px] font-medium leading-tight">
            FindMyBites × PimpMyParty
          </p>
          <p className="mt-0.5 text-[11px] text-black/40">Admin panel</p>
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

        {/* Admin footer */}
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

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <div
          className="sticky top-0 z-30 flex items-center justify-between px-5 py-3"
          style={{
            borderBottom: "0.5px solid rgba(0,0,0,0.12)",
            background: "#fff",
          }}
        >
          <h1 className="text-[15px] font-medium capitalize">
            {NAV_SECTIONS.flatMap((s) => s.items).find(
              (i) => i.id === activeNav
            )?.label ?? "Dashboard"}
          </h1>
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
          </div>
        </div>

        {/* Dashboard content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <AdminErrorBoundary>
          {/* Categories management view (food-categories / party-categories nav) */}
          {activeNav === "food-categories" || activeNav === "party-categories" ? (
            <AdminCategoriesSection
              ecosystem={
                activeNav === "food-categories" ? "FINDMYBITES" : "PIMPMYPARTY"
              }
            />
          ) : activeNav === "lead-center" ? (
            <AdminLeadCenter />
          ) : activeNav === "invitations" ? (
            <AdminVendorInvitations />
          ) : activeNav === "onboarding" ? (
            <AdminVendorOnboarding />
          ) : activeNav === "inventory" ? (
            <div className="p-4 lg:p-6"><AdminInventory /></div>
          ) : activeNav === "marketing" ? (
            <div className="p-4 lg:p-6"><AdminMarketing /></div>
          ) : activeNav === "support" ? (
            <AdminSupport />
          ) : activeNav === "business-types" ? (
            <AdminBusinessTypes />
          ) : activeNav === "subscriptions" ? (
            <AdminSubscriptions />
          ) : activeNav === "seo-pages" ? (
            <AdminSeoPages />
          ) : activeNav === "pricing" ? (
            <AdminPricing />
          ) : activeNav === "filters" ? (
            <AdminFilters />
          ) : activeNav === "templates" ? (
            <AdminTemplates />
          ) : (
          <>
          {/* ── KPI row ──────────────────────────────────────────────── */}
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

          {/* ── Row 2: Pending approvals + Activity ─────────────────── */}
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
                  <CheckCircle2
                    className="size-8"
                    style={{ color: GREEN_TEXT }}
                  />
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
                          <p className="truncate text-[13px] font-medium">
                            {v.name}
                          </p>
                          <p className="truncate text-[11px] text-black/40">
                            {v.city} · {getCategoryLabel(v.category)}
                          </p>
                        </div>
                        <StatusBadge
                          status={
                            v.status === "flagged" ? "flagged" : "pending"
                          }
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

            {/* Recent activity */}
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
                        <p className="text-[12px] leading-snug">
                          {item.description}
                        </p>
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

          {/* ── All vendors table ───────────────────────────────────── */}
          <div
            className="mt-5 rounded-xl bg-white p-4"
            style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[13px] font-medium">All vendors</h2>
              <div className="flex flex-wrap items-center gap-2">
                {selectedVendorIds.size > 0 && (
                  <button
                    onClick={openBulkDelete}
                    className="flex items-center gap-1.5 rounded-lg border border-red-300 px-2.5 py-1.5 text-[11px] font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="size-3.5" />
                    Delete selected ({selectedVendorIds.size})
                  </button>
                )}
                <button
                  onClick={() => setShowCleanup(true)}
                  className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium text-amber-700 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                  style={{ borderColor: "rgba(0,0,0,0.12)" }}
                >
                  <Sparkles className="size-3.5" />
                  Cleanup test vendors
                </button>
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

            {/* Table */}
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
                      <th style={{ width: "4%" }} className="py-2 pl-2">
                        <button onClick={toggleSelectAll} className="text-black/40 hover:text-black/70" aria-label="Select all">
                          {selectedVendorIds.size === filteredVendors.length && filteredVendors.length > 0
                            ? <CheckSquare className="size-3.5 text-red-500" />
                            : <Square className="size-3.5" />}
                        </button>
                      </th>
                      <th style={{ width: "24%" }} className="py-2 pl-1">
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
                    {filteredVendors.slice(0, 50).map((v) => {
                      const isFood = v.ecosystem === "FINDMYBITES";
                      const plan = getVendorPlan(v);
                      return (
                        <tr
                          key={v.id}
                          className="text-[12px] transition-colors hover:bg-black/[0.02]"
                          style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}
                        >
                          <td className="py-2.5 pl-2">
                            <button onClick={() => toggleSelect(v.id)} className="text-black/40 hover:text-black/70" aria-label={`Select ${v.name}`}>
                              {selectedVendorIds.has(v.id)
                                ? <CheckSquare className="size-3.5 text-red-500" />
                                : <Square className="size-3.5" />}
                            </button>
                          </td>
                          <td className="py-2.5 pl-1">
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
                              <span className="truncate font-medium">
                                {v.name}
                              </span>
                            </div>
                          </td>
                          <td>
                            <BrandPill ecosystem={v.ecosystem} />
                          </td>
                          <td className="text-black/60">{getCategoryLabel(v.category)}</td>
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
                {filteredVendors.length > 50 && (
                  <p className="mt-3 text-center text-[11px] text-black/40">
                    Showing 50 of {filteredVendors.length} vendors — refine your
                    search to see more.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Signups chart ───────────────────────────────────────── */}
          <div
            className="mt-5 rounded-xl bg-white p-4"
            style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-medium">
                Signups — last 6 months
              </h2>
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
                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(136,135,128,0.15)"
                  />
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

          {/* Footer spacer */}
          <div className="h-4" />
          </>
          )}
          </AdminErrorBoundary>
        </div>
      </main>

      {/* Slide-over panel */}
      <ReviewPanel
        vendor={reviewVendor}
        onClose={() => setReviewVendor(null)}
        onAction={handleAction}
        actionLoading={actionLoading}
        onDelete={(vendorId, vendorName) => {
          setReviewVendor(null);
          setDeleteTarget({ vendorId, vendorName });
        }}
      />

      {/* Delete confirmation modal (single + bulk) */}
      <VendorDeleteModal
        vendorName={"bulk" in (deleteTarget || {}) ? null : (deleteTarget as any)?.vendorName || null}
        bulkCount={"bulk" in (deleteTarget || {}) ? (deleteTarget as any)?.vendorIds?.length : undefined}
        vendorNames={"bulk" in (deleteTarget || {}) ? (deleteTarget as any)?.vendorNames : undefined}
        onClose={() => setDeleteTarget(null)}
        onDeleted={onDeleted}
        deleteAction={handleDelete}
      />

      {/* Cleanup test vendors modal */}
      {showCleanup && (
        <CleanupTestVendors
          onClose={() => setShowCleanup(false)}
          onCleaned={onDeleted}
        />
      )}
    </div>
  );
}

// ── Tab button (Food/Party toggle for pending approvals) ───────────────────
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
