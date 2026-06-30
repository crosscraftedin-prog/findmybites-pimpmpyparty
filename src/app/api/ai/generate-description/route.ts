import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

/**
 * POST /api/ai/generate-description
 * Generates a professional description + tagline using ZAI (GLM).
 * Body: { vendorName, category, subcategory, city }
 */

async function getZAI(): Promise<ZAI | null> {
  if (process.env.ZAI_BASE_URL && process.env.ZAI_API_KEY) {
    try {
      return new ZAI({
        baseUrl: process.env.ZAI_BASE_URL,
        apiKey: process.env.ZAI_API_KEY,
        chatId: process.env.ZAI_CHAT_ID || "",
        userId: process.env.ZAI_USER_ID || "",
        token: process.env.ZAI_TOKEN || "",
      });
    } catch {}
  }
  try { return await ZAI.create(); } catch {}
  try {
    return new ZAI({
      baseUrl: "https://internal-api.z.ai/v1",
      apiKey: "Z.ai",
      chatId: "chat-abfc6c53-34e7-4366-8ebf-20056202a2a5",
      userId: "7f41fa8b-e389-4d61-88c4-80ce37217dd5",
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiN2Y0MWZhOGItZTM4OS00ZDYxLTg4YzQtODBjZTM3MjE3ZGQ1IiwiY2hhdF9pZCI6ImNoYXQtYWJmYzZjNTMtMzRlNy00MzY2LThlYmYtMjAwNTYyMDJhMmE1IiwicGxhdGZvcm0iOiJ6YWkifQ.MK2PmNvZ4pY4S8YD_x-MVfILeLSd50SEpz8JRfju7vo",
    });
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const { vendorName, category, subcategory, city } = await req.json();
    if (!vendorName || !category) {
      return NextResponse.json({ error: "vendorName and category required" }, { status: 400 });
    }

    const zai = await getZAI();
    if (!zai) {
      return NextResponse.json({
        tagline: `${category} in ${city || "your city"}`,
        description: `${vendorName} is a professional ${category.toLowerCase()}${subcategory ? ` specializing in ${subcategory.toLowerCase()}` : ""}${city ? ` based in ${city}` : ""}. We deliver quality service with attention to detail and customer satisfaction. Book directly — no commission, direct contact.`,
        fallback: true,
      });
    }

    const prompt = `Generate a professional vendor profile. Return ONLY valid JSON (no markdown).
Business: ${vendorName}
Category: ${category}
Subcategory: ${subcategory || "N/A"}
City: ${city || "N/A"}

Return: {"tagline":"One catchy line (max 60 chars)","description":"Professional description (80-120 words)"}`;

    const completion = await zai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      thinking: { type: "disabled" },
    });

    const text = completion.choices[0]?.message?.content || "";
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ tagline: parsed.tagline || "", description: parsed.description || "" });
      }
    } catch {}

    return NextResponse.json({
      tagline: `${category} in ${city || "your city"}`,
      description: text.slice(0, 500),
    });
  } catch (error: any) {
    console.error("[ai/generate-description] Error:", error.message);
    return NextResponse.json({ error: "Failed to generate description" }, { status: 500 });
  }
}
