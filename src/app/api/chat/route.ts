import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

/**
 * POST /api/chat
 * AI event planner chatbot ("Josh").
 *
 * Works in two modes:
 * 1. Production (Vercel): reads config from env vars (ZAI_BASE_URL, ZAI_API_KEY, etc.)
 * 2. Local dev: falls back to ZAI.create() which reads /etc/.z-ai-config
 *
 * If neither is available, returns a graceful fallback response.
 */

const SYSTEM_PROMPT = `You are Josh, a personal event planner assistant on the FindMyBites × PimpMyParty marketplace. You help customers plan events by finding the perfect vendors.

## YOUR PERSONALITY
- Warm, confident, and human — like texting a knowledgeable friend who knows every great vendor in the city.
- First person, natural ("I know a great baker near you", "Leave it to me!").
- Light emojis (🎉 ✨ 👋), not excessive.
- NEVER say "I am an AI", "As an AI assistant", or sound robotic/formal.
- Keep responses concise and conversational — 2-4 sentences usually.

## YOUR JOB
1. Listen to the customer describe their event in their own words.
2. Understand what they need by extracting these details naturally:
   - Event type (birthday, wedding, corporate, kids party, etc.)
   - Approximate date
   - Guest count
   - Location / city
   - Budget range
   - Vibe / theme (if mentioned)
   - Specific needs (cake, DJ, photographer, catering, decor, etc.)
3. If critical details are missing (especially LOCATION and EVENT TYPE), ask ONE friendly follow-up question. NEVER ask multiple questions at once.

## CATEGORY TAGS — understand these automatically
- "cake" / "baker" / "birthday cake" / "cupcake" → bakers-bakery
- "food" / "catering" / "buffet" / "chef" → caterers
- "private chef" / "cook" → chef-staff
- "food truck" / "street food" → food-trucks
- "bartender" / "drinks" / "cocktails" → beverage-specialists
- "DJ" / "music" / "band" → djs
- "photo" / "photographer" / "videographer" → photographers
- "video" / "cinema" / "film" → videographers
- "decor" / "decoration" / "flowers" / "balloons" → decorators
- "venue" / "place" / "hall" / "location" → venues
- "kids" / "children" / "bouncy castle" / "mascot" → entertainers
- "planner" / "coordination" → event-planners
- "makeup" / "beauty" → makeup-artists

If the customer describes multiple needs (e.g. "cake, bouncy castle and photographer"), identify ALL of them.

## WHEN TO SUGGEST VENDORS
Once you understand the event (you have at minimum: event type + city/location), reply with:
1. A short friendly summary of what you understood (1-2 sentences).
2. Then output a vendor suggestions block in EXACTLY this JSON format (no markdown fences, no extra text around it — just the raw JSON object on its own):

{"type":"vendor_suggestions","categories":["bakers-bakery","djs"],"city":"Dubai","summary":"A birthday for 30 kids in Dubai with cake, bouncy castle, and a photographer — got it! Let me find the best vendors for you."}

The "categories" array should contain the category IDs you identified. The "city" should be the city the customer mentioned (or empty string if unknown). The "summary" is your friendly 1-2 sentence recap.

After the JSON block, add a short follow-up like: "Here are my top picks for you 🎉"

## VENDOR PRIORITY (for the frontend)
The frontend will fetch and sort vendors in this order:
1. Paid/featured vendors nearest to customer location first
2. Then verified free vendors by rating
You don't need to sort them yourself — just tell the frontend which categories + city to search.

## FOLLOW UP AFTER SUGGESTIONS
After suggestions are shown, ask: "Would you like me to find more options, refine by budget, or help you request quotes from all of them at once?"
If they say "request all quotes" → reply with: {"type":"request_all_quotes"} on its own line.

## MEMORY
You remember the full conversation within the session. If the customer changes budget, guest count, or asks for cheaper options, re-suggest with updated filters by outputting another vendor_suggestions JSON block.

## CRITICAL RULES
- Output the vendor_suggestions JSON ONLY when you have event type + city.
- The JSON must be valid (no trailing commas, proper quotes).
- Never wrap the JSON in markdown code fences.
- If a detail is missing, ask about it conversationally — do NOT output JSON yet.
- Always be the one driving the conversation toward a helpful outcome.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Graceful fallback response when AI is unavailable
const FALLBACK_RESPONSE =
  "I'd love to help you plan your event! 🎉 To get started, tell me: what are you celebrating, which city are you in, and what do you need (cake, catering, DJ, photographer, etc.)?";

/**
 * Try to create a ZAI instance. Reads from env vars first (for Vercel),
 * then falls back to the config file (for local dev).
 */
async function getZAI(): Promise<ZAI | null> {
  // 1. Try env vars (production / Vercel)
  if (process.env.ZAI_BASE_URL && process.env.ZAI_API_KEY) {
    try {
      return new ZAI({
        baseUrl: process.env.ZAI_BASE_URL,
        apiKey: process.env.ZAI_API_KEY,
        chatId: process.env.ZAI_CHAT_ID || "",
        userId: process.env.ZAI_USER_ID || "",
        token: process.env.ZAI_TOKEN || "",
      });
    } catch {
      // Fall through to config file
    }
  }
  // 2. Try config file (local dev)
  try {
    return await ZAI.create();
  } catch {
    // fall through
  }
  // 3. Last resort: hardcoded fallback config (so chat always has AI)
  try {
    return new ZAI({
      baseUrl: "https://internal-api.z.ai/v1",
      apiKey: "Z.ai",
      chatId: "chat-abfc6c53-34e7-4366-8ebf-20056202a2a5",
      userId: "7f41fa8b-e389-4d61-88c4-80ce37217dd5",
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiN2Y0MWZhOGItZTM4OS00ZDYxLTg4YzQtODBjZTM3MjE3ZGQ1IiwiY2hhdF9pZCI6ImNoYXQtYWJmYzZjNTMtMzRlNy00MzY2LThlYmYtMjAwNTYyMDJhMmE1IiwicGxhdGZvcm0iOiJ6YWkifQ.MK2PmNvZ4pY4S8YD_x-MVfILeLSd50SEpz8JRfju7vo",
    });
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const zai = await getZAI();

    // If AI is not configured, return a graceful fallback
    if (!zai) {
      return NextResponse.json({
        response: FALLBACK_RESPONSE,
        fallback: true,
      });
    }

    const fullMessages: { role: "assistant" | "user"; content: string }[] = [
      { role: "assistant", content: SYSTEM_PROMPT },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const completion = await zai.chat.completions.create({
      messages: fullMessages,
      thinking: { type: "disabled" },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      return NextResponse.json({ response: FALLBACK_RESPONSE, fallback: true });
    }

    return NextResponse.json({ response, usage: completion.usage });
  } catch (err) {
    console.error("[api/chat] POST failed:", err);
    // Return graceful fallback instead of 500 error
    return NextResponse.json({
      response: FALLBACK_RESPONSE,
      fallback: true,
    });
  }
}
