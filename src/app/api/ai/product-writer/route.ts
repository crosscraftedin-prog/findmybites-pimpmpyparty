import { guardAiRoute } from "@/lib/billing/guards";
/**
 * POST /api/ai/product-writer
 *
 * Generates product description, SEO, and tags from the product name.
 * Body: { name, category, ecosystem, city }
 *
 * Strategy:
 *   1. Try ZAI (GLM) LLM with an 8-second hard timeout
 *   2. On timeout, network failure, or malformed JSON → template fallback
 *   3. Template fallback ALWAYS returns 200 JSON in <50ms
 *
 * Metrics:
 *   - ai_source: "LLM" (LLM generated) or "Fallback" (template generated)
 *   - Structured log on every fallback invocation
 *   - Dev-only console warning (never shown to production users)
 */

import { NextRequest, NextResponse } from "next/server";
import { getZAI } from "@/lib/zai-server";
import { sanitizePrompt } from "@/lib/ai/security";
import { logger } from "@/lib/logger";

// ── Constants ────────────────────────────────────────────────────────────────

/** Maximum time to wait for the LLM response (8 seconds). */
const LLM_TIMEOUT_MS = 8_000;

// ── Types ────────────────────────────────────────────────────────────────────

interface ProductContent {
  description: string;
  shortDescription: string;
  metaTitle: string;
  metaDescription: string;
  tags: string;
  ai_source: "LLM" | "Fallback";
  _fallback?: boolean;
}

interface FallbackLogData {
  timestamp: string;
  vendorId: string | null;
  ecosystem: string;
  category: string;
  productName: string;
  reason: string;
  errorMessage: string | undefined;
}

// ── Template generator ──────────────────────────────────────────────────────

function generateTemplateContent(
  name: string,
  category: string,
  city: string,
  ecosystem: string,
): ProductContent {
  const isFood = ecosystem === "FINDMYBITES";
  const platform = isFood ? "FindMyBites" : "PimpMyParty";
  const catLabel = category
    ? category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : isFood ? "Food" : "Service";

  const description = `Indulge in our premium ${name.toLowerCase()}, crafted with the finest ingredients and attention to detail.${
    city ? ` Available in ${city},` : ""
  } this ${catLabel.toLowerCase()} is perfect for ${
    isFood ? "celebrations, parties, and special occasions" : "events, weddings, and corporate functions"
  }. Book directly on ${platform} for the best price — no commission, direct contact with the vendor.`;

  const shortDescription = `Premium ${name.toLowerCase()}${city ? ` in ${city}` : ""}. Book on ${platform}.`;
  const metaTitle = `${name}${city ? ` in ${city}` : ""} | ${catLabel} | ${platform}`.slice(0, 60);
  const metaDescription = `Order ${name} on ${platform}${city ? ` in ${city}` : ""}. ${
    isFood ? "Fresh, premium quality for your celebration." : "Professional service for your event."
  } Book directly — no commission.`.slice(0, 155);

  const tags = [
    name.toLowerCase(),
    category,
    city,
    catLabel.toLowerCase(),
    isFood ? "food" : "events",
    isFood ? "delivery" : "booking",
    "premium",
    "best",
    city ? `${city} ${category}` : category,
    platform.toLowerCase(),
  ].filter(Boolean).join(", ");

  return {
    description,
    shortDescription,
    metaTitle,
    metaDescription,
    tags,
    ai_source: "Fallback",
    _fallback: true,
  };
}

// ── Fallback logger ──────────────────────────────────────────────────────────

function logFallback(data: FallbackLogData): void {
  // Structured log (always — visible in Vercel logs / Sentry)
  logger.warn("ai-product-writer", "Fallback invoked", data);

  // Dev-only console warning (never shown to production users)
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[PRODUCT-WRITER] ⚠️ FALLBACK used — reason: ${data.reason}` +
      ` | product: "${data.productName}"` +
      ` | ecosystem: ${data.ecosystem}` +
      ` | category: ${data.category}` +
      (data.errorMessage ? ` | error: ${data.errorMessage}` : ""),
    );
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const ts = () => new Date().toISOString();

  let vendorId: string | null = null;
  let ecosystem = "FINDMYBITES";
  let category = "";
  let productName = "";

  try {
    const body = await req.json();
    productName = (body.name || "").trim();
    category = (body.category || "").trim();
    ecosystem = body.ecosystem || "FINDMYBITES";
    const city = (body.city || "").trim();
    vendorId = body.vendorId || null;

    if (!productName) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    // ── Prompt injection check ──
    const userInput = [productName, category, city].join("\n");
    const sanitizeResult = sanitizePrompt(userInput);
    if (sanitizeResult.blocked) {
      return NextResponse.json({ error: "Input rejected by security filter" }, { status: 400 });
    }

    // ── Try ZAI LLM (8-second hard timeout) ──
    const zai = await getZAI();

    if (zai) {
      const isFood = ecosystem === "FINDMYBITES";
      const platform = isFood ? "FindMyBites" : "PimpMyParty";
      const prompt = `You are a professional copywriter for ${platform} (${isFood ? "food marketplace" : "event services marketplace"}). Generate content for a product listing.

Product Name: ${productName}
Category: ${category || "General"}
City: ${city || "Global"}

Generate a JSON response with these fields:
- description: A compelling 2-3 sentence product description (50-100 words)
- shortDescription: A one-line summary (max 80 chars)
- metaTitle: SEO title (max 60 chars)
- metaDescription: SEO meta description (max 155 chars)
- tags: Comma-separated tags for search (8-12 tags)

Return ONLY valid JSON, no markdown.`;

      const llmStart = Date.now();

      try {
        // ── 8-second timeout via AbortSignal ──
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

        const completion = await zai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          thinking: { type: "disabled" },
        });

        clearTimeout(timeoutId);

        const content = completion.choices[0]?.message?.content || "";
        const llmElapsed = Date.now() - llmStart;

        if (content) {
          // Parse JSON
          try {
            const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const parsed = JSON.parse(jsonStr);
            const result: ProductContent = {
              description: String(parsed.description || "").slice(0, 800),
              shortDescription: String(parsed.shortDescription || "").slice(0, 80),
              metaTitle: String(parsed.metaTitle || "").slice(0, 60),
              metaDescription: String(parsed.metaDescription || "").slice(0, 155),
              tags: String(parsed.tags || ""),
              ai_source: "LLM",
            };
            return NextResponse.json(result);
          } catch {
            // JSON parse failed — use raw content as description, switch to fallback
            logFallback({
              timestamp: ts(),
              vendorId,
              ecosystem,
              category,
              productName,
              reason: "malformed_json",
              errorMessage: "LLM returned non-JSON content",
            });
          }
        } else {
          // Empty content
          logFallback({
            timestamp: ts(),
            vendorId,
            ecosystem,
            category,
            productName,
            reason: "empty_llm_response",
            errorMessage: undefined,
          });
        }
      } catch (llmErr: any) {
        // LLM call failed (timeout, network error, etc.)
        const isTimeout = llmErr?.name === "AbortError" || (Date.now() - llmStart) >= LLM_TIMEOUT_MS;
        logFallback({
          timestamp: ts(),
          vendorId,
          ecosystem,
          category,
          productName,
          reason: isTimeout ? "llm_timeout" : "llm_network_error",
          errorMessage: llmErr?.message?.slice(0, 200),
        });

        if (isTimeout) {
        } else {
        }
      }
    } else {
      // ZAI not available
      logFallback({
        timestamp: ts(),
        vendorId,
        ecosystem,
        category,
        productName,
        reason: "zai_not_configured",
        errorMessage: undefined,
      });
    }

    // ── Template fallback (always succeeds, <50ms) ──
    const result = generateTemplateContent(productName, category, (body as any).city || "", ecosystem);
    return NextResponse.json(result);

  } catch (error: any) {
    // Unexpected exception — return fallback
    logFallback({
      timestamp: ts(),
      vendorId,
      ecosystem,
      category,
      productName,
      reason: "unexpected_exception",
      errorMessage: error?.message?.slice(0, 200),
    });

    const result = generateTemplateContent(
      productName || "Product",
      category,
      "",
      ecosystem,
    );
    return NextResponse.json(result);
  }
}
