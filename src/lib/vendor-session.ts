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
  const ts = () => new Date().toISOString();
  console.log(`[TRACE] ${ts()} resolveVendorFromSession() — ENTER`);
  try {
    console.log(`[TRACE] ${ts()} resolveVendorFromSession() — creating Supabase server client`);
    const supabase = await createSupabaseServerClient();

    // Step 1: Try getUser()
    let userId: string | null = null;
    console.log(`[TRACE] ${ts()} resolveVendorFromSession() — calling getUser()`);
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr) {
        console.log(`[TRACE] ${ts()} resolveVendorFromSession() — getUser() ERROR: ${userErr.message}`);
      }
      if (!userErr && user?.id) {
        userId = user.id;
        console.log(`[TRACE] ${ts()} resolveVendorFromSession() — getUser() SUCCESS: userId=${userId}`);
      } else {
        console.log(`[TRACE] ${ts()} resolveVendorFromSession() — getUser() returned no user`);
      }
    } catch (e: any) {
      console.log(`[TRACE] ${ts()} resolveVendorFromSession() — getUser() THREW: ${e?.message}`);
    }

    // Step 2: Fallback to getSession()
    if (!userId) {
      console.log(`[TRACE] ${ts()} resolveVendorFromSession() — falling back to getSession()`);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          userId = session.user.id;
          console.log(`[TRACE] ${ts()} resolveVendorFromSession() — getSession() SUCCESS: userId=${userId}`);
        } else {
          console.log(`[TRACE] ${ts()} resolveVendorFromSession() — getSession() returned no session`);
        }
      } catch (e: any) {
        console.log(`[TRACE] ${ts()} resolveVendorFromSession() — getSession() THREW: ${e?.message}`);
      }
    }

    if (!userId) {
      console.log(`[TRACE] ${ts()} resolveVendorFromSession() — ❌ No userId resolved — returning null`);
      return null;
    }

    // Step 3: Look up vendor
    console.log(`[TRACE] ${ts()} resolveVendorFromSession() — looking up vendor by owner_user_id=${userId}`);
    const vendor = await db.vendor.findFirst({
      where: { owner_user_id: userId },
      select: { id: true, ecosystem: true, category: true, currency: true, name: true },
    });
    if (vendor) {
      console.log(`[TRACE] ${ts()} resolveVendorFromSession() — ✅ Vendor found: id=${vendor.id}, name="${vendor.name}"`);
    } else {
      console.log(`[TRACE] ${ts()} resolveVendorFromSession() — ❌ No vendor found for owner_user_id=${userId}`);
    }
    return vendor ?? null;
  } catch (err) {
    console.log(`[TRACE] ${ts()} resolveVendorFromSession() — ❌ THREW: ${err instanceof Error ? err.message : String(err)}`);
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
