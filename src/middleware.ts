import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ensureCsrfCookie, validateCsrf } from "@/lib/security/csrf";

/**
 * Middleware that:
 * 1. Refreshes the Supabase auth session on every request.
 * 2. Enforces CSRF protection on mutation requests.
 * 3. Sets CSRF cookie on GET requests if not present.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/vendors/") ||
    pathname.startsWith("/hero-")
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
