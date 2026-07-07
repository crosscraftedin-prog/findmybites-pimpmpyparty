/**
 * Centralized AI Route Helper
 * ───────────────────────────────────────────────────────────────────────────
 * Determines which AI assistant should be shown based on the current route.
 *
 * Routes:
 *   /vendor/[slug]      → Vendor AI (vendor-scoped assistant)
 *   /product/[slug]     → Vendor AI (product belongs to a vendor)
 *   /dashboard/*        → No floating AI (dashboard has its own tools)
 *   /admin/*            → No floating AI (admin has its own tools)
 *   Everything else     → Event Planner AI (marketplace concierge)
 *
 * Usage:
 *   import { isVendorPage, isMarketplacePage, getAIContext } from "@/lib/ai-route-helper";
 *
 *   if (isVendorPage(pathname)) {
 *     // Render Vendor AI
 *   } else if (isMarketplacePage(pathname)) {
 *     // Render Event Planner AI
 *   }
 */

/**
 * Returns true if the current route is a vendor profile or product page.
 * These pages show the Vendor AI assistant (not the Event Planner).
 */
export function isVendorPage(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname.startsWith("/vendor/") || pathname.startsWith("/product/");
}

/**
 * Returns true if the current route is a dashboard or admin page.
 * These pages don't show any floating AI widget.
 */
export function isDashboardPage(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/account");
}

/**
 * Returns true if the current route is a marketplace page where the
 * Event Planner AI should be shown.
 */
export function isMarketplacePage(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (isVendorPage(pathname)) return false;
  if (isDashboardPage(pathname)) return false;
  return true;
}

/**
 * Returns the AI context for the current route.
 * - "vendor" → Vendor AI should be shown
 * - "marketplace" → Event Planner AI should be shown
 * - "none" → No floating AI (dashboard/admin pages)
 */
export function getAIContext(pathname: string | null | undefined): "vendor" | "marketplace" | "none" {
  if (isVendorPage(pathname)) return "vendor";
  if (isDashboardPage(pathname)) return "none";
  return "marketplace";
}
