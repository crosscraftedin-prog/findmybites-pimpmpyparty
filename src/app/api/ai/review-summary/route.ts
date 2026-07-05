import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getZAI } from "@/lib/zai-server";
import { sanitizePrompt, callWithTimeout } from "@/lib/ai/security";
import { logger } from "@/lib/logger";

/**
 * GET /api/ai/review-summary?vendorId=xxx
 *
 * Generates an AI-powered structured summary of customer reviews.
 * Falls back to a keyword-based heuristic when AI is unavailable.
 *
 * Response: {
 *   loved: string[],          // themes customers love
 *   mostMentioned: string[],  // products/items mentioned most
 *   improvements: string[],   // areas for improvement
 *   source: "ai" | "template"
 * }
 */

interface ReviewRow {
  id: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

const POSITIVE_WORDS = [
  "delicious", "amazing", "perfect", "great", "excellent", "love", "loved",
  "recommend", "recommended", "best", "wonderful", "awesome", "fantastic",
  "beautiful", "fresh", "tasty", "yummy", "friendly", "professional",
  "responsive", "on time", "prompt", "creative", "moist", "flavourful",
  "flavorful", "soft", "stunning", "gorgeous", "impressed", "happy", "satisfied",
];

const NEGATIVE_WORDS = [
  "slow", "expensive", "disappointing", "issue", "bad", "terrible", "rude",
  "late", "cold", "stale", "dry", "soggy", "overpriced", "delayed", "cancelled",
  "canceled", "unresponsive", "broken", "smashed", "small", "tiny", "bland",
  "hard", "salty", "too sweet", "messy", "unprofessional",
];

const IMPROVEMENT_MAP: Record<string, string> = {
  slow: "Faster response and delivery times",
  late: "More on-time delivery",
  delayed: "More on-time delivery",
  expensive: "More affordable pricing options",
  overpriced: "More affordable pricing options",
  small: "Larger portion sizes",
  tiny: "Larger portion sizes",
  cold: "Better temperature control on delivery",
  stale: "Fresher products",
  dry: "Moister products",
  soggy: "Better packaging to prevent sogginess",
  bland: "More flavour",
  hard: "Softer texture",
  salty: "Better seasoning balance",
  "too sweet": "Less sweet options",
  unresponsive: "Faster communication",
  rude: "Friendlier customer service",
  unprofessional: "More professional service",
  disappointing: "More consistent quality",
  messy: "Cleaner presentation",
  broken: "Better packaging to prevent damage",
  smashed: "Better packaging to prevent damage",
};

const LOVED_MAP: Record<string, string> = {
  delicious: "Taste",
  tasty: "Taste",
  yummy: "Taste",
  flavourful: "Taste",
  flavorful: "Taste",
  moist: "Texture",
  soft: "Texture",
  fresh: "Freshness",
  beautiful: "Presentation",
  stunning: "Presentation",
  gorgeous: "Presentation",
  creative: "Design & Creativity",
  professional: "Professionalism",
  responsive: "Communication",
  friendly: "Customer Service",
  "on time": "On-time Delivery",
  prompt: "Prompt Service",
  amazing: "Overall Experience",
  perfect: "Overall Experience",
  excellent: "Overall Experience",
  wonderful: "Overall Experience",
  awesome: "Overall Experience",
  fantastic: "Overall Experience",
  love: "Overall Experience",
  loved: "Overall Experience",
  recommend: "Would Recommend",
  best: "Best in Class",
};

/** Run the keyword-based heuristic over the reviews. */
function buildTemplateSummary(reviews: ReviewRow[]): {
  loved: string[];
  mostMentioned: string[];
  improvements: string[];
} {
  if (reviews.length === 0) {
    return { loved: [], mostMentioned: [], improvements: [] };
  }

  const text = reviews.map((r) => r.comment).join(" ");
  const lower = text.toLowerCase();

  // ── Loved: tally positive themes ─────────────────────────────────────
  const lovedCounts: Record<string, number> = {};
  for (const word of POSITIVE_WORDS) {
    if (!LOVED_MAP[word]) continue;
    // Count occurrences (use indexOf loop for multi-word phrases)
    let count = 0;
    let idx = lower.indexOf(word);
    while (idx !== -1) {
      count++;
      idx = lower.indexOf(word, idx + word.length);
    }
    if (count > 0) {
      const theme = LOVED_MAP[word];
      lovedCounts[theme] = (lovedCounts[theme] || 0) + count;
    }
  }
  const loved = Object.entries(lovedCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);

  // ── Improvements: tally negative keywords → themes ───────────────────
  const improvementCounts: Record<string, number> = {};
  for (const word of NEGATIVE_WORDS) {
    if (!IMPROVEMENT_MAP[word]) continue;
    let count = 0;
    let idx = lower.indexOf(word);
    while (idx !== -1) {
      count++;
      idx = lower.indexOf(word, idx + word.length);
    }
    if (count > 0) {
      const theme = IMPROVEMENT_MAP[word];
      improvementCounts[theme] = (improvementCounts[theme] || 0) + count;
    }
  }
  const improvements = Object.entries(improvementCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  // ── Most mentioned: extract candidate product/item names ─────────────
  // Look for capitalised words / multi-word phrases that appear 2+ times.
  const phraseCounts: Record<string, number> = {};
  // Try common patterns: "the X cake", "X cake", "X brownie", etc.
  const foodRegex =
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s*(?:Cake|Cupcake|Brownie|Cookie|Chocolate|Bread|Dessert|Tart|Pastry|Muffin|Donut|Pie|Truffle|Macaron|Sandwich|Pizza|Burger|Bowl|Platter|Box))\b/g;
  let match: RegExpExecArray | null;
  const fullText = reviews.map((r) => r.comment).join(" ");
  while ((match = foodRegex.exec(fullText)) !== null) {
    const phrase = match[1].trim();
    phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
  }
  // Also tally 1-2 word capitalised phrases that appear 2+ times
  const capRegex = /\b([A-Z][a-z]{3,}(?:\s+[A-Z][a-z]{3,})?)\b/g;
  while ((match = capRegex.exec(fullText)) !== null) {
    const phrase = match[1].trim();
    // Skip common non-product words
    if (/(?:The|This|That|Thank|Thanks|Hello|Hi|Best|Wish|Great|Love|Amazing|Perfect|Highly|Really|Very|Will|Would|Could|Should|Have|Been|From|With|They|Their|Them|Were|Was|Had|Has|Are|You|Your|Our|Its|It's|Just|Also|But|And|For|Not|All|One|Two)\b/i.test(phrase)) {
      continue;
    }
    phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
  }
  const mostMentioned = Object.entries(phraseCounts)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);

  // If we found nothing but there ARE reviews, fall back to top words
  if (loved.length === 0 && reviews.length > 0) {
    const avgRating =
      reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    if (avgRating >= 4) {
      loved.push("Overall Experience");
    }
  }

  return { loved, mostMentioned, improvements };
}

/** Build the prompt for AI to extract the structured summary. */
function buildPrompt(vendorName: string, reviews: ReviewRow[]): string {
  const reviewText = reviews
    .slice(0, 30)
    .map((r, i) => `Review ${i + 1} (${r.rating}/5) by ${r.author}:\n${r.comment}`)
    .join("\n\n");

  return `You are analysing customer reviews for a vendor named "${vendorName}" on a party-planning marketplace.

Read the reviews below and extract a structured summary as JSON with three arrays of short strings (1-3 words each):
- "loved": themes customers love (e.g. "Taste", "Communication", "On-time Delivery")
- "mostMentioned": products or items mentioned most often (e.g. "Chocolate Cake", "Brownies")
- "improvements": areas for improvement, only if mentioned (e.g. "More delivery locations"). If nothing negative was mentioned, return an empty array.

Return ONLY the JSON object — no markdown, no commentary.

Reviews:
${reviewText}

Return the JSON now:`;
}

/** Try to parse the AI's JSON response. */
function parseAiSummary(content: string, fallback: ReturnType<typeof buildTemplateSummary>) {
  try {
    let text = content.trim();
    if (text.startsWith("```")) {
      text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    }
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.slice(firstBrace, lastBrace + 1);
    }
    const parsed = JSON.parse(text);
    const toStrArr = (v: unknown): string[] =>
      Array.isArray(v)
        ? v.filter((x) => typeof x === "string" && x.trim()).map((x) => String(x).trim()).slice(0, 8)
        : [];
    return {
      loved: toStrArr(parsed.loved),
      mostMentioned: toStrArr(parsed.mostMentioned),
      improvements: toStrArr(parsed.improvements),
    };
  } catch {
    return fallback;
  }
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const vendorId = sp.get("vendorId");
    if (!vendorId) {
      return NextResponse.json(
        { error: "vendorId query parameter required" },
        { status: 400 }
      );
    }

    // ── 1. Fetch vendor name + reviews ──────────────────────────────────
    let vendorName = "this vendor";
    let reviews: ReviewRow[] = [];

    try {
      const vendor = await db.vendor.findUnique({
        where: { id: vendorId },
        select: { name: true },
      });
      if (vendor?.name) vendorName = vendor.name;
    } catch (e) {
      logger.error("ai-review-summary", "vendor fetch failed", { message: (e as Error)?.message?.slice(0, 120) });
    }

    try {
      reviews = (await db.review.findMany({
        where: { vendorId },
        select: {
          id: true,
          author: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })) as ReviewRow[];
    } catch (e) {
      logger.error("ai-review-summary", "reviews fetch failed", { message: (e as Error)?.message?.slice(0, 120) });
    }

    // ── 2. Build template summary (always available as fallback) ─────────
    const templateSummary = buildTemplateSummary(reviews);

    if (reviews.length === 0) {
      return NextResponse.json({
        loved: [],
        mostMentioned: [],
        improvements: [],
        source: "template" as const,
      });
    }

    // ── 3. Try AI summary ────────────────────────────────────────────────
    const zai = await getZAI();
    if (zai) {
      const prompt = buildPrompt(vendorName, reviews);
      // ── Prompt injection check (defense-in-depth: customer review text) ──
      const sanitizeResult = sanitizePrompt(prompt);
      if (sanitizeResult.blocked) {
        logger.warn("ai-review-summary", "Prompt injection blocked", { reason: sanitizeResult.reason, vendorId });
      } else {
        try {
          // ── 30-second timeout ──
          const { result: content, timedOut } = await callWithTimeout(async (_signal) => {
            const completion = await zai.chat.completions.create({
              messages: [
                {
                  role: "assistant",
                  content:
                    "You are a sentiment analyst. You return ONLY JSON when asked.",
                },
                { role: "user", content: sanitizeResult.sanitized },
              ],
              thinking: { type: "disabled" },
            });
            return completion.choices[0]?.message?.content || "";
          }, 30_000);

          if (timedOut) {
            logger.warn("ai-review-summary", "LLM call timed out after 30s", { vendorId });
          } else if (content) {
            const aiSummary = parseAiSummary(content, templateSummary);
            return NextResponse.json({ ...aiSummary, source: "ai" as const });
          }
        } catch (e) {
          logger.error("ai-review-summary", "AI call failed, using template", { message: (e as Error)?.message?.slice(0, 120) });
        }
      }
    }

    return NextResponse.json({ ...templateSummary, source: "template" as const });
  } catch (err) {
    logger.error("ai-review-summary", "GET failed", { message: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({
      loved: [],
      mostMentioned: [],
      improvements: [],
      source: "template" as const,
    });
  }
}
