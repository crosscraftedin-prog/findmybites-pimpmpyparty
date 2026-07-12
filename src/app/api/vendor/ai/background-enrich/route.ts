import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { callZAI } from "@/lib/zai-server";

/**
 * POST /api/vendor/ai/background-enrich
 * ─────────────────────────────────────────────────────────────────────────
 * Called fire-and-forget immediately after a vendor publishes their listing.
 * Generates AI content (description, tagline, SEO, tags) and updates the
 * listing directly. The vendor never waits — their listing is already live.
 *
 * Requires authentication (the vendor who just published).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // Auth — must be the vendor owner
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Auth required" }, { status: 401 });
    }

    const body = await req.json();
    const { vendorId, businessName, ecosystem, category, city, country, description } = body;

    if (!vendorId || !description) {
      return NextResponse.json({ error: "vendorId and description required" }, { status: 400 });
    }

    // Verify ownership
    const vendor = await db.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, owner_user_id: true },
    });
    if (!vendor || vendor.owner_user_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // ── Generate AI content ──
    const prompt = `You are a marketing expert for a ${ecosystem === "FINDMYBITES" ? "food" : "party"} business marketplace.
Generate a polished business profile for:

Business: ${businessName}
Category: ${category}
City: ${city}, ${country || ""}
Vendor's description: "${description}"

Return JSON with these exact fields:
{
  "tagline": "A catchy one-line tagline (max 60 chars)",
  "description": "A professional 2-3 sentence business description (max 300 chars)",
  "seoTitle": "SEO-optimized page title (max 60 chars)",
  "seoDescription": "Meta description for search engines (max 160 chars)",
  "tags": ["relevant", "search", "tags", "max 8"],
  "specialties": ["what they specialize in"]
}

Only return valid JSON, no markdown.`;

    let aiData: any = null;
    try {
      const aiResponse = await callZAI(prompt);
      if (!aiResponse) throw new Error("AI returned null");
      // Parse the JSON response
      const cleaned = aiResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
      aiData = JSON.parse(cleaned);
    } catch (aiErr) {
      console.error("[background-enrich] AI generation failed (non-fatal):", aiErr);
      return NextResponse.json({ success: false, reason: "AI generation failed" });
    }

    // ── Store AI suggestions (NEVER overwrite vendor's content) ──
    // AI generates suggestions that the vendor can choose to apply later:
    // "Use AI Version" / "Merge With Mine" / "Keep Original"
    // The vendor's own description/tagline/SEO remain the source of truth.
    const suggestions = {
      tagline: aiData.tagline || null,
      description: aiData.description || null,
      seoTitle: aiData.seoTitle || null,
      seoDescription: aiData.seoDescription || null,
      tags: Array.isArray(aiData.tags) ? aiData.tags : [],
      specialties: Array.isArray(aiData.specialties) ? aiData.specialties : [],
      suggestedSubcategory: aiData.suggestedSubcategory || null,
      dietaryAttributes: Array.isArray(aiData.dietaryAttributes) ? aiData.dietaryAttributes : [],
      keywords: Array.isArray(aiData.keywords) ? aiData.keywords : [],
      generatedAt: new Date().toISOString(),
    };

    // Store suggestions in the vendor's extraFields or a dedicated column.
    // We use a raw SQL approach since aiSuggestions column may not exist yet.
    try {
      await (db as any).$executeRaw`
        UPDATE vendor_listings SET
          "aiSuggestions" = ${JSON.stringify(suggestions)}::text
        WHERE id = ${vendorId}
      `;
    } catch {
      // Column doesn't exist — try adding it first
      try {
        await (db as any).$executeRaw`ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "aiSuggestions" TEXT`;
        await (db as any).$executeRaw`
          UPDATE vendor_listings SET
            "aiSuggestions" = ${JSON.stringify(suggestions)}::text
          WHERE id = ${vendorId}
        `;
      } catch (alterErr) {
        console.error("[background-enrich] could not store suggestions (non-fatal):", alterErr);
      }
    }

    return NextResponse.json({ success: true, stored: "suggestions" });
  } catch (error: any) {
    console.error("[background-enrich] failed:", error);
    return NextResponse.json({ error: "Background enrichment failed" }, { status: 500 });
  }
}
