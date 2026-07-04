/**
 * Client-safe inventory constants & helpers.
 * Mirrors the server-side taxonomy in inventory-service.ts but has zero
 * server-only imports, so it can be imported from "use client" components.
 */

export const PRODUCT_STATUSES = [
  "active",
  "draft",
  "out_of_stock",
  "temporarily_unavailable",
  "seasonal",
  "archived",
] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export interface StatusMeta {
  label: string;
  className: string;
  dot: string;
}

export const STATUS_META: Record<ProductStatus, StatusMeta> = {
  active: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  out_of_stock: {
    label: "Out of Stock",
    className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800",
    dot: "bg-red-500",
  },
  temporarily_unavailable: {
    label: "Temp. Unavailable",
    className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  seasonal: {
    label: "Seasonal",
    className: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800",
    dot: "bg-violet-500",
  },
  archived: {
    label: "Archived",
    className: "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700",
    dot: "bg-zinc-400",
  },
};

export function statusMeta(status: string | null | undefined): StatusMeta {
  if (status && status in STATUS_META) return STATUS_META[status as ProductStatus];
  return STATUS_META.active;
}

export const PREPARATION_TIMES: { value: string; label: string; hours: number }[] = [
  { value: "same_day", label: "Same Day", hours: 0 },
  { value: "24_hours", label: "24 Hours", hours: 24 },
  { value: "2_days", label: "2 Days", hours: 48 },
  { value: "3_days", label: "3 Days", hours: 72 },
  { value: "1_week", label: "1 Week", hours: 168 },
  { value: "custom", label: "Custom", hours: -1 },
];

export function prepTimeLabel(p: {
  preparationTimeCategory?: string | null;
  preparationTimeCustom?: string | null;
  prepTime?: string | null;
}): string | null {
  if (p.preparationTimeCategory && p.preparationTimeCategory !== "custom") {
    const found = PREPARATION_TIMES.find((t) => t.value === p.preparationTimeCategory);
    if (found) return found.label;
  }
  if (p.preparationTimeCategory === "custom" && p.preparationTimeCustom) {
    return p.preparationTimeCustom;
  }
  return p.prepTime ?? null;
}

export const BOOKING_NOTICE_PRESETS: { value: string; label: string; hours: number }[] = [
  { value: "2", label: "2 hours", hours: 2 },
  { value: "24", label: "24 hours", hours: 24 },
  { value: "48", label: "48 hours", hours: 48 },
  { value: "168", label: "7 days", hours: 168 },
];

export const AVAILABILITY_MODES = [
  { value: "always", label: "Always Available", hint: "Available every day" },
  { value: "selected_days", label: "Selected Days", hint: "e.g. Fri / Sat / Sun" },
  { value: "date_range", label: "Date Range", hint: "e.g. 1 Dec → 31 Dec" },
] as const;

export const WEEKDAY_OPTIONS = [
  { value: "SUN", label: "Sun" },
  { value: "MON", label: "Mon" },
  { value: "TUE", label: "Tue" },
  { value: "WED", label: "Wed" },
  { value: "THU", label: "Thu" },
  { value: "FRI", label: "Fri" },
  { value: "SAT", label: "Sat" },
];

export const SERVICE_AREA_TYPES = [
  { value: "local", label: "Local" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "country", label: "Country" },
  { value: "worldwide", label: "Worldwide" },
] as const;

export const BLOCK_TYPES = [
  { value: "holiday", label: "Holiday" },
  { value: "vacation", label: "Vacation" },
  { value: "fully_booked", label: "Fully Booked" },
  { value: "manual", label: "Manual Block" },
  { value: "maintenance", label: "Maintenance" },
] as const;

export function parseArr<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as T[]; } catch { return []; }
}

/** Format an ISO date string as a short readable date. */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

/** Convert an ISO date to yyyy-mm-dd for <input type="date"> values. */
export function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
}
