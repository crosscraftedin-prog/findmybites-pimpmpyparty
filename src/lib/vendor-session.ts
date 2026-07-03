/**
 * Vendor session resolver.
 * Resolves the authenticated vendor from the Supabase session — never trusts
 * a frontend-supplied vendorId. All vendor inventory routes use this.
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export interface ResolvedVendor {
  id: string;
  ecosystem: string | null;
  category: string | null;
  currency: string | null;
  businessName: string | null;
}

/**
 * Returns the vendor row owned by the authenticated user, or null.
 * Use this at the top of every vendor-scoped API route.
 */
export async function resolveVendorFromSession(): Promise<ResolvedVendor | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return null;

    const vendor = await db.vendor.findFirst({
      where: { owner_user_id: session.user.id },
      select: { id: true, ecosystem: true, category: true, currency: true, businessName: true },
    });
    return vendor ?? null;
  } catch {
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
