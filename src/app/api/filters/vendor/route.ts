import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/filters/vendor?vendorId=xxx
 * Returns all filter values selected by a vendor.
 * Public (vendor profile pages display selected filters) — but only returns
 * filter group names + values, never internal IDs that could be spoofed.
 *
 * POST /api/filters/vendor
 * Saves vendor's filter value selections.
 * Body: { vendorId, filterValueIds: string[] }
 *
 * SECURITY (audit fix):
 *   - POST requires authentication (supabase.auth.getUser)
 *   - POST verifies the vendor belongs to the authenticated user (owner_user_id)
 *   - POST validates that every filterValueId belongs to a FilterGroup that is
 *     assigned to the vendor's category (CategoryFilter). This prevents a baker
 *     from submitting DJ "Music Genre" filter values.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const vendorId = sp.get("vendorId");

    if (!vendorId) {
      return NextResponse.json({ error: "vendorId required" }, { status: 400 });
    }

    const selections = await db.vendorFilterValue.findMany({
      where: { vendorId },
      include: {
        filterValue: {
          include: {
            group: true,
          },
        },
      },
    });

    // Group by filter group name
    const grouped: Record<string, string[]> = {};
    for (const sel of selections) {
      const groupName = sel.filterValue.group.name;
      if (!grouped[groupName]) grouped[groupName] = [];
      grouped[groupName].push(sel.filterValue.value);
    }

    return NextResponse.json({
      vendorId,
      selections: grouped,
      filterValueIds: selections.map((s) => s.filterValueId),
    });
  } catch {
    return NextResponse.json({ vendorId: "", selections: {}, filterValueIds: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth: must be signed in ──
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();

    let userId: string | null = null;
    if (!userErr && user) {
      userId = user.id;
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id ?? null;
    }

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { vendorId, filterValueIds } = await req.json() as {
      vendorId: string;
      filterValueIds: string[];
    };

    if (!vendorId) {
      return NextResponse.json({ error: "vendorId required" }, { status: 400 });
    }
    if (!Array.isArray(filterValueIds)) {
      return NextResponse.json({ error: "filterValueIds must be an array" }, { status: 400 });
    }

    // ── Ownership: vendor must belong to the authenticated user ──
    const vendor = await db.vendor.findFirst({
      where: { id: vendorId, owner_user_id: userId },
      select: { id: true, category: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // ── Category-membership validation ──
    // Every submitted filterValueId must belong to a FilterGroup that is
    // assigned to the vendor's category via CategoryFilter. This prevents
    // a baker from submitting DJ "Music Genre" filter values.
    if (filterValueIds.length > 0) {
      // Fetch all CategoryFilter entries for this vendor's category
      const categoryFilters = await db.categoryFilter.findMany({
        where: { categoryId: vendor.category },
        select: { filterGroupId: true },
      });
      const validGroupIds = new Set(categoryFilters.map((cf) => cf.filterGroupId));

      // Fetch all submitted filter values with their group IDs
      const submittedValues = await db.filterValue.findMany({
        where: { id: { in: filterValueIds } },
        select: { id: true, groupId: true },
      });

      // Validate: every submitted value's group must be assigned to the category
      const invalidValues = submittedValues.filter(
        (sv) => !validGroupIds.has(sv.groupId)
      );

      if (invalidValues.length > 0) {
        return NextResponse.json(
          {
            error: "Some filter values do not belong to your category",
            count: invalidValues.length,
          },
          { status: 400 }
        );
      }

      // Also check for submitted IDs that don't exist at all
      const foundIds = new Set(submittedValues.map((sv) => sv.id));
      const missingIds = filterValueIds.filter((id) => !foundIds.has(id));
      if (missingIds.length > 0) {
        return NextResponse.json(
          { error: "Some filter values do not exist", count: missingIds.length },
          { status: 400 }
        );
      }
    }

    // Delete existing selections
    await db.vendorFilterValue.deleteMany({
      where: { vendorId },
    });

    // Insert new selections
    if (filterValueIds.length > 0) {
      await db.vendorFilterValue.createMany({
        data: filterValueIds.map((id: string) => ({
          vendorId,
          filterValueId: id,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ success: true, count: filterValueIds.length });
  } catch (error: any) {
    console.error("[api/filters/vendor] POST failed:", error.message);
    return NextResponse.json({ error: "Failed to save filters" }, { status: 500 });
  }
}
