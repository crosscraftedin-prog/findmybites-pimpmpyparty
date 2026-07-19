import { NextRequest, NextResponse } from "next/server";
import { recommendVendorsForEvent } from "@/lib/events/event-intelligence";
import { logger } from "@/lib/logger";

/**
 * GET /api/events/recommend-vendors?eventId=xxx&city=xxx
 *
 * Uses the Lead Routing engine to find the best-matched vendors
 * for each UNASSIGNED vendor category in an event.
 *
 * Example: If the event needs a cake vendor and a decorator, and neither
 * is assigned yet, this endpoint returns the top 3 vendors for each category.
 */

export async function GET(req: NextRequest) {
  try {
    const eventId = req.nextUrl.searchParams.get("eventId");
    const city = req.nextUrl.searchParams.get("city") || "";

    if (!eventId) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }

    const recommendations = await recommendVendorsForEvent(eventId, city);

    logger.info("event-recommend", "Vendor recommendations generated", {
      eventId,
      categories: recommendations.length,
      totalVendors: recommendations.reduce((sum, r) => sum + r.matches.length, 0),
    });

    return NextResponse.json({
      recommendations,
      totalCategories: recommendations.length,
    });
  } catch (error: any) {
    logger.error("event-recommend", "GET failed", error, { message: error.message });
    return NextResponse.json(
      { error: `Failed to recommend vendors: ${error.message}` },
      { status: 500 }
    );
  }
}
