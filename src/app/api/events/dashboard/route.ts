import { NextRequest, NextResponse } from "next/server";
import { getEventIntelligence } from "@/lib/events/event-intelligence";
import { logger } from "@/lib/logger";

/**
 * GET /api/events/dashboard?eventId=xxx
 *
 * Returns the complete Event Intelligence for a customer's event:
 *   - Budget allocation (min/recommended/premium per category)
 *   - Timeline (tasks with days-before-event)
 *   - Vendor checklist (which vendors needed, which assigned)
 *   - Cross-sell suggestions
 *   - Countdown (days until event + current phase)
 *
 * This is the V6 "AI Event Operating System" dashboard endpoint.
 * It extends the existing ConciergeEvent model — no new tables needed.
 */

export async function GET(req: NextRequest) {
  try {
    const eventId = req.nextUrl.searchParams.get("eventId");
    if (!eventId) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }

    const intelligence = await getEventIntelligence(eventId);

    if (!intelligence) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    logger.info("event-dashboard", "Dashboard generated", {
      eventId,
      budgetItems: intelligence.budget.length,
      timelineTasks: intelligence.timeline.length,
      vendorChecklist: intelligence.vendorChecklist.length,
      daysUntil: intelligence.countdown.daysUntilEvent,
    });

    return NextResponse.json(intelligence);
  } catch (error: any) {
    logger.error("event-dashboard", "GET failed", error, { message: error.message });
    return NextResponse.json(
      { error: `Failed to generate event dashboard: ${error.message}` },
      { status: 500 }
    );
  }
}
