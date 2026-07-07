/**
 * POST /api/ai/product-writer (Edge Function)
 *
 * Generates product description, SEO, and tags from the product name.
 * Body: { name, category, ecosystem, city }
 *
 * EDGE FUNCTION: Runs on Vercel's global edge network (including Hong Kong)
 * instead of a single US East region. This is required because the ZAI API
 * (internal-api.z.ai) is hosted on Alibaba Cloud Hong Kong and is unreachable
 * from Vercel's US East serverless functions.
 *
 * Edge Functions use the browser's fetch() (V8 runtime) which doesn't have
 * Node.js undici's 10s connect timeout limitation.
 */

export const runtime = "edge";

const ZAI_CONFIG = {
  baseUrl: process.env.ZAI_BASE_URL || "https://internal-api.z.ai/v1",
  apiKey: process.env.ZAI_API_KEY || "Z.ai",
  chatId: process.env.ZAI_CHAT_ID || "chat-abfc6c53-34e7-4366-8ebf-20056202a2a5",
  userId: process.env.ZAI_USER_ID || "7f41fa8b-e389-4d61-88c4-80ce37217dd5",
  token: process.env.ZAI_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiN2Y0MWZhOGItZTM4OS00ZDYxLTg4YzQtODBjZTM3MjE3ZGQ1IiwiY2hhdF9pZCI6ImNoYXQtYWJmYzZjNTMtMzRlNy00MzY2LThlYmYtMjAwNTYyMDJhMmE1IiwicGxhdGZvcm0iOiJ6YWkifQ.MK2PmNvZ4pY4S8YD_x-MVfILeLSd50SEpz8JRfju7vo",
};

// ── Inline prompt injection check (can't import from lib in Edge runtime) ──
const INJECTION_PATTERNS = [
  /ignore\s+(previous|prior|above|all)\s+instructions/i,
  /reveal\s+(system\s+)?prompt/i,
  /act\s+as\s+(developer|admin|root|system)/i,
  /jailbreak/i,
  /prompt\s+injection/i,
  /developer\s+mode/i,
];

function sanitizePrompt(input: string): { blocked: boolean; sanitized: string } {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) return { blocked: true, sanitized: "" };
  }
  return { blocked: false, sanitized: input.trim() };
}

export async function POST(req: Request) {
  const ts = () => new Date().toISOString();
  console.log(`[PRODUCT-WRITER] ${ts()} POST (edge) — ENTER`);

  try {
    const { name, category, ecosystem, city } = await req.json();
    console.log(`[PRODUCT-WRITER] ${ts()} Request: name="${name}"`);

    if (!name?.trim()) {
      return Response.json({ error: "Product name is required" }, { status: 400 });
    }

    // ── Prompt injection check ──
    const userInput = [name, category || "", city || ""].join("\n");
    const sanitizeResult = sanitizePrompt(userInput);
    if (sanitizeResult.blocked) {
      return Response.json({ error: "Input rejected by security filter" }, { status: 400 });
    }
    const safeName = name;
    const safeCategory = (category || "").trim();
    const safeCity = (city || "").trim();

    const platform = ecosystem === "FINDMYBITES" ? "FindMyBites (food marketplace)" : "PimpMyParty (event services marketplace)";
    const prompt = `You are a professional copywriter for ${platform}. Generate content for a product listing.

Product Name: ${safeName}
Category: ${safeCategory || "General"}
City: ${safeCity || "Global"}

Generate a JSON response with these fields:
- description: A compelling 2-3 sentence product description (50-100 words)
- shortDescription: A one-line summary (max 80 chars)
- metaTitle: SEO title (max 60 chars)
- metaDescription: SEO meta description (max 155 chars)
- tags: Comma-separated tags for search (8-12 tags)

Return ONLY valid JSON, no markdown.`;

    // ── Call ZAI API directly via fetch (Edge runtime) ──
    const zaiUrl = `${ZAI_CONFIG.baseUrl}/chat/completions`;
    const zaiHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ZAI_CONFIG.apiKey}`,
      "X-Z-AI-From": "Z",
    };
    if (ZAI_CONFIG.chatId) zaiHeaders["X-Chat-Id"] = ZAI_CONFIG.chatId;
    if (ZAI_CONFIG.userId) zaiHeaders["X-User-Id"] = ZAI_CONFIG.userId;
    if (ZAI_CONFIG.token) zaiHeaders["X-Token"] = ZAI_CONFIG.token;

    console.log(`[PRODUCT-WRITER] ${ts()} Calling ZAI API (edge fetch)...`);
    const llmStart = Date.now();

    const zaiResponse = await fetch(zaiUrl, {
      method: "POST",
      headers: zaiHeaders,
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        thinking: { type: "disabled" },
      }),
    });

    const llmEnd = Date.now();
    console.log(`[PRODUCT-WRITER] ${ts()} ZAI response: ${zaiResponse.status} (${llmEnd - llmStart}ms)`);

    if (!zaiResponse.ok) {
      const errorText = await zaiResponse.text().catch(() => "");
      console.error(`[PRODUCT-WRITER] ${ts()} ❌ ZAI API error ${zaiResponse.status}: ${errorText.slice(0, 200)}`);
      return Response.json(
        { error: "AI service is temporarily unavailable. Please try again in a moment." },
        { status: 503 }
      );
    }

    const zaiData = await zaiResponse.json();
    const content = zaiData.choices?.[0]?.message?.content || "";
    console.log(`[PRODUCT-WRITER] ${ts()} Content received: ${content.length} chars`);

    if (!content) {
      return Response.json(
        { error: "AI returned empty response. Please try again." },
        { status: 502 }
      );
    }

    // Parse JSON from response
    let parsed: any = null;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
      console.log(`[PRODUCT-WRITER] ${ts()} ✅ JSON parsed`);
    } catch {
      console.log(`[PRODUCT-WRITER] ${ts()} ⚠️ JSON parse failed — using raw content`);
      parsed = {
        description: content.slice(0, 200),
        shortDescription: content.slice(0, 80),
        metaTitle: safeName.slice(0, 60),
        metaDescription: content.slice(0, 155),
        tags: safeCategory || "",
      };
    }

    console.log(`[PRODUCT-WRITER] ${ts()} ✅ 200 — returning content`);
    return Response.json(parsed);
  } catch (error: any) {
    console.error(`[PRODUCT-WRITER] ${ts()} ❌ EXCEPTION: ${error?.message}`);
    return Response.json(
      { error: "AI service is temporarily unavailable. Please try again in a moment." },
      { status: 500 }
    );
  }
}
