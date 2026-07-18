/**
 * Archived on 2026-07-14
 * Reason:
 * No verified runtime references found.
 * Preserved for future features.
 *
 * DO NOT IMPORT FROM THIS DIRECTORY.
 */

"use client";

/**
 * Remembers vendor emails in localStorage so the header can instantly show
 * "Dashboard" (instead of "List your business") when a vendor signs back in —
 * even before the /api/vendor/me query finishes loading.
 *
 * Flow:
 *   1. Vendor creates a listing → we save their email here.
 *   2. Vendor signs out, signs back in (same email) → header checks this list
 *      and shows "Dashboard" immediately, no flicker.
 *   3. The real check (useVendorDashboard query) still runs in the background;
 *      if it turns out the vendor was deleted, we remove the stale email.
 */

const KEY = "fmb-pmp:vendor-emails";

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((e) => typeof e === "string") : [];
  } catch {
    return [];
  }
}

function write(emails: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(emails));
  } catch {
    // ignore
  }
}

/** Remember that this email owns a vendor listing. */
export function rememberVendorEmail(email: string) {
  if (!email) return;
  const emails = read();
  const lower = email.toLowerCase();
  if (!emails.includes(lower)) {
    emails.push(lower);
    write(emails);
  }
}

/** Check if this email is remembered as a vendor owner. */
export function isVendorEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  try {
    return read().includes(email.toLowerCase());
  } catch {
    return false;
  }
}

/** Remove a remembered email (e.g. if the vendor listing was deleted). */
export function forgetVendorEmail(email: string) {
  if (!email) return;
  const emails = read();
  const lower = email.toLowerCase();
  const next = emails.filter((e) => e !== lower);
  if (next.length !== emails.length) write(next);
}
