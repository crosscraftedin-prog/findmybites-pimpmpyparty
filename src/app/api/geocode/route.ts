import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/geocode";

/**
 * GET /api/geocode?address=...
 * Geocodes a free-text address into lat/lng. Used by the vendor form to
 * preview coordinates as the vendor types their address.
 */
export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address") ?? "";
    if (!address.trim()) {
      return NextResponse.json(
        { error: "address query parameter is required" },
        { status: 400 }
      );
    }
    const result = await geocodeAddress(address);
    if (!result) {
      return NextResponse.json(
        { error: "Could not geocode this address." },
        { status: 404 }
      );
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/geocode] GET failed:", err);
    return NextResponse.json(
      { error: "Geocoding failed." },
      { status: 500 }
    );
  }
}
