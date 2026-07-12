import { NextRequest, NextResponse } from "next/server";
import { findDuplicateListings } from "@/lib/admin/admin-listing-service";

/**
 * POST /api/vendors/check-duplicate — check if a business already exists.
 *
 * Used during vendor self-registration to prevent duplicate listings.
 * If a match is found, the UI should show "This business already exists.
 * Would you like to claim it?" instead of creating a new listing.
 *
 * Body: { phone?, email?, name? }
 * Returns: { duplicates: DuplicateMatch[] }
 *
 * Public (no auth) — called before registration to guide the user.
 */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const duplicates = await findDuplicateListings({
      phone: body.phone,
      email: body.email,
      name: body.name,
    });

    return NextResponse.json({ duplicates });
  } catch (error: any) {
    console.error("[api/vendors/check-duplicate] failed:", error);
    return NextResponse.json({ duplicates: [] });
  }
}
