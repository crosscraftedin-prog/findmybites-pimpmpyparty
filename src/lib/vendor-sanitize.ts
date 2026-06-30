import { migrateCategory } from "./constants";

const VALID_ECOSYSTEMS = new Set(["FINDMYBITES", "PIMPMYPARTY"]);
const VALID_PRICE_RANGES = new Set(["$", "$$", "$$$", "$$$$"]);

export function isValidEcosystem(v: unknown): v is string {
  return typeof v === "string" && VALID_ECOSYSTEMS.has(v);
}
export function isValidPriceRange(v: unknown): v is string {
  return typeof v === "string" && VALID_PRICE_RANGES.has(v);
}

/**
 * Sanitize an Instagram input into a bare handle (no @, no URL).
 * Accepts "@handle", "instagram.com/handle", "https://instagram.com/handle",
 * or just "handle". Returns "" if invalid.
 */
export function sanitizeInstagram(input: unknown): string {
  if (typeof input !== "string") return "";
  let s = input.trim();
  if (!s) return "";
  s = s.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  s = s.replace(/^(www\.)?instagram\.com\//i, "");
  s = s.replace(/^@+/, "");
  s = s.split(/[/?#]/)[0];
  if (!/^[A-Za-z0-9._]{1,30}$/.test(s)) return "";
  return s;
}

/**
 * Sanitize a website URL: ensure it has a protocol + valid host. Returns "" if unsafe.
 */
export function sanitizeWebsite(input: unknown): string {
  if (typeof input !== "string") return "";
  let s = input.trim();
  if (!s) return "";
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (!/\./.test(u.hostname)) return "";
    return u.toString();
  } catch {
    return "";
  }
}

/**
 * Sanitize a WhatsApp number: digits only, 7-15 (E.164 range). Returns "" if invalid.
 */
export function sanitizeWhatsApp(input: unknown): string {
  if (typeof input !== "string") return "";
  const digits = input.replace(/[^\d]/g, "");
  if (digits.length < 7 || digits.length > 15) return "";
  return digits;
}

/** Validate subcategory. Returns null if empty.
 *  Subcategories are now DB-driven + custom entries allowed via "Other" option.
 *  We accept any non-empty string — validation happens in the DB.
 */
export function resolveSubcategory(
  raw: unknown,
  category: string
): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  return s || null;
}

/** Accept either local /uploads/ paths or Supabase Storage public URLs.
 *  Prevents arbitrary remote/javascript URLs. */
export function isSafeUploadUrl(u: unknown): u is string {
  if (typeof u !== "string" || u.length > 500) return false;
  // local uploads (legacy/dev)
  if (u.startsWith("/uploads/")) return true;
  // Supabase Storage public URLs
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && u.startsWith(`${supabaseUrl}/storage/v1/object/public/`)) return true;
  // also accept generic supabase.co storage URLs (for safety)
  if (u.includes(".supabase.co/storage/v1/object/public/")) return true;
  return false;
}
