/**
 * Vendor session resolver.
 * Resolves the authenticated vendor from the Supabase session — never trusts
 * a frontend-supplied vendorId. All vendor inventory routes use this.
 *
 * Uses getUser() first (verifies JWT with Supabase server-side, more reliable
 * on Vercel), then falls back to getSession() (reads from cookies).
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export interface ResolvedVendor {
  id: string;
  ecosystem: string | null;
  category: string | null;
  currency: string | null;
  name: string | null;
}

/**
 * Returns the vendor row owned by the authenticated user, or null.
 * Use this at the top of every vendor-scoped API route.
 */
export async function resolveVendorFromSession(): Promise<ResolvedVendor | null> {
  try {
    const supabase = await createSupabaseServerClient();

    // Step 1: Try getUser() (verifies JWT server-side)
    let userId: string | null = null;
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (!userErr && user?.id) {
        userId = user.id;
      }
    } catch {}

    // Step 2: Fallback to getSession() (reads from cookies)
    if (!userId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          userId = session.user.id;
        }
      } catch {}
    }

    if (!userId) return null;

    // Step 3: Look up vendor by owner_user_id (never trusts frontend vendorId)
    const vendor = await db.vendor.findFirst({
      where: { owner_user_id: userId },
      select: { id: true, ecosystem: true, category: true, currency: true, name: true },
    });

    return vendor ?? null;
  } catch (err) {
    logger.warn("vendor-session", "Failed to resolve vendor from session", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Resolve vendor AND verify ownership of a specific product in one call.
 * Returns { vendor, product } or { error }.
 */
export async function resolveVendorAndProduct(
  productId: string
): Promise<{ vendor: ResolvedVendor; product: any } | { error: string; status: number }> {
  const vendor = await resolveVendorFromSession();
  if (!vendor) {
    return { error: "Authentication required", status: 401 };
  }
  const product = await db.product.findFirst({
    where: { id: productId, vendorId: vendor.id },
  });
  if (!product) {
    return { error: "Product not found or not owned by you", status: 404 };
  }
  return { vendor, product };
}
