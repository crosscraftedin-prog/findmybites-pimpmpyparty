import { NextRequest, NextResponse } from "next/server";
import { compareQuotes } from "@/lib/quotes/quote-comparison";
import { logger } from "@/lib/logger";

/**
 * GET /api/quotes/compare?bookingId=xxx
 *
 * AI Quote Comparison — Josh compares all quotes for a booking and explains
 * the tradeoffs in plain English.
 *
 * Returns:
 *   - quotes[]: all quotes with vendor data (rating, verified, premium)
 *   - analysis: bestValue, highestRated, fastestResponder, mostPremium
 *   - aiSummary: 2-3 sentence natural language summary
 *   - recommendations: actionable bullet points
 *
 * This enables the V8 vision: "Customer never compares quotes manually."
 */

export async function GET(req: NextRequest) {
  try {
    const bookingId = req.nextUrl.searchParams.get("bookingId");
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId required" }, { status: 400 });
    }

    const comparison = await compareQuotes(bookingId);

    if (!comparison) {
      return NextResponse.json({ error: "Failed to compare quotes" }, { status: 500 });
    }

    return NextResponse.json(comparison);
  } catch (error: any) {
    logger.error("quote-compare-api", "GET failed", error, { message: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
