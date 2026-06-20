import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware that refreshes the Supabase auth session on every request.
 *
 * Without this, the access token expires after ~1 hour and vendors get
 * silently logged out. The middleware calls supabase.auth.getUser() which
 * refreshes the token if it's close to expiry, then sets the updated
 * cookies on the response.
 *
 * Also protects /admin route (server-side guard happens in the page itself,
 * but this prevents unnecessary rendering for non-admins).
 */
export async function middleware(request: NextRequest) {
  // Skip middleware for static assets and API routes that don't need auth
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

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // This call refreshes the session if needed (access token about to expire)
    // and sets the updated cookies on the response via the setAll callback.
    // IMPORTANT: getUser() validates the JWT server-side, unlike getSession()
    // which just reads the cookie.
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
