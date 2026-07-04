"use client";

/** Client-safe support constants (mirrors server taxonomy). */

export const TICKET_STATUSES = ["open", "pending", "waiting_vendor", "in_progress", "resolved", "closed"] as const;

export const TICKET_STATUS_META: Record<string, { label: string; className: string; dot: string }> = {
  open: { label: "Open", className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800", dot: "bg-blue-500" },
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800", dot: "bg-amber-500" },
  waiting_vendor: { label: "Waiting for You", className: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800", dot: "bg-violet-500" },
  in_progress: { label: "In Progress", className: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800", dot: "bg-sky-500" },
  resolved: { label: "Resolved", className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800", dot: "bg-emerald-500" },
  closed: { label: "Closed", className: "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700", dot: "bg-zinc-400" },
};

export const TICKET_CATEGORIES = [
  { value: "account", label: "Account Issue" },
  { value: "business_listing", label: "Business Listing" },
  { value: "subscription", label: "Subscription" },
  { value: "payments", label: "Payments" },
  { value: "products", label: "Products" },
  { value: "photos", label: "Photos" },
  { value: "reviews", label: "Reviews" },
  { value: "claim_business", label: "Claim Business" },
  { value: "technical_bug", label: "Technical Bug" },
  { value: "feature_request", label: "Feature Request" },
  { value: "other", label: "Other" },
] as const;

export const TICKET_PRIORITIES = [
  { value: "low", label: "Low", className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  { value: "medium", label: "Medium", className: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
  { value: "high", label: "High", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  { value: "urgent", label: "Urgent", className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300" },
] as const;

export function statusMeta(status: string) {
  return TICKET_STATUS_META[status] || TICKET_STATUS_META.open;
}

export function categoryLabel(value: string): string {
  return TICKET_CATEGORIES.find((c) => c.value === value)?.label || value;
}

export function priorityMeta(value: string) {
  return TICKET_PRIORITIES.find((p) => p.value === value) || TICKET_PRIORITIES[1];
}

export function fmtTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  } catch { return iso; }
}
