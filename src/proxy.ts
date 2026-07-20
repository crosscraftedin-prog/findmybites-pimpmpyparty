import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ensureCsrfCookie, validateCsrf } from "@/lib/security/csrf";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/security/rate-limiter";

/**
 * Proxy (formerly middleware) that:
 * 1. Enforces API rate limiting on all /api/ routes.
 * 2. Refreshes the Supabase auth session on every request.
 * 3. Enforces CSRF protection on mutation requests.
 * 4. Sets CSRF cookie on GET requests if not present.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Rate limiting for API routes ──
  // Skip rate limiting for webhooks (Razorpay sends bursts) and auth callbacks
  if (pathname.startsWith("/api/") &&
      !pathname.startsWith("/api/webhooks/") &&
      !pathname.startsWith("/api/auth/")) {
    const ip = getClientIP(request);
    const method = request.method;

    // Apply different limits based on route type
    let limit;
    if (pathname.startsWith("/api/ai/") || pathname.startsWith("/api/vendor/ai/") || pathname.startsWith("/api/vendor/marketing/ai/") || pathname.startsWith("/api/josh/")) {
      limit = RATE_LIMITS.ai;
    } else if (pathname.startsWith("/api/upload")) {
      limit = RATE_LIMITS.upload;
    } else if (pathname.startsWith("/api/bookings/smart") || pathname.startsWith("/api/leads/")) {
      limit = RATE_LIMITS.publicWrite;
    } else if (method === "GET") {
      limit = RATE_LIMITS.publicRead;
    } else {
      limit = RATE_LIMITS.publicWrite;
    }

    const result = checkRateLimit(`${ip}:${pathname}`, limit.windowMs, limit.max);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  // Skip middleware entirely for static assets and public API endpoints
  // that don't need auth/session refresh — this saves ~200-500ms per request
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/vendors/") ||
    pathname.startsWith("/hero-") ||
    // Public read-only APIs — no auth needed, skip session refresh
    (pathname.startsWith("/api/") &&
     !pathname.startsWith("/api/vendor/") &&
     !pathname.startsWith("/api/admin/") &&
     !pathname.startsWith("/api/bookings/") &&
     !pathname.startsWith("/api/payments/") &&
     !pathname.startsWith("/api/upload") &&
     !pathname.startsWith("/api/claim/"))
  ) {
    return NextResponse.next();
  }

  // ── CSRF validation for mutation requests ──
  if (!validateCsrf(request)) {
    return NextResponse.json(
      { error: "CSRF token validation failed" },
      { status: 403 }
    );
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // ── Ensure CSRF cookie is set on GET requests ──
  if (request.method === "GET") {
    response = ensureCsrfCookie(request, response);
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );
    await supabase.auth.getUser();
  } catch {
    // Non-fatal — continue without refreshing
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
