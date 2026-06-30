"use client";

import * as React from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  Trash2,
  X,
  Clock,
  Sparkles,
  CalendarPlus,
  CalendarX2,
  Eraser,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────────────────────

type AvailStatus = "available" | "busy" | "booked" | "holiday" | "partial";

interface AvailabilityEntry {
  id: string;
  vendorId: string;
  date: string; // ISO string
  status: AvailStatus;
  timeSlots?: string | null; // JSON string of [{ start, end }]
  note?: string | null;
  bookingId?: string | null;
}

interface AvailabilityProps {
  /** Vendor id (used for fetching the calendar). POST/DELETE use the vendor session. */
  vendorId: string;
}

const STATUS_META: Record<
  AvailStatus,
  { label: string; cellClass: string; dotClass: string; chipClass: string; legend: string }
> = {
  available: {
    label: "Available",
    cellClass: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
    dotClass: "bg-emerald-500",
    chipClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    legend: "Free for bookings",
  },
  busy: {
    label: "Busy",
    cellClass: "bg-amber-100 text-amber-800 hover:bg-amber-200",
    dotClass: "bg-amber-500",
    chipClass: "bg-amber-100 text-amber-800 border-amber-200",
    legend: "Limited availability",
  },
  booked: {
    label: "Booked",
    cellClass: "bg-rose-100 text-rose-800 hover:bg-rose-200",
    dotClass: "bg-rose-500",
    chipClass: "bg-rose-100 text-rose-800 border-rose-200",
    legend: "Fully booked",
  },
  holiday: {
    label: "Holiday",
    cellClass: "bg-slate-200 text-slate-600 hover:bg-slate-300",
    dotClass: "bg-slate-400",
    chipClass: "bg-slate-200 text-slate-700 border-slate-300",
    legend: "Not working",
  },
  partial: {
    label: "Partial",
    cellClass: "bg-violet-100 text-violet-800 hover:bg-violet-200",
    dotClass: "bg-violet-500",
    chipClass: "bg-violet-100 text-violet-800 border-violet-200",
    legend: "Available part of the day",
  },
};

const ALL_STATUSES: AvailStatus[] = ["available", "busy", "booked", "holiday", "partial"];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─────────────────────────────────────────────────────────────────────────────
// Date helpers (use UTC to avoid tz drift when constructing date keys)
// ─────────────────────────────────────────────────────────────────────────────

function toISODate(d: Date): string {
  // Returns YYYY-MM-DD using the date's local components
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthMatrix(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  // Pad to a multiple of 7
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWeekday(d: Date): boolean {
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

function parseTimeSlots(raw: string | null | undefined): { start: string; end: string }[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((s) => s && typeof s === "object" && "start" in s && "end" in s)
        .map((s) => ({ start: String(s.start), end: String(s.end) }));
    }
  } catch {
    /* ignore */
  }
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function Availability({ vendorId }: AvailabilityProps) {
  const today = React.useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = React.useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [entries, setEntries] = React.useState<AvailabilityEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [editing, setEditing] = React.useState<{ date: string; entry: AvailabilityEntry | null } | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Map of date → entry for quick lookup
  const byDate = React.useMemo(() => {
    const m = new Map<string, AvailabilityEntry>();
    for (const e of entries) {
      const key = toISODate(new Date(e.date));
      m.set(key, e);
    }
    return m;
  }, [entries]);

  // Fetch availability for current month (+ adjacent months for navigation context)
  const fetchEntries = React.useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!vendorId) return;
      const silent = opts?.silent ?? false;
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        // Fetch current view month + 1 forward + 1 back so navigation is smooth
        const months = [-1, 0, 1].map((offset) => {
          const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + offset, 1);
          return monthKey(d);
        });
        const results = await Promise.all(
          months.map((mk) =>
            fetch(`/api/availability?vendorId=${encodeURIComponent(vendorId)}&month=${mk}`).then(
              (r) => r.json()
            )
          )
        );
        const merged: AvailabilityEntry[] = [];
        for (const r of results) {
          if (r && Array.isArray(r.availability)) {
            merged.push(...(r.availability as AvailabilityEntry[]));
          }
        }
        // Deduplicate by id (in case of overlap)
        const seen = new Set<string>();
        const unique = merged.filter((e) => {
          if (seen.has(e.id)) return false;
          seen.add(e.id);
          return true;
        });
        setEntries(unique);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load availability");
      } finally {
        if (silent) setRefreshing(false);
        else setLoading(false);
      }
    },
    [vendorId, viewMonth]
  );

  React.useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // ── Save / Delete ──
  const handleSave = async (input: {
    date: string;
    status: AvailStatus;
    note: string;
    timeSlots: { start: string; end: string }[];
  }) => {
    setSaving(true);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: input.date,
          status: input.status,
          note: input.note || undefined,
          timeSlots: input.status === "partial" && input.timeSlots.length > 0 ? input.timeSlots : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Failed (${res.status})`);
      }
      toast.success(`${STATUS_META[input.status].label} — ${input.date}`);
      setEditing(null);
      fetchEntries({ silent: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/availability?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Failed (${res.status})`);
      }
      toast.success("Availability entry removed");
      setEditing(null);
      fetchEntries({ silent: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  // ── Quick actions ──
  const handleMarkAllWeekdays = async () => {
    setSaving(true);
    try {
      // Current month's weekdays
      const year = viewMonth.getFullYear();
      const month = viewMonth.getMonth();
      const days = new Date(year, month + 1, 0).getDate();
      const targets: string[] = [];
      for (let d = 1; d <= days; d++) {
        const date = new Date(year, month, d);
        if (isWeekday(date)) targets.push(toISODate(date));
      }
      await Promise.all(
        targets.map((date) =>
          fetch("/api/availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, status: "available" }),
          })
        )
      );
      toast.success(`Marked ${targets.length} weekdays as available`);
      fetchEntries({ silent: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark weekdays");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkNext30Days = async () => {
    setSaving(true);
    try {
      const targets: string[] = [];
      const now = new Date();
      for (let i = 0; i < 30; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        targets.push(toISODate(d));
      }
      await Promise.all(
        targets.map((date) =>
          fetch("/api/availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, status: "available" }),
          })
        )
      );
      toast.success(`Marked next 30 days as available`);
      fetchEntries({ silent: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark days");
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Clear all availability entries for the visible months?")) return;
    setSaving(true);
    try {
      await Promise.all(
        entries.map((e) =>
          fetch(`/api/availability?id=${encodeURIComponent(e.id)}`, { method: "DELETE" })
        )
      );
      toast.success("Cleared all availability entries");
      fetchEntries({ silent: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to clear");
    } finally {
      setSaving(false);
    }
  };

  // ── Derived stats ──
  const availableThisMonth = React.useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    let count = 0;
    byDate.forEach((entry, key) => {
      const d = new Date(key);
      if (d.getFullYear() === year && d.getMonth() === month && entry.status === "available") {
        count++;
      }
    });
    return count;
  }, [byDate, viewMonth]);

  const canGoPrev = React.useMemo(() => {
    // Allow going back up to 12 months
    const min = new Date(today.getFullYear(), today.getMonth() - 12, 1);
    return new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1) >= min;
  }, [viewMonth, today]);

  const canGoNext = React.useMemo(() => {
    // Allow going forward up to 2 months from today's month (per spec)
    const max = new Date(today.getFullYear(), today.getMonth() + 2, 1);
    return new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1) <= max;
  }, [viewMonth, today]);

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Availability Calendar</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Mark days as available, busy, or booked so customers see accurate dates when enquiring.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchEntries({ silent: true })}
          disabled={refreshing}
          className="gap-1.5"
        >
          {refreshing ? <Loader2 className="size-4 animate-spin" /> : <CalendarIcon className="size-4" />}
          Refresh
        </Button>
      </div>

      {/* Quick actions */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={handleMarkAllWeekdays} disabled={saving} className="gap-1.5">
          <CalendarPlus className="size-3.5" />
          Mark weekdays available
        </Button>
        <Button size="sm" variant="outline" onClick={handleMarkNext30Days} disabled={saving} className="gap-1.5">
          <Sparkles className="size-3.5" />
          Next 30 days available
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleClearAll}
          disabled={saving || entries.length === 0}
          className="gap-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
        >
          <Eraser className="size-3.5" />
          Clear all
        </Button>
      </div>

      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-card p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          disabled={!canGoPrev}
          className="gap-1"
        >
          <ChevronLeft className="size-4" /> Prev
        </Button>
        <div className="text-center">
          <p className="text-[15px] font-bold">{monthLabel(viewMonth)}</p>
          <p className="text-[11px] text-muted-foreground">
            {availableThisMonth} available {availableThisMonth === 1 ? "day" : "days"} this month
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          disabled={!canGoNext}
          className="gap-1"
        >
          Next <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
        {loading ? (
          <CalendarSkeleton />
        ) : (
          <CalendarGrid
            viewMonth={viewMonth}
            today={today}
            byDate={byDate}
            onDayClick={(date, entry) => setEditing({ date, entry })}
          />
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 rounded-xl border border-border bg-card p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Legend
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {ALL_STATUSES.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className={cn(
                  "size-3.5 rounded-full border",
                  STATUS_META[s].cellClass
                )}
              />
              <div>
                <p className="text-[12px] font-medium">{STATUS_META[s].label}</p>
                <p className="text-[10px] text-muted-foreground">{STATUS_META[s].legend}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Day editor dialog */}
      <DayEditorDialog
        editing={editing}
        saving={saving}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Calendar grid
// ─────────────────────────────────────────────────────────────────────────────

function CalendarGrid({
  viewMonth,
  today,
  byDate,
  onDayClick,
}: {
  viewMonth: Date;
  today: Date;
  byDate: Map<string, AvailabilityEntry>;
  onDayClick: (date: string, entry: AvailabilityEntry | null) => void;
}) {
  const cells = getMonthMatrix(viewMonth.getFullYear(), viewMonth.getMonth());

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {WEEKDAY_LABELS.map((d) => (
        <div
          key={d}
          className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {d}
        </div>
      ))}
      {cells.map((date, i) => {
        if (!date) return <div key={i} className="aspect-square" />;
        const key = toISODate(date);
        const entry = byDate.get(key) ?? null;
        const isToday = isSameDay(date, today);
        const isPast = date < today && !isToday;
        const meta = entry ? STATUS_META[entry.status] : null;
        return (
          <button
            key={i}
            onClick={() => onDayClick(key, entry)}
            className={cn(
              "relative flex aspect-square flex-col items-center justify-center rounded-lg border text-[12px] font-medium transition-colors",
              meta
                ? cn(meta.cellClass, "border-transparent")
                : "border-border bg-background text-foreground/70 hover:bg-accent",
              isPast && "opacity-50",
              isToday && "ring-2 ring-brand ring-offset-1"
            )}
            title={entry ? `${STATUS_META[entry.status].label}${entry.note ? ` · ${entry.note}` : ""}` : "Click to set availability"}
          >
            <span>{date.getDate()}</span>
            {entry && (
              <span
                className={cn(
                  "mt-0.5 hidden size-1.5 rounded-full sm:block",
                  STATUS_META[entry.status].dotClass
                )}
              />
            )}
            {entry?.note && (
              <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-foreground/40" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Day editor dialog
// ─────────────────────────────────────────────────────────────────────────────

function DayEditorDialog({
  editing,
  saving,
  onSave,
  onDelete,
  onClose,
}: {
  editing: { date: string; entry: AvailabilityEntry | null } | null;
  saving: boolean;
  onSave: (input: {
    date: string;
    status: AvailStatus;
    note: string;
    timeSlots: { start: string; end: string }[];
  }) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const open = editing !== null;
  const [status, setStatus] = React.useState<AvailStatus>("available");
  const [note, setNote] = React.useState("");
  const [slots, setSlots] = React.useState<{ start: string; end: string }[]>([
    { start: "09:00", end: "13:00" },
  ]);

  // Reset state when editing target changes
  React.useEffect(() => {
    if (!editing) return;
    const existing = editing.entry;
    setStatus(existing?.status ?? "available");
    setNote(existing?.note ?? "");
    const parsed = parseTimeSlots(existing?.timeSlots);
    setSlots(parsed.length > 0 ? parsed : [{ start: "09:00", end: "13:00" }]);
  }, [editing?.date, editing?.entry?.id]);

  const handleAddSlot = () => {
    setSlots((cur) => [...cur, { start: "14:00", end: "18:00" }]);
  };
  const handleRemoveSlot = (idx: number) => {
    setSlots((cur) => cur.filter((_, i) => i !== idx));
  };
  const handleSlotChange = (idx: number, field: "start" | "end", value: string) => {
    setSlots((cur) => cur.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const handleSave = () => {
    if (!editing) return;
    if (status === "partial" && slots.length === 0) {
      toast.error("Add at least one time slot for partial availability");
      return;
    }
    onSave({ date: editing.date, status, note, timeSlots: slots });
  };

  const dateLabel = editing
    ? new Date(editing.date + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="size-4 text-brand" />
            {dateLabel}
          </DialogTitle>
          <DialogDescription>
            Set your availability for this date. Customers will see this status when enquiring.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as AvailStatus)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    <span className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", STATUS_META[s].dotClass)} />
                      {STATUS_META[s].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time slots — only for partial */}
          {status === "partial" && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Available time slots</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAddSlot}
                  className="h-7 gap-1 px-2 text-[11px]"
                >
                  <CalendarPlus className="size-3" /> Add slot
                </Button>
              </div>
              {slots.map((slot, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Clock className="size-3.5 text-muted-foreground" />
                  <Input
                    type="time"
                    value={slot.start}
                    onChange={(e) => handleSlotChange(idx, "start", e.target.value)}
                    className="h-8 w-[110px]"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={slot.end}
                    onChange={(e) => handleSlotChange(idx, "end", e.target.value)}
                    className="h-8 w-[110px]"
                  />
                  <button
                    onClick={() => handleRemoveSlot(idx)}
                    className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Remove slot"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              {slots.length === 0 && (
                <p className="text-[11px] text-muted-foreground">No time slots — click “Add slot”.</p>
              )}
            </div>
          )}

          {/* Note */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Note (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Morning only, Wedding booked, Out of town…"
              rows={2}
              className="resize-none text-[13px]"
            />
          </div>

          {/* Current status badge */}
          {editing?.entry && (
            <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-[11px]">
              <span className="text-muted-foreground">Current entry:</span>
              <Badge variant="outline" className={cn("border text-[10px]", STATUS_META[editing.entry.status].chipClass)}>
                {STATUS_META[editing.entry.status].label}
              </Badge>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {editing?.entry ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(editing.entry!.id)}
              disabled={saving}
              className="gap-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Delete
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CalendarX2 className="size-3.5" />
              No entry yet
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {WEEKDAY_LABELS.map((d) => (
        <div key={d} className="pb-1 text-center text-[10px] font-semibold uppercase text-muted-foreground">
          {d}
        </div>
      ))}
      {Array.from({ length: 35 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-lg" />
      ))}
    </div>
  );
}
