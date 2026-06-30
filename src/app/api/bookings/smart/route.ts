import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getZAI } from "@/lib/zai-server";

/**
 * POST /api/bookings/smart
 *
 * Creates a smart enquiry/booking with:
 *   - All standard fields (name, email, phone, event date/time, guests, budget, address)
 *   - AI-generated lead summary
 *   - AI lead quality score (0-100)
 *   - Optional pre-qualification answers
 *
 * No auth required — customers submit enquiries anonymously.
 * Returns the created booking with AI summary + score.
 */

interface SmartEnquiryBody {
  vendorId: string;
  productId?: string;
  name: string;
  email: string;
  phone?: string;
  eventType: string;
  eventDate: string;
  eventTime?: string;
  eventCity: string;
  guests: number;
  budget: string;
  address?: string;
  message?: string;
  notes?: string;
  referenceImage?: string;
  preferredContact?: string;
  aiQualification?: Record<string, string>;
}

/**
 * Generate an AI lead summary from the enquiry data.
 * Example: "Wedding Cake · 150 guests · Chocolate · ₹15,000 · Delivery required · 15 Dec"
 */
function generateTemplateSummary(body: SmartEnquiryBody): string {
  const parts: string[] = [];
  parts.push(body.eventType || "Enquiry");
  if (body.guests > 0) parts.push(`${body.guests} guests`);
  if (body.budget) parts.push(body.budget);
  if (body.address) parts.push("Delivery required");
  if (body.eventDate) {
    const d = new Date(body.eventDate);
    parts.push(d.toLocaleDateString("en-US", { day: "numeric", month: "short" }));
  }
  return parts.join(" · ");
}

/**
 * Calculate a lead quality score (0-100) based on:
 *   - Budget clarity (has budget = +20)
 *   - Date set (has date = +20)
 *   - Information completeness (phone, address, notes = +15 each)
 *   - Guest count (has guests = +10)
 *   - Pre-qualification answers (each = +5, max 20)
 */
function calculateLeadScore(body: SmartEnquiryBody): number {
  let score = 0;
  if (body.budget && body.budget !== "Not specified") score += 20;
  if (body.eventDate) score += 20;
  if (body.phone) score += 15;
  if (body.address) score += 10;
  if (body.notes) score += 5;
  if (body.guests > 0) score += 10;
  if (body.preferredContact) score += 5;
  if (body.aiQualification) {
    const qualCount = Object.values(body.aiQualification).filter((v) => v && v.trim()).length;
    score += Math.min(qualCount * 5, 20);
  }
  return Math.min(score, 100);
}

/**
 * Use AI to generate a natural language lead summary.
 * Falls back to template if AI unavailable.
 */
async function generateAISummary(body: SmartEnquiryBody): Promise<{ summary: string; source: "ai" | "template" }> {
  const template = generateTemplateSummary(body);

  const zai = await getZAI();
  if (!zai) {
    return { summary: template, source: "template" };
  }

  try {
    const qualText = body.aiQualification
      ? Object.entries(body.aiQualification).map(([k, v]) => `${k}: ${v}`).join(", ")
      : "";

    const prompt = `Summarize this event enquiry in ONE concise line (max 80 chars). Format: "Type · key details · budget · date"

Enquiry details:
- Event type: ${body.eventType}
- Guests: ${body.guests}
- Budget: ${body.budget}
- Date: ${body.eventDate}
- City: ${body.eventCity}
- Delivery: ${body.address ? "Yes" : "No"}
- Notes: ${body.notes || body.message || "None"}
- Pre-qualification: ${qualText || "None"}

Return ONLY the summary line, nothing else.`;

    const completion = await zai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 60,
    });
    const aiSummary = completion.choices[0]?.message?.content?.trim() || template;
    return { summary: aiSummary.slice(0, 120), source: "ai" };
  } catch {
    return { summary: template, source: "template" };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SmartEnquiryBody;

    // Validate required fields
    if (!body.vendorId || !body.name || !body.email || !body.eventType || !body.eventDate) {
      return NextResponse.json(
        { error: "Missing required fields: vendorId, name, email, eventType, eventDate" },
        { status: 400 }
      );
    }

    // Generate AI summary + lead score
    const { summary, source } = await generateAISummary(body);
    const leadScore = calculateLeadScore(body);

    const booking = await db.booking.create({
      data: {
        vendorId: body.vendorId,
        name: body.name.trim(),
        email: body.email.trim(),
        phone: body.phone || null,
        eventType: body.eventType,
        eventDate: body.eventDate,
        eventTime: body.eventTime || null,
        eventCity: body.eventCity,
        guests: body.guests || 0,
        budget: body.budget || "Not specified",
        message: body.message || body.notes || "",
        address: body.address || null,
        notes: body.notes || null,
        referenceImage: body.referenceImage || null,
        preferredContact: body.preferredContact || null,
        productId: body.productId || null,
        aiSummary: summary,
        leadScore,
        aiQualification: body.aiQualification ? JSON.stringify(body.aiQualification) : null,
        status: "new",
      },
    });

    return NextResponse.json({
      booking,
      aiSummary: summary,
      leadScore,
      aiSource: source,
    }, { status: 201 });
  } catch (err) {
    console.error("[api/bookings/smart] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to create enquiry" },
      { status: 500 }
    );
  }
}
