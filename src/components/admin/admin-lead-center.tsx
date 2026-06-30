"use client";

import * as React from "react";
import {
  Loader2,
  Search,
  Inbox,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Clock,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  CalendarDays,
  Users,
  Wallet,
  Image as ImageIcon,
  UserCog,
  ArrowRight,
  RefreshCw,
  Star,
  ExternalLink,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { timeAgo } from "@/lib/format";
import type { BookingStatus } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A booking row as returned by /api/admin/bookings, enriched with vendor info
 * (name, city, slug, category, rating, reviewCount).
 */
interface AdminLead extends Booking {
  vendorName: string;
  vendorCity: string;
  vendorSlug?: string | null;
  vendorCategory?: string | null;
  vendorRating?: number | null;
  vendorReviewCount?: number | null;
}

/** Required Booking fields used here — kept minimal so we don't fight the full Booking type. */
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
  status: BookingStatus;
  createdAt: string;
  phone?: string | null;
  eventTime?: string | null;
  address?: string | null;
  notes?: string | null;
  referenceImage?: string | null;
  preferredContact?: string | null;
  productId?: string | null;
  aiSummary?: string | null;
  leadScore?: number | null;
  aiQualification?: string | null;
  conciergeEventId?: string | null;
}

interface ApiResponse {
  bookings: AdminLead[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ConciergeEvent {
  id: string;
  customerName: string;
  customerEmail: string;
  eventType: string;
  eventDate: string;
  status: string;
  eventManager?: string | null;
}

/** Active pipeline stages (excludes terminal "cancelled"). Order matters for the overview. */
const PIPELINE_STAGES: { id: BookingStatus; label: string; short: string }[] = [
  { id: "new", label: "New", short: "New" },
  { id: "viewed", label: "Viewed", short: "Viewed" },
  { id: "contacted", label: "Contacted", short: "Contacted" },
  { id: "quote_sent", label: "Quote Sent", short: "Quote" },
  { id: "negotiating", label: "Negotiating", short: "Negot." },
  { id: "deposit_paid", label: "Deposit Paid", short: "Deposit" },
  { id: "confirmed", label: "Confirmed", short: "Confirm" },
  { id: "completed", label: "Completed", short: "Done" },
];

const ALL_STATUSES: { id: BookingStatus; label: string }[] = [
  ...PIPELINE_STAGES,
  { id: "cancelled", label: "Cancelled" },
];

type StatusFilter = "all" | BookingStatus;
type SortOption = "newest" | "lead_score" | "event_date";
type ScoreFilter = "all" | "hot" | "warm" | "cold";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers (display metadata)
// ─────────────────────────────────────────────────────────────────────────────

function statusMeta(status: string): { label: string; chipClass: string; dotClass: string } {
  switch (status) {
    case "new":
    case "pending":
      return { label: "New", chipClass: "bg-brand/10 text-brand border-brand/20", dotClass: "bg-brand" };
    case "viewed":
      return { label: "Viewed", chipClass: "bg-slate-100 text-slate-700 border-slate-200", dotClass: "bg-slate-400" };
    case "contacted":
      return { label: "Contacted", chipClass: "bg-blue-50 text-blue-700 border-blue-200", dotClass: "bg-blue-500" };
    case "quote_sent":
      return { label: "Quote Sent", chipClass: "bg-violet-50 text-violet-700 border-violet-200", dotClass: "bg-violet-500" };
    case "negotiating":
      return { label: "Negotiating", chipClass: "bg-amber-50 text-amber-700 border-amber-200", dotClass: "bg-amber-500" };
    case "deposit_paid":
      return { label: "Deposit Paid", chipClass: "bg-teal-50 text-teal-700 border-teal-200", dotClass: "bg-teal-500" };
    case "confirmed":
      return { label: "Confirmed", chipClass: "bg-emerald-50 text-emerald-700 border-emerald-200", dotClass: "bg-emerald-500" };
    case "completed":
      return { label: "Completed", chipClass: "bg-green-100 text-green-800 border-green-200", dotClass: "bg-green-600" };
    case "cancelled":
    case "declined":
      return { label: "Cancelled", chipClass: "bg-rose-50 text-rose-700 border-rose-200", dotClass: "bg-rose-500" };
    default:
      return { label: status, chipClass: "bg-muted text-muted-foreground border-border", dotClass: "bg-muted-foreground" };
  }
}

function leadScoreMeta(score: number | null | undefined): { label: string; class: string } | null {
  if (score === null || score === undefined || Number.isNaN(score)) return null;
  if (score >= 80) return { label: `Hot · ${score}`, class: "bg-emerald-500 text-white border-emerald-600" };
  if (score >= 50) return { label: `Warm · ${score}`, class: "bg-amber-400 text-amber-950 border-amber-500" };
  return { label: `Cold · ${score}`, class: "bg-slate-200 text-slate-700 border-slate-300" };
}

function parseQualification(raw: string | null | undefined): Record<string, string> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (v === null || v === undefined) continue;
        out[k] = typeof v === "string" ? v : String(v);
      }
      return Object.keys(out).length > 0 ? out : null;
    }
  } catch {
    /* ignore malformed JSON */
  }
  return null;
}

function normalizeWaPhone(phone: string): string {
  return phone.trim().replace(/[^\d]/g, "");
}

function formatEventDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function AdminLeadCenter() {
  const [leads, setLeads] = React.useState<AdminLead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(25);
  const [totalPages, setTotalPages] = React.useState(1);

  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [sort, setSort] = React.useState<SortOption>("newest");
  const [scoreFilter, setScoreFilter] = React.useState<ScoreFilter>("all");
  const [dateFrom, setDateFrom] = React.useState<string>("");
  const [dateTo, setDateTo] = React.useState<string>("");

  const [selectedLead, setSelectedLead] = React.useState<AdminLead | null>(null);

  // ── Fetch leads ──
  const fetchLeads = React.useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const qs = new URLSearchParams();
        if (statusFilter !== "all") {
          // Treat "new" as the canonical pipeline stage; backend stores "new" (not "pending")
          qs.set("status", statusFilter === "new" ? "new" : statusFilter);
        }
        qs.set("page", String(page));
        qs.set("pageSize", String(pageSize));

        const res = await fetch(`/api/admin/bookings?${qs.toString()}`);
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const data = (await res.json()) as ApiResponse;
        setLeads(data.bookings ?? []);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to fetch leads");
        setLeads([]);
      } finally {
        if (silent) setRefreshing(false);
        else setLoading(false);
      }
    },
    [statusFilter, page, pageSize]
  );

  React.useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch, scoreFilter, dateFrom, dateTo, sort]);

  // Debounce search input
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  // ── Pipeline counts (from currently loaded page only — best-effort given pagination) ──
  const counts = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of leads) {
      const key = l.status === "pending" ? "new" : l.status;
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [leads]);

  const cancelledCount = (counts["cancelled"] ?? 0) + (counts["declined"] ?? 0);
  const confirmedCount = counts["confirmed"] ?? 0;
  const totalThisView = leads.length;

  // ── Stats bar ──
  const stats = React.useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = leads.filter((l) => new Date(l.createdAt) >= monthStart).length;
    const scored = leads.filter((l) => typeof l.leadScore === "number");
    const avgScore =
      scored.length > 0
        ? Math.round(scored.reduce((s, l) => s + (l.leadScore ?? 0), 0) / scored.length)
        : 0;
    const conversionRate =
      totalThisView > 0 ? Math.round((confirmedCount / totalThisView) * 100) : 0;
    // Average "response" (proxy: median age of non-new leads in hours)
    const nonNew = leads.filter((l) => l.status !== "new" && l.status !== "pending" && l.status !== "cancelled" && l.status !== "declined");
    const agesHours = nonNew
      .map((l) => (Date.now() - new Date(l.createdAt).getTime()) / 3_600_000)
      .sort((a, b) => a - b);
    let avgResponse = "—";
    if (agesHours.length > 0) {
      const median = agesHours[Math.floor(agesHours.length / 2)];
      avgResponse =
        median < 1
          ? `${Math.round(median * 60)}m`
          : median < 24
            ? `${Math.round(median)}h`
            : `${Math.round(median / 24)}d`;
    }
    return { thisMonth, avgScore, conversionRate, avgResponse };
  }, [leads, confirmedCount, totalThisView]);

  // ── Client-side filter + sort (search, score, date, sort) ──
  const filtered = React.useMemo(() => {
    let list = [...leads];
    const q = debouncedSearch.toLowerCase();
    if (q) {
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          (l.vendorName ?? "").toLowerCase().includes(q) ||
          (l.eventType ?? "").toLowerCase().includes(q)
      );
    }
    if (scoreFilter !== "all") {
      list = list.filter((l) => {
        const s = l.leadScore ?? 0;
        if (scoreFilter === "hot") return s >= 80;
        if (scoreFilter === "warm") return s >= 50 && s < 80;
        return s < 50;
      });
    }
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      list = list.filter((l) => new Date(l.eventDate).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 24 * 3_600_000 - 1; // end of day
      list = list.filter((l) => new Date(l.eventDate).getTime() <= to);
    }
    list.sort((a, b) => {
      if (sort === "lead_score") return (b.leadScore ?? 0) - (a.leadScore ?? 0);
      if (sort === "event_date")
        return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [leads, debouncedSearch, scoreFilter, dateFrom, dateTo, sort]);

  // ── Status override (admin PATCH) ──
  const updateStatus = React.useCallback(async (id: string, status: BookingStatus) => {
    const prev = leads;
    // Optimistic
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, status } : l)));
    setSelectedLead((cur) => (cur && cur.id === id ? { ...cur, status } : cur));
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Failed (${res.status})`);
      }
      toast.success(`Status updated to ${statusMeta(status).label}`);
    } catch (err) {
      setLeads(prev);
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  }, [leads]);

  // ── Assign concierge event id (admin PATCH) ──
  const assignConciergeEvent = React.useCallback(async (id: string, eventId: string | null) => {
    const prev = leads;
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, conciergeEventId: eventId } : l)));
    setSelectedLead((cur) => (cur && cur.id === id ? { ...cur, conciergeEventId: eventId } : cur));
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conciergeEventId: eventId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Failed (${res.status})`);
      }
      toast.success(eventId ? "Linked to concierge event" : "Unlinked from concierge event");
    } catch (err) {
      setLeads(prev);
      toast.error(err instanceof Error ? err.message : "Failed to link concierge event");
    }
  }, [leads]);

  // ── Convert to concierge event (POST /api/concierge + PATCH link) ──
  const convertToConcierge = React.useCallback(
    async (lead: AdminLead) => {
      try {
        const createRes = await fetch("/api/concierge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: lead.name,
            customerEmail: lead.email,
            customerPhone: lead.phone || "",
            eventType: lead.eventType,
            eventDate: lead.eventDate,
            eventCity: lead.eventCity,
            guests: lead.guests,
            budget: lead.budget,
            notes: lead.message || lead.aiSummary || "",
          }),
        });
        if (!createRes.ok) {
          const body = await createRes.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `Failed (${createRes.status})`);
        }
        const created = (await createRes.json()) as { event: ConciergeEvent };
        const eventId = created.event.id;
        // Link the booking to the new concierge event
        await assignConciergeEvent(lead.id, eventId);
        toast.success("Converted to concierge event");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to convert to concierge event");
      }
    },
    [assignConciergeEvent]
  );

  // ── Render ──
  return (
    <div className="space-y-5 p-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight">Lead Center</h2>
          <p className="mt-1 text-[13px] text-black/50">
            Every enquiry across the platform — track, qualify, and convert leads into managed concierge events.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchLeads({ silent: true })}
          disabled={refreshing}
          className="gap-1.5"
        >
          {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Refresh
        </Button>
      </div>

      {/* Stats bar */}
      <StatsBar stats={stats} loading={loading} total={total} />

      {/* Pipeline overview */}
      <PipelineOverview
        counts={counts}
        cancelledCount={cancelledCount}
        active={statusFilter}
        onSelect={setStatusFilter}
        totalLoaded={totalThisView}
        confirmedCount={confirmedCount}
      />

      {/* Filters & search */}
      <div className="rounded-xl border border-black/10 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, vendor, event…"
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:items-center">
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide text-black/40">Lead score</Label>
              <Select value={scoreFilter} onValueChange={(v) => setScoreFilter(v as ScoreFilter)}>
                <SelectTrigger className="h-9 w-full lg:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All scores</SelectItem>
                  <SelectItem value="hot">Hot (80+)</SelectItem>
                  <SelectItem value="warm">Warm (50–79)</SelectItem>
                  <SelectItem value="cold">Cold (&lt; 50)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide text-black/40">Event from</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 w-full lg:w-[150px]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide text-black/40">Event to</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 w-full lg:w-[150px]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase tracking-wide text-black/40">Sort by</Label>
              <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                <SelectTrigger className="h-9 w-full lg:w-[170px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="lead_score">Lead score (high → low)</SelectItem>
                  <SelectItem value="event_date">Event date (soonest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Lead table */}
      <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
        {loading ? (
          <LeadTableSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="size-12 text-black/20" />
            <h3 className="mt-3 text-[15px] font-semibold">No leads found</h3>
            <p className="mt-1 max-w-sm text-[13px] text-black/40">
              {leads.length === 0
                ? "Leads will appear here as customers submit enquiries to vendor listings."
                : "Try a different filter or search term."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop: table */}
            <div className="hidden overflow-x-auto lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-black/[0.015] hover:bg-transparent">
                    <TableHead className="min-w-[220px]">Customer</TableHead>
                    <TableHead className="min-w-[280px]">AI summary</TableHead>
                    <TableHead className="min-w-[120px]">Score</TableHead>
                    <TableHead className="min-w-[200px]">Event</TableHead>
                    <TableHead className="min-w-[160px]">Vendor</TableHead>
                    <TableHead className="min-w-[120px]">Status</TableHead>
                    <TableHead className="min-w-[100px]">Received</TableHead>
                    <TableHead className="w-[60px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lead) => (
                    <LeadTableRow
                      key={lead.id}
                      lead={lead}
                      onView={() => setSelectedLead(lead)}
                      onConvert={() => convertToConcierge(lead)}
                      onAssignManager={() => setSelectedLead(lead)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile: cards */}
            <div className="divide-y divide-black/5 lg:hidden">
              {filtered.map((lead) => (
                <LeadMobileCard
                  key={lead.id}
                  lead={lead}
                  onView={() => setSelectedLead(lead)}
                  onConvert={() => convertToConcierge(lead)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && total > pageSize && (
        <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-black/10 bg-white p-3 sm:flex-row">
          <p className="text-[12px] text-black/50">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} leads
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </Button>
            <span className="text-[12px] tabular-nums text-black/60">
              {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Detail dialog */}
      <LeadDetailDialog
        lead={selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
        onStatusChange={(s) => selectedLead && updateStatus(selectedLead.id, s)}
        onAssignConcierge={(eventId) => selectedLead && assignConciergeEvent(selectedLead.id, eventId)}
        onConvertToConcierge={() => selectedLead && convertToConcierge(selectedLead)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats bar
// ─────────────────────────────────────────────────────────────────────────────

function StatsBar({
  stats,
  loading,
  total,
}: {
  stats: { thisMonth: number; avgScore: number; conversionRate: number; avgResponse: string };
  loading: boolean;
  total: number;
}) {
  const items = [
    {
      label: "Total leads",
      value: String(total),
      icon: Inbox,
      hint: "Across all pipeline stages",
    },
    {
      label: "This month",
      value: String(stats.thisMonth),
      icon: CalendarDays,
      hint: "New enquiries this month",
    },
    {
      label: "Conversion rate",
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      hint: "Confirmed ÷ total (current view)",
    },
    {
      label: "Avg lead score",
      value: stats.avgScore ? String(stats.avgScore) : "—",
      icon: Sparkles,
      hint: "AI quality score (0–100)",
    },
    {
      label: "Avg response",
      value: stats.avgResponse,
      icon: Clock,
      hint: "Median time since enquiry (active leads)",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-xl border border-black/10 bg-white p-3.5"
        >
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-black/50">
            <it.icon className="size-3.5" />
            {it.label}
          </div>
          {loading ? (
            <Skeleton className="h-6 w-12" />
          ) : (
            <p className="text-[20px] font-bold tabular-nums">{it.value}</p>
          )}
          <p className="mt-0.5 text-[10px] text-black/40">{it.hint}</p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline overview
// ─────────────────────────────────────────────────────────────────────────────

function PipelineOverview({
  counts,
  cancelledCount,
  active,
  onSelect,
  totalLoaded,
  confirmedCount,
}: {
  counts: Record<string, number>;
  cancelledCount: number;
  active: StatusFilter;
  onSelect: (s: StatusFilter) => void;
  totalLoaded: number;
  confirmedCount: number;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4">
      {/* Conversion summary */}
      <div className="mb-3 flex flex-wrap items-center gap-3 text-[12px] text-black/60">
        <span className="rounded-full bg-black/[0.04] px-2.5 py-1 font-medium">
          {totalLoaded} leads loaded
        </span>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
          {confirmedCount} confirmed
        </span>
        {totalLoaded > 0 && (
          <span className="rounded-full bg-brand/10 px-2.5 py-1 font-medium text-brand">
            {Math.round((confirmedCount / totalLoaded) * 100)}% conversion
          </span>
        )}
      </div>

      {/* Desktop: horizontal pipeline */}
      <div className="hidden items-stretch gap-1 overflow-x-auto md:flex">
        <button
          onClick={() => onSelect("all")}
          className={cn(
            "flex shrink-0 flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition-colors",
            active === "all" ? "bg-brand text-white" : "hover:bg-black/5"
          )}
        >
          <span className={cn("text-xs font-semibold", active === "all" ? "" : "text-foreground")}>
            All
          </span>
          <span
            className={cn(
              "text-sm font-extrabold tabular-nums",
              active === "all" ? "text-white" : "text-foreground"
            )}
          >
            {totalLoaded}
          </span>
        </button>

        {PIPELINE_STAGES.map((stage, idx) => {
          const count = counts[stage.id] ?? 0;
          const isActive = active === stage.id;
          return (
            <React.Fragment key={stage.id}>
              {idx > 0 && (
                <div className="flex items-center px-0.5 text-black/30">
                  <ChevronRight className="size-3.5" />
                </div>
              )}
              <button
                onClick={() => onSelect(stage.id)}
                className={cn(
                  "flex shrink-0 flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition-colors",
                  isActive ? "bg-brand text-white" : "hover:bg-black/5"
                )}
              >
                <span className={cn("text-xs font-semibold", isActive ? "" : "text-foreground")}>
                  {stage.label}
                </span>
                <span
                  className={cn(
                    "text-sm font-extrabold tabular-nums",
                    isActive ? "text-white" : count > 0 ? "text-foreground" : "text-black/40"
                  )}
                >
                  {count}
                </span>
              </button>
            </React.Fragment>
          );
        })}

        <div className="mx-2 hidden items-stretch md:flex">
          <div className="w-px bg-black/10" />
        </div>
        <button
          onClick={() => onSelect("cancelled")}
          className={cn(
            "flex shrink-0 flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition-colors",
            active === "cancelled" ? "bg-rose-500 text-white" : "hover:bg-rose-50"
          )}
        >
          <span
            className={cn(
              "text-xs font-semibold",
              active === "cancelled" ? "text-white" : "text-rose-600"
            )}
          >
            Cancelled
          </span>
          <span
            className={cn(
              "text-sm font-extrabold tabular-nums",
              active === "cancelled" ? "text-white" : "text-rose-600"
            )}
          >
            {cancelledCount}
          </span>
        </button>
      </div>

      {/* Mobile: scrollable chips */}
      <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 md:hidden">
        <button
          onClick={() => onSelect("all")}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            active === "all"
              ? "bg-brand text-white"
              : "border border-black/10 bg-white text-black/60"
          )}
        >
          All
          <span className="tabular-nums opacity-80">{totalLoaded}</span>
        </button>
        {PIPELINE_STAGES.map((stage) => {
          const count = counts[stage.id] ?? 0;
          return (
            <button
              key={stage.id}
              onClick={() => onSelect(stage.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                active === stage.id
                  ? "bg-brand text-white"
                  : "border border-black/10 bg-white text-black/60"
              )}
            >
              {stage.short}
              <span className="tabular-nums opacity-80">{count}</span>
            </button>
          );
        })}
        <button
          onClick={() => onSelect("cancelled")}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            active === "cancelled"
              ? "bg-rose-500 text-white"
              : "border border-rose-200 bg-white text-rose-600"
          )}
        >
          Cancelled
          <span className="tabular-nums opacity-80">{cancelledCount}</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lead table row (desktop)
// ─────────────────────────────────────────────────────────────────────────────

function LeadTableRow({
  lead,
  onView,
  onConvert,
  onAssignManager,
}: {
  lead: AdminLead;
  onView: () => void;
  onConvert: () => void;
  onAssignManager: () => void;
}) {
  const meta = statusMeta(lead.status);
  const scoreMeta = leadScoreMeta(lead.leadScore);

  return (
    <TableRow
      className="cursor-pointer hover:bg-black/[0.015]"
      onClick={onView}
    >
      <TableCell>
        <div className="flex items-start gap-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/10 text-[12px] font-bold text-brand">
            {lead.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold">{lead.name}</p>
            <p className="truncate text-[11px] text-black/50">{lead.email}</p>
            {lead.phone && (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-black/40">
                <Phone className="size-3" /> {lead.phone}
              </p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {lead.aiSummary ? (
          <div className="flex max-w-[280px] items-start gap-1.5 rounded-lg border border-brand/15 bg-brand/[0.06] px-2.5 py-1.5">
            <Sparkles className="mt-0.5 size-3 shrink-0 text-brand" />
            <p className="line-clamp-2 text-[12px] font-medium text-foreground/80">{lead.aiSummary}</p>
          </div>
        ) : (
          <span className="text-[12px] text-black/30">—</span>
        )}
      </TableCell>
      <TableCell>
        {scoreMeta ? (
          <Badge variant="outline" className={cn("border text-[10px] font-semibold", scoreMeta.class)}>
            <TrendingUp className="mr-0.5 size-3" />
            {scoreMeta.label}
          </Badge>
        ) : (
          <span className="text-[11px] text-black/30">—</span>
        )}
      </TableCell>
      <TableCell>
        <div className="space-y-0.5 text-[12px]">
          <p className="font-medium text-foreground/80">{lead.eventType || "—"}</p>
          <p className="flex items-center gap-1 text-[11px] text-black/50">
            <CalendarDays className="size-3" />
            {formatEventDate(lead.eventDate)}
            {lead.eventTime ? ` · ${lead.eventTime}` : ""}
          </p>
          <div className="flex flex-wrap gap-x-2 text-[11px] text-black/50">
            {lead.guests > 0 && (
              <span className="flex items-center gap-0.5">
                <Users className="size-3" />
                {lead.guests}
              </span>
            )}
            {lead.budget && (
              <span className="flex items-center gap-0.5">
                <Wallet className="size-3" />
                {lead.budget}
              </span>
            )}
            {lead.eventCity && (
              <span className="flex items-center gap-0.5">
                <MapPin className="size-3" />
                {lead.eventCity}
              </span>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {lead.vendorSlug ? (
          <a
            href={`/vendor/${lead.vendorSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="group inline-flex items-center gap-1.5"
          >
            <span className="text-[12px] font-semibold text-foreground/80 group-hover:text-brand">
              {lead.vendorName}
            </span>
            <ExternalLink className="size-3 text-black/30 group-hover:text-brand" />
          </a>
        ) : (
          <span className="text-[12px] font-medium text-foreground/80">{lead.vendorName}</span>
        )}
        {lead.vendorCategory && (
          <p className="text-[11px] text-black/40">{lead.vendorCategory}</p>
        )}
        {typeof lead.vendorRating === "number" && lead.vendorRating > 0 && (
          <p className="flex items-center gap-1 text-[11px] text-black/50">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            {lead.vendorRating.toFixed(1)}
            <span className="text-black/30">({lead.vendorReviewCount ?? 0})</span>
          </p>
        )}
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            meta.chipClass
          )}
        >
          <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
          {meta.label}
        </span>
        {lead.conciergeEventId && (
          <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-brand">
            <CheckCircle2 className="size-3" />
            Concierge
          </p>
        )}
      </TableCell>
      <TableCell>
        <span className="flex items-center gap-1 text-[11px] text-black/50">
          <Clock className="size-3" />
          {timeAgo(lead.createdAt)}
        </span>
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Filter className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onView}>
              <ExternalLink className="mr-2 size-3.5" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onAssignManager}>
              <UserCog className="mr-2 size-3.5" /> Assign event manager
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onConvert}>
              <ArrowRight className="mr-2 size-3.5" /> Convert to concierge
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lead card (mobile)
// ─────────────────────────────────────────────────────────────────────────────

function LeadMobileCard({
  lead,
  onView,
  onConvert,
}: {
  lead: AdminLead;
  onView: () => void;
  onConvert: () => void;
}) {
  const meta = statusMeta(lead.status);
  const scoreMeta = leadScoreMeta(lead.leadScore);
  return (
    <div className="p-3" onClick={onView}>
      <div className="flex items-start gap-2.5">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/10 text-[12px] font-bold text-brand">
          {lead.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[13px] font-semibold">{lead.name}</p>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold",
                meta.chipClass
              )}
            >
              <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
              {meta.label}
            </span>
          </div>
          <p className="truncate text-[11px] text-black/50">{lead.email}</p>
          <p className="mt-0.5 text-[11px] text-black/40">
            {lead.vendorName} · {timeAgo(lead.createdAt)}
          </p>
          {lead.aiSummary && (
            <p className="mt-1.5 line-clamp-2 rounded-md bg-brand/[0.06] px-2 py-1 text-[11px] font-medium text-foreground/80">
              <Sparkles className="mr-1 inline size-3 text-brand" />
              {lead.aiSummary}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-black/50">
            {scoreMeta && (
              <Badge variant="outline" className={cn("border text-[10px] font-semibold", scoreMeta.class)}>
                {scoreMeta.label}
              </Badge>
            )}
            <span className="flex items-center gap-0.5">
              <CalendarDays className="size-3" />
              {formatEventDate(lead.eventDate)}
            </span>
            {lead.eventCity && (
              <span className="flex items-center gap-0.5">
                <MapPin className="size-3" />
                {lead.eventCity}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <Button size="sm" variant="outline" onClick={onConvert} className="gap-1.5 text-[11px]">
          <ArrowRight className="size-3" /> Convert to concierge
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lead detail dialog
// ─────────────────────────────────────────────────────────────────────────────

function LeadDetailDialog({
  lead,
  onOpenChange,
  onStatusChange,
  onAssignConcierge,
  onConvertToConcierge,
}: {
  lead: AdminLead | null;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (status: BookingStatus) => void;
  onAssignConcierge: (eventId: string | null) => void;
  onConvertToConcierge: () => void;
}) {
  const open = lead !== null;
  const [eventManagerInput, setEventManagerInput] = React.useState("");
  const [showImage, setShowImage] = React.useState(false);

  // Reset state when lead changes
  React.useEffect(() => {
    setEventManagerInput("");
    setShowImage(false);
  }, [lead?.id]);

  const qualification = React.useMemo(
    () => parseQualification(lead?.aiQualification),
    [lead?.aiQualification]
  );

  const phone = lead?.phone?.trim() || null;
  const waPhone = phone ? normalizeWaPhone(phone) : null;
  const referenceImage = lead?.referenceImage?.trim() || null;
  const meta = lead ? statusMeta(lead.status) : null;
  const scoreMeta = lead ? leadScoreMeta(lead.leadScore) : null;

  const handleAssign = () => {
    // Setting "event manager" is approximated as linking to an existing concierge event id
    // (admins type/paste a concierge event id; a future iteration will provide a dropdown of
    // existing events filtered by customer email).
    const v = eventManagerInput.trim();
    if (!v) {
      toast.error("Enter a concierge event id or email");
      return;
    }
    onAssignConcierge(v);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {lead && meta && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                <span>{lead.name}</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    meta.chipClass
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
                  {meta.label}
                </span>
                {scoreMeta && (
                  <Badge variant="outline" className={cn("border text-[10px] font-semibold", scoreMeta.class)}>
                    <TrendingUp className="mr-0.5 size-3" />
                    {scoreMeta.label}
                  </Badge>
                )}
                <span className="ml-auto flex items-center gap-1 text-[11px] font-normal text-black/50">
                  <Clock className="size-3" />
                  {timeAgo(lead.createdAt)}
                </span>
              </DialogTitle>
              <DialogDescription>
                Enquiry for <span className="font-medium text-foreground/70">{lead.eventType || "—"}</span>
                {lead.eventCity ? ` in ${lead.eventCity}` : ""} on {formatEventDate(lead.eventDate)}
                {lead.eventTime ? ` · ${lead.eventTime}` : ""}
              </DialogDescription>
            </DialogHeader>

            {/* AI summary prominent */}
            {lead.aiSummary && (
              <div className="flex items-start gap-2 rounded-lg border border-brand/15 bg-brand/[0.06] px-3 py-2.5">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" />
                <p className="text-[13px] font-medium text-foreground/80">{lead.aiSummary}</p>
              </div>
            )}

            {/* Customer + event details grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailSection title="Customer">
                <DetailRow label="Name" value={lead.name} />
                <DetailRow label="Email" value={lead.email} />
                {phone && <DetailRow label="Phone" value={phone} />}
                {lead.preferredContact && (
                  <DetailRow label="Preferred contact" value={lead.preferredContact} />
                )}
                {lead.address && <DetailRow label="Address" value={lead.address} />}
              </DetailSection>

              <DetailSection title="Event">
                <DetailRow label="Event type" value={lead.eventType} />
                <DetailRow label="Date" value={formatEventDate(lead.eventDate)} />
                {lead.eventTime && <DetailRow label="Time" value={lead.eventTime} />}
                {lead.eventCity && <DetailRow label="City" value={lead.eventCity} />}
                {lead.guests > 0 && <DetailRow label="Guests" value={String(lead.guests)} />}
                {lead.budget && <DetailRow label="Budget" value={lead.budget} />}
              </DetailSection>
            </div>

            {/* Vendor info */}
            <DetailSection title="Vendor">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  {lead.vendorSlug ? (
                    <a
                      href={`/vendor/${lead.vendorSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:underline"
                    >
                      {lead.vendorName}
                      <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <span className="text-[13px] font-semibold">{lead.vendorName}</span>
                  )}
                </div>
                {lead.vendorCategory && (
                  <Badge variant="secondary" className="text-[10px]">
                    {lead.vendorCategory}
                  </Badge>
                )}
                {lead.vendorCity && (
                  <span className="flex items-center gap-1 text-[11px] text-black/50">
                    <MapPin className="size-3" /> {lead.vendorCity}
                  </span>
                )}
                {typeof lead.vendorRating === "number" && lead.vendorRating > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-black/50">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    {lead.vendorRating.toFixed(1)}
                    <span className="text-black/30">({lead.vendorReviewCount ?? 0} reviews)</span>
                  </span>
                )}
              </div>
            </DetailSection>

            {/* Customer message */}
            {lead.message && (
              <DetailSection title="Customer message">
                <p className="whitespace-pre-wrap rounded-lg bg-black/[0.02] p-3 text-[13px] text-foreground/80">
                  {lead.message}
                </p>
              </DetailSection>
            )}

            {/* AI qualification answers */}
            {qualification && (
              <DetailSection title="AI pre-qualification answers">
                <dl className="grid gap-2 rounded-lg border border-black/10 bg-black/[0.015] p-3 sm:grid-cols-2">
                  {Object.entries(qualification).map(([k, v]) => (
                    <div key={k} className="text-[12px]">
                      <dt className="font-medium text-black/50">{k}</dt>
                      <dd className="text-foreground/90">{v}</dd>
                    </div>
                  ))}
                </dl>
              </DetailSection>
            )}

            {/* Reference image */}
            {referenceImage && (
              <DetailSection title="Reference image">
                <button
                  onClick={() => setShowImage(true)}
                  className="group inline-flex items-center gap-2 rounded-lg border border-black/10 bg-black/[0.02] p-1.5 pr-3 text-[12px] text-black/60 transition-colors hover:bg-black/5"
                >
                  <img
                    src={referenceImage}
                    alt="Reference"
                    className="size-12 rounded object-cover"
                  />
                  <ImageIcon className="size-4" />
                  View image
                </button>
              </DetailSection>
            )}

            {/* Admin controls */}
            <DetailSection title="Admin controls">
              <div className="space-y-3">
                {/* Status override */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Label className="w-full text-[12px] font-medium sm:w-32">Override status</Label>
                  <Select
                    value={lead.status}
                    onValueChange={(v) => onStatusChange(v as BookingStatus)}
                  >
                    <SelectTrigger className="h-9 sm:max-w-[220px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.label}
                          {lead.status === s.id && " · current"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assign event manager / concierge link */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Label className="w-full text-[12px] font-medium sm:w-32">
                    Assign concierge
                  </Label>
                  <div className="flex flex-1 gap-2">
                    <Input
                      value={eventManagerInput}
                      onChange={(e) => setEventManagerInput(e.target.value)}
                      placeholder="Concierge event id (or email to look up)"
                      className="h-9 flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAssign}
                      className="gap-1.5"
                    >
                      <UserCog className="size-3.5" /> Link
                    </Button>
                  </div>
                </div>
                {lead.conciergeEventId && (
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-brand">
                    <CheckCircle2 className="size-3.5" />
                    Linked to concierge event:{" "}
                    <code className="rounded bg-brand/10 px-1 py-0.5 text-[10px]">
                      {lead.conciergeEventId}
                    </code>
                    <button
                      onClick={() => onAssignConcierge(null)}
                      className="ml-1 text-[10px] text-rose-600 hover:underline"
                    >
                      unlink
                    </button>
                  </p>
                )}

                {/* Convert to concierge event */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Label className="w-full text-[12px] font-medium sm:w-32">
                    Convert to concierge
                  </Label>
                  <Button
                    size="sm"
                    onClick={onConvertToConcierge}
                    disabled={!!lead.conciergeEventId}
                    className="gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90 sm:max-w-[260px]"
                  >
                    <ArrowRight className="size-3.5" />
                    {lead.conciergeEventId ? "Already linked" : "Create concierge event"}
                  </Button>
                </div>

                {lead.notes && (
                  <div className="rounded-lg border border-black/10 bg-black/[0.015] p-2.5">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-black/40">
                      Internal notes
                    </p>
                    <p className="whitespace-pre-wrap text-[12px] text-foreground/70">{lead.notes}</p>
                  </div>
                )}
              </div>
            </DetailSection>

            {/* Quick contact actions */}
            <div className="flex flex-wrap gap-2 border-t border-black/10 pt-3">
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a
                  href={`mailto:${lead.email}?subject=Re: Your enquiry for ${encodeURIComponent(
                    lead.eventType || "your event"
                  )}&body=Hi ${encodeURIComponent(lead.name)}, thanks for your enquiry…`}
                >
                  <Mail className="size-3.5" /> Email
                </a>
              </Button>
              {waPhone && (
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="size-3.5" /> WhatsApp
                  </a>
                </Button>
              )}
              {phone && (
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <a href={`tel:${phone.replace(/\s+/g, "")}`}>
                    <Phone className="size-3.5" /> Call
                  </a>
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>

      {/* Reference image preview sub-dialog */}
      <Dialog open={showImage} onOpenChange={setShowImage}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reference image — {lead?.name}</DialogTitle>
            <DialogDescription>Uploaded by the customer with their enquiry.</DialogDescription>
          </DialogHeader>
          {lead?.referenceImage && (
            <img
              src={lead.referenceImage}
              alt={`Reference image from ${lead.name}`}
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-black/40">{title}</p>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5 text-[12px]">
      <dt className="text-black/50">{label}</dt>
      <dd className="text-right font-medium text-foreground/80">{value}</dd>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function LeadTableSkeleton() {
  return (
    <div className="divide-y divide-black/5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
