/**
 * CSRF Protection Middleware.
 * ───────────────────────────────────────────────────────────────────────────
 * Implements double-submit cookie pattern + Origin checking for API routes.
 *
 * Note: Supabase Auth cookies are already httpOnly + SameSite=Lax,
 * which provides CSRF protection via the browser's SameSite policy.
 * This adds an explicit defense-in-depth layer.
 *
 * IMPORTANT: This file runs in the Edge Runtime (Next.js middleware).
 * Do NOT use Node.js 'crypto' module — use the Web Crypto API instead.
 */
import { NextRequest, NextResponse } from "next/server";

const CSRF_COOKIE = "csrf-token";
const CSRF_HEADER = "x-csrf-token";

const EXEMPT_PATHS = [
  "/api/auth",
  "/api/payments/verify",
  "/api/payments/verify-payment",
  "/api/health",
];

export function generateCsrfToken(): string {
  // Web Crypto API — works in both Edge Runtime and Node.js
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function ensureCsrfCookie(req: NextRequest, res: NextResponse): NextResponse {
  const existing = req.cookies.get(CSRF_COOKIE);
  if (!existing) {
    const token = generateCsrfToken();
    res.cookies.set(CSRF_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  return res;
}

export function validateCsrf(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return true;

  const path = req.nextUrl.pathname;
  if (EXEMPT_PATHS.some((p) => path.startsWith(p))) return true;

  // For API routes: enforce Origin header check (defense-in-depth on top of SameSite cookies)
  if (path.startsWith("/api/")) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) return false;
      } catch { return false; }
    }
    return true;
  }

  // For non-API mutation routes (server actions): double-submit cookie
  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = req.headers.get(CSRF_HEADER);
  if (!cookieToken || !headerToken) return false;
  return cookieToken === headerToken;
}
