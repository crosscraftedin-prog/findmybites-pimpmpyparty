"use client";

/** Shared client-safe helpers for the Marketing Center. */

export function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function fmtMoney(n: number): string {
  return `₹${(n / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function fmtPct(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" });
  } catch { return iso; }
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator?.clipboard) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  return Promise.resolve(false);
}
