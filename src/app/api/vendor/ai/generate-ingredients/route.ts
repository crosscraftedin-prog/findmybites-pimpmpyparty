import { NextRequest, NextResponse } from "next/server";
import { callZAIChat } from "@/lib/zai-server";
import { sanitizePrompt } from "@/lib/ai/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/vendor/ai/generate-ingredients
 *
 * Generates ingredient suggestions (or other rich-text fields) from the
 * product context using ZAI (GLM).
 *
 * Body: { productName, productDescription?, field, category?, template?, productType? }
 * Returns: { ingredients: string }
 *
 * The frontend handles replace-vs-append logic (this endpoint only generates).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // V27: Require authentication — this route incurs AI costs
  const supabase = await createSupabaseServerClient();
  let userId: string | null = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch {}
  if (!userId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) userId = session.user.id;
    } catch {}
  }
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { productName, productDescription, field, category, template, productType } = body as {
      productName?: string;
      productDescription?: string;
      field?: string;
      category?: string;
      template?: string;
      productType?: string;
    };

    if (!productName?.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    // ── Prompt injection protection ──
    const userInput = [productName, productDescription || "", field || "", category || "", template || "", productType || ""].join("\n");
    const sanitizeResult = sanitizePrompt(userInput);
    if (sanitizeResult.blocked) {
      return NextResponse.json({ error: "Input rejected by security filter" }, { status: 400 });
    }

    const targetField = field || "ingredients";
    const label =
      targetField === "ingredients" ? "ingredients" :
      targetField === "storageInstructions" ? "storage instructions" :
      targetField;

    const contextParts = [
      `Product Name: ${productName.trim()}`,
      productDescription?.trim() ? `Description: ${productDescription.trim()}` : "",
      category ? `Category: ${category}` : "",
      template ? `Template: ${template}` : "",
      productType ? `Product Type: ${productType}` : "",
    ].filter(Boolean).join("\n");

    const prompt = `You are a professional food consultant. Based on the following product, suggest the ${label}.

${contextParts}

Generate a realistic ${label} list for this product. Use common, recognizable ingredient names.
${targetField === "ingredients" ? "Format: comma-separated list of ingredients (e.g. Refined Wheat Flour, Butter, Sugar, Eggs, Cocoa Powder, Vanilla Extract, Baking Powder). Do not include quantities. Do not include any preamble or explanation." : ""}
${targetField === "storageInstructions" ? "Format: 1-3 short sentences with storage instructions (e.g. Store refrigerated. Bring to room temperature for 30 minutes before serving.). Do not include any preamble." : ""}

Respond with ONLY the ${label}, nothing else.`;

    const messages = [
      { role: "system", content: "You are a helpful food consultant. Respond concisely and accurately." },
      { role: "user", content: prompt },
    ];

    const response = await callZAIChat(messages, 20_000);
    if (!response || !response.choices?.[0]?.message?.content) {
      return NextResponse.json({ error: "AI generation failed — no response" }, { status: 500 });
    }

    const generated = response.choices[0].message.content.trim();
    return NextResponse.json({ ingredients: generated });
  } catch (error: any) {
    console.error("[generate-ingredients] failed:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to generate ingredients" },
      { status: 500 }
    );
  }
}
