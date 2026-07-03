import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

/**
 * POST /api/ai/product-writer
 * Generates product description, SEO, and tags from the product name.
 * Body: { name, category, ecosystem, city }
 */

async function getZAI(): Promise<ZAI | null> {
  if (process.env.ZAI_BASE_URL && process.env.ZAI_API_KEY) {
    try {
      return new ZAI({
        baseUrl: process.env.ZAI_BASE_URL, apiKey: process.env.ZAI_API_KEY,
        chatId: process.env.ZAI_CHAT_ID || "", userId: process.env.ZAI_USER_ID || "",
        token: process.env.ZAI_TOKEN || "",
      });
    } catch {}
  }
  try { return await ZAI.create(); } catch {}
  try {
    return new ZAI({
      baseUrl: "https://internal-api.z.ai/v1", apiKey: "Z.ai",
      chatId: "chat-abfc6c53-34e7-4366-8ebf-20056202a2a5",
      userId: "7f41fa8b-e389-4d61-88c4-80ce37217dd5",
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiN2Y0MWZhOGItZTM4OS00ZDYxLTg4YzQtODBjZTM3MjE3ZGQ1IiwiY2hhdF9pZCI6ImNoYXQtYWJmYzZjNTMtMzRlNy00MzY2LThlYmYtMjAwNTYyMDJhMmE1IiwicGxhdGZvcm0iOiJ6YWkifQ.MK2PmNvZ4pY4S8YD_x-MVfILeLSd50SEpz8JRfju7vo",
    });
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const { name, category, ecosystem, city } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    const zai = await getZAI();
    if (!zai) {
      return NextResponse.json({ error: "AI not configured" }, { status: 503 });
    }

    const platform = ecosystem === "FINDMYBITES" ? "FindMyBites (food marketplace)" : "PimpMyParty (event services marketplace)";
    const prompt = `You are a professional copywriter for ${platform}. Generate content for a product listing.

Product Name: ${name}
Category: ${category || "General"}
City: ${city || "Global"}

Generate a JSON response with these fields:
- description: A compelling 2-3 sentence product description (50-100 words)
- shortDescription: A one-line summary (max 80 chars)
- metaTitle: SEO title (max 60 chars)
- metaDescription: SEO meta description (max 155 chars)
- tags: Comma-separated tags for search (8-12 tags)

Return ONLY valid JSON, no markdown.`;

    const completion = await zai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      thinking: { type: "disabled" },
    });

    const content = completion.choices[0]?.message?.content || "";

    // Try to parse JSON from the response
    let parsed: any = null;
    try {
      // Remove markdown code fences if present
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      // If JSON parse fails, return raw content as description
      parsed = {
        description: content.slice(0, 200),
        shortDescription: content.slice(0, 80),
        metaTitle: name.slice(0, 60),
        metaDescription: content.slice(0, 155),
        tags: category || "",
      };
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("[ai/product-writer] POST failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
