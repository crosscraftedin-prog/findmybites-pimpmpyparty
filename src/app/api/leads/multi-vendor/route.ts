import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { findBestVendors } from "@/lib/leads/lead-routing";
import { logger } from "@/lib/logger";

/**
 * POST /api/leads/multi-vendor
 *
 * Multi-Vendor Enquiry — the V5 "Lead Intelligence Platform" feature.
 *
 * When a customer wants quotes from multiple vendors, this endpoint:
 *   1. Uses the Smart Lead Routing Engine to find the best-matched vendors
 *   2. Creates a CRM lead for EACH matched vendor (same enquiry, multiple vendors)
 *   3. Returns the matched vendors + lead IDs
 *
 * The customer's enquiry is captured FIRST (lead-first architecture).
 * No WhatsApp or direct contact happens until leads are in the CRM.
 *
 * Body: {
 *   name, email, phone, eventType, eventDate, eventCity,
 *   guests, budget, message, category, topN (3/5/10)
 * }
 *
 * Response: {
 *   leads: [{ vendorId, vendorName, leadId, matchScore, matchReasons }],
 *   totalVendorsContacted: number
 * }
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, email, phone, eventType, eventDate, eventCity,
      guests = 0, budget = "Not specified", message,
      category, topN = 5,
    } = body;

    // ── Validate required fields ──
    if (!name?.trim() || !email?.trim() || !eventType) {
      return NextResponse.json(
        { error: "name, email, and eventType are required" },
        { status: 400 }
      );
    }

    // ── 1. Find best-matched vendors using the routing engine ──
    const matches = await findBestVendors(
      { category, city: eventCity, budget, eventDate, guests },
      Math.min(topN, 10) // cap at 10
    );

    if (matches.length === 0) {
      return NextResponse.json({
        leads: [],
        totalVendorsContacted: 0,
        message: "No vendors found matching your requirements. Try a different city or category.",
      });
    }

    // ── 2. Create a CRM lead for each matched vendor ──
    const leads: any[] = [];

    for (const match of matches) {
      try {
        const lead = await db.booking.create({
          data: {
            vendorId: match.vendorId,
            name: name.trim(),
            email: email.trim(),
            phone: phone || null,
            eventType,
            eventDate: eventDate || new Date().toISOString().split("T")[0],
            eventCity: eventCity || match.city,
            guests: Number(guests) || 0,
            budget,
            message: message || `Multi-vendor enquiry for ${eventType}`,
            status: "pending",
            // Store the match score for analytics
            leadScore: match.matchScore,
            aiSummary: `Multi-vendor enquiry — matched at ${match.matchScore}/100. Reasons: ${match.matchReasons.join(", ")}`,
          },
        });

        leads.push({
          vendorId: match.vendorId,
          vendorName: match.vendorName,
          vendorSlug: match.slug,
          leadId: lead.id,
          matchScore: match.matchScore,
          matchReasons: match.matchReasons,
          rating: match.rating,
          verified: match.verified,
          featured: match.featured,
        });
      } catch (err: any) {
        logger.error("multi-vendor", `Failed to create lead for vendor ${match.vendorId}`, err);
        // Continue with other vendors even if one fails
      }
    }

    logger.info("multi-vendor", "Multi-vendor enquiry created", {
      customer: email,
      eventType,
      category,
      city: eventCity,
      vendorsContacted: leads.length,
      topMatchScore: matches[0]?.matchScore || 0,
    });

    return NextResponse.json({
      leads,
      totalVendorsContacted: leads.length,
      message: `Your enquiry has been sent to ${leads.length} vendor${leads.length === 1 ? "" : "s"}. They will respond shortly.`,
    });
  } catch (error: any) {
    logger.error("multi-vendor", "POST failed", error, { message: error.message });
    return NextResponse.json(
      { error: `Failed to create multi-vendor enquiry: ${error.message}` },
      { status: 500 }
    );
  }
}
