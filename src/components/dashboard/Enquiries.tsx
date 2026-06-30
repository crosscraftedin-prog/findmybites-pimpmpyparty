"use client";

import * as React from "react";
import {
  Phone,
  Mail,
  MessageCircle,
  FileText,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronRight,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  Search,
  Inbox,
  Share2,
  Image as ImageIcon,
  X,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Booking, BookingStatus } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────────────────────

export interface EnquiriesProps {
  bookings: (Booking & { vendorName: string })[];
}

/**
 * Active pipeline stages (excludes terminal "cancelled").
 * Order matters — defines the horizontal flow shown in the overview.
 */
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

/** All statuses the vendor can move a lead to via the dropdown. */
const ALL_STATUSES: { id: BookingStatus; label: string }[] = [
  ...PIPELINE_STAGES,
  { id: "cancelled", label: "Cancelled" },
];

/** Statuses that should be treated as "new" when the legacy `pending` value is present. */
const LEGACY_PENDING_STATUSES: BookingStatus[] = ["pending", "new"];

type StatusFilter = "all" | BookingStatus;
type SortOption = "newest" | "lead_score" | "event_date";

/** Line item shape used by the quote builder. */
interface QuoteLineItem {
  label: string;
  qty: number;
  price: number;
}

/** Shape returned by POST /api/ai/quote-builder. */
interface QuoteBuilderResponse {
  lineItems: QuoteLineItem[];
  totalAmount: number;
  currency: string;
  aiNotes: string;
  suggestedDeposit: { type: "percentage" | "fixed"; value: number };
  source?: string;
}

/** Currency symbol map (best-effort; falls back to code). */
function currencySymbol(code: string): string {
  switch (code) {
    case "INR":
      return "₹";
    case "USD":
      return "$";
    case "GBP":
      return "£";
    case "EUR":
      return "€";
    case "AED":
      return "AED ";
    default:
      return code ? `${code} ` : "";
  }
}

function formatMoney(amount: number, currency: string): string {
  const sym = currencySymbol(currency);
  return `${sym}${(amount ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Normalize a phone number for wa.me (strip non-digits, keep leading +). */
function normalizeWaPhone(phone: string): string {
  const trimmed = phone.trim();
  // wa.me expects international format with country code, no +, no spaces.
  const digits = trimmed.replace(/[^\d]/g, "");
  return digits;
}

function timeAgo(date: string): string {
  const d = new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return d.toLocaleDateString();
}

/** Safely parse the JSON string stored in `aiQualification`. */
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

/** Map a stored status to its display metadata (label, colour classes). */
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

/** Lead score badge colours. */
function leadScoreMeta(score: number | null | undefined): { label: string; class: string } | null {
  if (score === null || score === undefined || Number.isNaN(score)) return null;
  if (score >= 80) return { label: `Hot · ${score}`, class: "bg-emerald-500 text-white border-emerald-600" };
  if (score >= 50) return { label: `Warm · ${score}`, class: "bg-amber-400 text-amber-950 border-amber-500" };
  return { label: `Cold · ${score}`, class: "bg-slate-200 text-slate-700 border-slate-300" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function Enquiries({ bookings }: EnquiriesProps) {
  // Local copy so we can reflect status updates immediately.
  const [leads, setLeads] = React.useState<(Booking & { vendorName: string })[]>(bookings);
  React.useEffect(() => {
    setLeads(bookings);
  }, [bookings]);

  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<SortOption>("newest");

  // Pipeline counts
  const counts = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of leads) {
      // Treat legacy "pending" as "new" for the pipeline UI.
      const key = l.status === "pending" ? "new" : l.status;
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [leads]);

  const cancelledCount = (counts["cancelled"] ?? 0) + (counts["declined"] ?? 0);

  // Filter + sort
  const filtered = React.useMemo(() => {
    let list = leads.filter((l) => {
      if (statusFilter === "all") {
        // Hide cancelled from the "all" view; vendor can see them via the Cancelled tab.
        return l.status !== "cancelled" && l.status !== "declined";
      }
      if (statusFilter === "new") return LEGACY_PENDING_STATUSES.includes(l.status);
      return l.status === statusFilter;
    });

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          (l.eventType ?? "").toLowerCase().includes(q)
      );
    }

    list = [...list].sort((a, b) => {
      if (sort === "lead_score") {
        return (b.leadScore ?? 0) - (a.leadScore ?? 0);
      }
      if (sort === "event_date") {
        return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [leads, statusFilter, search, sort]);

  // Status update handler — optimistic + API call.
  const updateStatus = React.useCallback(async (id: string, status: BookingStatus) => {
    const prev = leads;
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
      }
      toast.success(`Moved to ${statusMeta(status).label}`);
    } catch (err) {
      // rollback
      setLeads(prev);
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  }, [leads]);

  // Quote builder dialog state
  const [quoteBooking, setQuoteBooking] = React.useState<(Booking & { vendorName: string }) | null>(null);

  const shareListing = () => {
    const url = `${window.location.origin}/vendor/${leads[0]?.vendorName ?? ""}`;
    navigator.clipboard?.writeText(url);
    toast.success("Listing link copied to clipboard!");
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      {/* ── Header ── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Leads &amp; Pipeline</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Track every enquiry from first message to confirmed booking.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={shareListing}
          className="self-start"
        >
          <Share2 className="size-4" />
          Share listing
        </Button>
      </div>

      {/* ── Pipeline overview ── */}
      <PipelineOverview
        counts={counts}
        cancelledCount={cancelledCount}
        active={statusFilter}
        onSelect={setStatusFilter}
      />

      {/* ── Filters bar ── */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, event…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="sort-leads" className="sr-only">
            Sort by
          </Label>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger id="sort-leads" className="w-[170px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="lead_score">Lead score (high → low)</SelectItem>
              <SelectItem value="event_date">Event date (soonest)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Leads list ── */}
      {filtered.length > 0 ? (
        <div className="mt-4 space-y-3">
          {filtered.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onStatusChange={(s) => updateStatus(lead.id, s)}
              onGenerateQuote={() => setQuoteBooking(lead)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center">
          <Inbox className="size-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-bold">No leads here</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {leads.length === 0
              ? "Share your listing to start getting enquiries from customers."
              : "Try a different filter or search term."}
          </p>
          {leads.length === 0 && (
            <Button
              onClick={shareListing}
              className="mt-4 bg-brand text-brand-foreground hover:bg-brand/90"
            >
              <Share2 className="size-4" />
              Share My Listing
            </Button>
          )}
        </div>
      )}

      {/* ── Quote builder dialog ── */}
      <QuoteBuilderDialog
        lead={quoteBooking}
        onOpenChange={(open) => !open && setQuoteBooking(null)}
        onSent={(quoteStatus) => {
          if (quoteBooking) {
            setLeads((cur) =>
              cur.map((l) => (l.id === quoteBooking.id ? { ...l, status: quoteStatus } : l))
            );
          }
          setQuoteBooking(null);
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline overview (horizontal flow)
// ─────────────────────────────────────────────────────────────────────────────

function PipelineOverview({
  counts,
  cancelledCount,
  active,
  onSelect,
}: {
  counts: Record<string, number>;
  cancelledCount: number;
  active: StatusFilter;
  onSelect: (s: StatusFilter) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Desktop: horizontal pipeline */}
      <div className="hidden items-stretch gap-1 overflow-x-auto md:flex">
        {/* "All" tab */}
        <button
          onClick={() => onSelect("all")}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
            active === "all"
              ? "bg-brand text-brand-foreground"
              : "text-muted-foreground hover:bg-accent"
          )}
        >
          <span>All</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
              active === "all" ? "bg-brand-foreground/20" : "bg-muted"
            )}
          >
            {Object.values(counts).reduce((s, n) => s + n, 0) - (counts["cancelled"] ?? 0) - (counts["declined"] ?? 0)}
          </span>
        </button>

        {PIPELINE_STAGES.map((stage, idx) => {
          const count = counts[stage.id] ?? 0;
          const isActive = active === stage.id;
          return (
            <React.Fragment key={stage.id}>
              {idx > 0 && (
                <div className="flex items-center px-0.5 text-muted-foreground/50">
                  <ChevronRight className="size-3.5" />
                </div>
              )}
              <button
                onClick={() => onSelect(stage.id)}
                className={cn(
                  "flex shrink-0 flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition-colors",
                  isActive ? "bg-brand text-brand-foreground" : "hover:bg-accent"
                )}
              >
                <span className={cn("text-xs font-semibold", isActive ? "" : "text-foreground")}>
                  {stage.label}
                </span>
                <span
                  className={cn(
                    "text-sm font-extrabold tabular-nums",
                    isActive ? "text-brand-foreground" : count > 0 ? "text-foreground" : "text-muted-foreground/60"
                  )}
                >
                  {count}
                </span>
              </button>
            </React.Fragment>
          );
        })}

        {/* Cancelled tab — visually separated */}
        <div className="mx-2 hidden items-stretch md:flex">
          <div className="w-px bg-border" />
        </div>
        <button
          onClick={() => onSelect("cancelled")}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
            active === "cancelled"
              ? "bg-rose-500 text-white"
              : "text-rose-600 hover:bg-rose-50"
          )}
        >
          <span>Cancelled</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
              active === "cancelled" ? "bg-white/20" : "bg-rose-100"
            )}
          >
            {cancelledCount}
          </span>
        </button>
      </div>

      {/* Mobile: horizontal scroll chips */}
      <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 md:hidden">
        <button
          onClick={() => onSelect("all")}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            active === "all"
              ? "bg-brand text-brand-foreground"
              : "border border-border bg-background text-muted-foreground"
          )}
        >
          All
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
                  ? "bg-brand text-brand-foreground"
                  : "border border-border bg-background text-muted-foreground"
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
              : "border border-rose-200 bg-background text-rose-600"
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
// Lead card
// ─────────────────────────────────────────────────────────────────────────────

function LeadCard({
  lead,
  onStatusChange,
  onGenerateQuote,
}: {
  lead: Booking & { vendorName: string };
  onStatusChange: (status: BookingStatus) => void;
  onGenerateQuote: () => void;
}) {
  const [showTimeline, setShowTimeline] = React.useState(false);
  const [showQualification, setShowQualification] = React.useState(false);
  const [showImage, setShowImage] = React.useState(false);

  const meta = statusMeta(lead.status);
  const scoreMeta = leadScoreMeta(lead.leadScore);
  const qualification = React.useMemo(() => parseQualification(lead.aiQualification), [lead.aiQualification]);

  const phone = lead.phone?.trim() || null;
  const waPhone = phone ? normalizeWaPhone(phone) : null;
  const referenceImage = lead.referenceImage?.trim() || null;

  const handleStatusChange = (status: BookingStatus) => {
    onStatusChange(status);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {/* Avatar */}
        <div className="flex items-start gap-3 sm:flex-1">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">
            {lead.name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            {/* Header row */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="truncate font-bold">{lead.name}</p>
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
              <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" />
                {timeAgo(lead.createdAt)}
              </span>
            </div>

            {/* Contact line */}
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{lead.email}</p>

            {/* AI summary — prominent */}
            {lead.aiSummary && (
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-brand-border bg-brand-soft px-3 py-2">
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-brand" />
                <p className="text-sm font-medium text-brand-soft-foreground">{lead.aiSummary}</p>
              </div>
            )}

            {/* Event details */}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">{lead.eventType || "—"}</span>
              <span>· 📅 {formatEventDate(lead.eventDate)}{lead.eventTime ? ` · ${lead.eventTime}` : ""}</span>
              {lead.guests > 0 && <span>· 👥 {lead.guests} guests</span>}
              {lead.budget && <span>· 💰 {lead.budget}</span>}
              {lead.eventCity && <span>· 📍 {lead.eventCity}</span>}
              {lead.preferredContact && (
                <span>· ✉️ prefers {lead.preferredContact}</span>
              )}
            </div>

            {/* Reference image thumbnail */}
            {referenceImage && (
              <button
                onClick={() => setShowImage(true)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 p-1 pr-2 text-xs text-muted-foreground transition-colors hover:bg-accent"
              >
                <img
                  src={referenceImage}
                  alt="Reference"
                  className="size-8 rounded object-cover"
                />
                <ImageIcon className="size-3.5" />
                Reference image
              </button>
            )}

            {/* Pre-qualification (expandable) */}
            {qualification && (
              <div className="mt-2">
                <button
                  onClick={() => setShowQualification((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showQualification ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                  Pre-qualification answers
                </button>
                {showQualification && (
                  <dl className="mt-2 grid gap-1.5 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-2">
                    {Object.entries(qualification).map(([k, v]) => (
                      <div key={k} className="text-xs">
                        <dt className="font-medium text-muted-foreground">{k}</dt>
                        <dd className="text-foreground/90">{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            )}

            {/* Customer message preview (if present) */}
            {lead.message && (
              <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{lead.message}</p>
            )}

            {/* Timeline (expandable) */}
            <div className="mt-2">
              <button
                onClick={() => setShowTimeline((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {showTimeline ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                Timeline
              </button>
              {showTimeline && (
                <BookingTimeline lead={lead} onStatusChange={handleStatusChange} />
              )}
            </div>
          </div>
        </div>

        {/* Actions column */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <ChevronDown className="size-3.5" />
                Move to…
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Pipeline status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_STATUSES.map((s) => (
                <DropdownMenuItem
                  key={s.id}
                  onSelect={() => handleStatusChange(s.id)}
                  className={cn(
                    "gap-2 capitalize",
                    lead.status === s.id && "font-semibold"
                  )}
                >
                  <span className={cn("size-2 rounded-full", statusMeta(s.id).dotClass)} />
                  {s.label}
                  {lead.status === s.id && <CheckCircle2 className="ml-auto size-3.5 text-brand" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            onClick={onGenerateQuote}
            className="gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90"
          >
            <FileText className="size-3.5" />
            Generate Quote
          </Button>

          <div className="flex gap-2 sm:justify-center">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a
                href={`mailto:${lead.email}?subject=Re: Your enquiry for ${encodeURIComponent(
                  lead.eventType || "your event"
                )}&body=Hi ${encodeURIComponent(lead.name)}, thanks for your enquiry…`}
              >
                <Mail className="size-3.5" />
                Email
              </a>
            </Button>
            {waPhone && (
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-3.5" />
                  WhatsApp
                </a>
              </Button>
            )}
            {phone && (
              <Button asChild variant="outline" size="sm" className="gap-1.5" title={phone}>
                <a href={`tel:${phone.replace(/\s+/g, "")}`}>
                  <Phone className="size-3.5" />
                  Call
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Reference image preview dialog */}
      <Dialog open={showImage} onOpenChange={setShowImage}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reference image — {lead.name}</DialogTitle>
            <DialogDescription>Uploaded by the customer with their enquiry.</DialogDescription>
          </DialogHeader>
          {referenceImage && (
            <img
              src={referenceImage}
              alt={`Reference image from ${lead.name}`}
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Booking timeline (expandable inside a lead card)
// ─────────────────────────────────────────────────────────────────────────────

function BookingTimeline({
  lead,
  onStatusChange,
}: {
  lead: Booking & { vendorName: string };
  onStatusChange: (status: BookingStatus) => void;
}) {
  // Determine the index of the current stage (for the progress indicator).
  const currentIdx = (() => {
    const idx = PIPELINE_STAGES.findIndex((s) => s.id === lead.status);
    if (idx >= 0) return idx;
    // legacy "pending" → treat as "new"
    if (lead.status === "pending") return 0;
    return -1; // cancelled/declined/unknown
  })();

  return (
    <div className="mt-2 rounded-lg border border-border bg-muted/20 p-3">
      <ol className="relative ml-2 space-y-2 border-l border-border pl-4">
        {PIPELINE_STAGES.map((stage, idx) => {
          const reached = currentIdx >= 0 && idx <= currentIdx;
          const isCurrent = lead.status === stage.id || (lead.status === "pending" && stage.id === "new");
          return (
            <li key={stage.id} className="relative">
              <span
                className={cn(
                  "absolute -left-[1.4rem] top-1 size-2.5 rounded-full ring-2 ring-card",
                  reached ? statusMeta(stage.id).dotClass : "bg-muted-foreground/30"
                )}
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("text-xs font-semibold", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                  {stage.label}
                </span>
                {isCurrent && (
                  <span className="text-[10px] font-medium text-muted-foreground">
                    · current · {timeAgo(lead.createdAt)}
                  </span>
                )}
                {!isCurrent && reached && (
                  <span className="text-[10px] text-muted-foreground/70">completed</span>
                )}
                {!reached && (
                  <button
                    onClick={() => onStatusChange(stage.id)}
                    className="ml-auto text-[10px] font-medium text-brand hover:underline"
                  >
                    Move here
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {lead.status === "cancelled" || lead.status === "declined" ? (
        <p className="mt-2 text-xs font-medium text-rose-600">This lead was cancelled.</p>
      ) : null}
    </div>
  );
}

function formatEventDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────────
// Quote builder dialog
// ─────────────────────────────────────────────────────────────────────────────

function QuoteBuilderDialog({
  lead,
  onOpenChange,
  onSent,
}: {
  lead: (Booking & { vendorName: string }) | null;
  onOpenChange: (open: boolean) => void;
  onSent: (newStatus: BookingStatus) => void;
}) {
  const open = lead !== null;
  const [loading, setLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [lineItems, setLineItems] = React.useState<QuoteLineItem[]>([]);
  const [currency, setCurrency] = React.useState("USD");
  const [aiNotes, setAiNotes] = React.useState("");
  const [depositType, setDepositType] = React.useState<"percentage" | "fixed">("percentage");
  const [depositValue, setDepositValue] = React.useState(50);
  const [validUntil, setValidUntil] = React.useState<string>(() => {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [error, setError] = React.useState<string | null>(null);

  // Generate the quote whenever a new lead is opened.
  React.useEffect(() => {
    if (!lead) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setLineItems([]);
    setAiNotes("");
    setCurrency("USD");
    setDepositType("percentage");
    setDepositValue(50);
    setValidUntil(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));

    (async () => {
      try {
        const res = await fetch("/api/ai/quote-builder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: lead.id }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `Failed (${res.status})`);
        }
        const data = (await res.json()) as QuoteBuilderResponse;
        if (cancelled) return;
        setLineItems(data.lineItems?.length ? data.lineItems : [{ label: "", qty: 1, price: 0 }]);
        setCurrency(data.currency || "USD");
        setAiNotes(data.aiNotes || "");
        if (data.suggestedDeposit) {
          setDepositType(data.suggestedDeposit.type === "fixed" ? "fixed" : "percentage");
          setDepositValue(Number(data.suggestedDeposit.value) || 50);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to generate quote");
          toast.error(err instanceof Error ? err.message : "Failed to generate quote");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lead]);

  const total = React.useMemo(
    () => lineItems.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0), 0),
    [lineItems]
  );

  const depositAmount = React.useMemo(() => {
    if (depositType === "percentage") {
      return Math.round((total * (Number(depositValue) || 0)) / 100);
    }
    return Number(depositValue) || 0;
  }, [depositType, depositValue, total]);

  const updateLineItem = (idx: number, patch: Partial<QuoteLineItem>) => {
    setLineItems((cur) => cur.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addLineItem = () => {
    setLineItems((cur) => [...cur, { label: "", qty: 1, price: 0 }]);
  };

  const removeLineItem = (idx: number) => {
    setLineItems((cur) => cur.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    if (!lead) return;
    // Basic validation
    const validItems = lineItems.filter((it) => it.label.trim() !== "" || it.price > 0);
    if (validItems.length === 0) {
      toast.error("Add at least one line item before sending the quote.");
      return;
    }
    if (total <= 0) {
      toast.error("Quote total must be greater than zero.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: lead.id,
          lineItems: validItems.map((it) => ({
            label: it.label.trim() || "Item",
            qty: Number(it.qty) || 1,
            price: Number(it.price) || 0,
          })),
          totalAmount: total,
          currency,
          depositType,
          depositValue: Number(depositValue) || 0,
          aiNotes,
          validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Failed (${res.status})`);
      }
      toast.success("Quote sent! Booking moved to “Quote Sent”.");
      onSent("quote_sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send quote");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-brand" />
            AI Quote Builder
          </DialogTitle>
          <DialogDescription>
            {lead
              ? `Generated for ${lead.name} — ${lead.eventType || "enquiry"} on ${formatEventDate(lead.eventDate)}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="size-8 animate-spin text-brand" />
            <p className="text-sm text-muted-foreground">
              Generating a tailored quote with AI…
            </p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <p className="font-semibold">Couldn&apos;t generate the quote.</p>
            <p className="mt-1 text-rose-600">{error}</p>
            <p className="mt-2 text-xs text-rose-500">
              You can close this dialog and try again, or add line items manually.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Line items */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-sm font-semibold">Line items</Label>
                <Button variant="outline" size="sm" onClick={addLineItem} className="gap-1.5">
                  <Plus className="size-3.5" />
                  Add row
                </Button>
              </div>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium">Description</th>
                      <th className="w-16 px-2 py-1.5 text-right font-medium">Qty</th>
                      <th className="w-28 px-2 py-1.5 text-right font-medium">Price</th>
                      <th className="w-28 px-2 py-1.5 text-right font-medium">Subtotal</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, idx) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="px-2 py-1.5">
                          <Input
                            value={item.label}
                            onChange={(e) => updateLineItem(idx, { label: e.target.value })}
                            placeholder="e.g. Wedding cake (3-tier)"
                            className="h-8 border-0 bg-transparent px-1 focus-visible:ring-1"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            min={0}
                            value={item.qty}
                            onChange={(e) => updateLineItem(idx, { qty: Number(e.target.value) })}
                            className="h-8 border-0 bg-transparent text-right focus-visible:ring-1"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            min={0}
                            value={item.price}
                            onChange={(e) => updateLineItem(idx, { price: Number(e.target.value) })}
                            className="h-8 border-0 bg-transparent text-right focus-visible:ring-1"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right text-sm tabular-nums">
                          {formatMoney((Number(item.qty) || 0) * (Number(item.price) || 0), currency)}
                        </td>
                        <td className="px-1 py-1.5 text-center">
                          <button
                            onClick={() => removeLineItem(idx)}
                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600"
                            aria-label="Remove row"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {lineItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-center text-xs text-muted-foreground">
                          No line items yet — click “Add row”.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-muted/30">
                      <td colSpan={3} className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Total
                      </td>
                      <td className="px-2 py-2 text-right text-base font-extrabold tabular-nums">
                        {formatMoney(total, currency)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Deposit + validity */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Deposit type</Label>
                <Select
                  value={depositType}
                  onValueChange={(v) => setDepositType(v as "percentage" | "fixed")}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  {depositType === "percentage" ? "Deposit %" : "Deposit amount"}
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={depositValue}
                  onChange={(e) => setDepositValue(Number(e.target.value))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Valid until</Label>
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Deposit due now: <span className="font-semibold text-foreground">{formatMoney(depositAmount, currency)}</span>
            </p>

            {/* AI cover letter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                AI cover letter (editable)
              </Label>
              <Textarea
                value={aiNotes}
                onChange={(e) => setAiNotes(e.target.value)}
                rows={5}
                placeholder="A friendly cover letter for your customer…"
                className="resize-y"
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            <X className="size-4" />
            Cancel
          </Button>
          {!loading && !error && (
            <Button
              onClick={handleSend}
              disabled={sending || lineItems.length === 0}
              className="gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90"
            >
              {sending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <FileText className="size-4" />
                  Send Quote
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
