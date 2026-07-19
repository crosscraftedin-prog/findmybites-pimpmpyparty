import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { getZAI } from "@/lib/zai-server";
import { sanitizePrompt, callWithTimeout } from "@/lib/ai/security";
import { logger } from "@/lib/logger";
import { getToolSchemas, executeTool, type VendorToolContext } from "@/lib/josh/vendor-tools";

/**
 * POST /api/josh/vendor-copilot
 *
 * Josh AI Vendor Copilot — the "operating system" for vendors.
 *
 * Unlike the customer-facing Josh AI (/api/josh/chat) which helps customers
 * find vendors, this endpoint is for VENDORS. It uses LLM tool-calling to
 * orchestrate the existing 31 AI APIs:
 *
 *   - Generate descriptions
 *   - Audit listing
 *   - Get daily report
 *   - Get growth actions
 *   - Get price advice
 *   - Generate marketing content
 *   - Generate SEO
 *   - Get review summary
 *   - Get vendor insights
 *   - Generate review replies
 *
 * The vendor simply asks Josh in natural language, and Josh calls the
 * appropriate existing API automatically. No business logic is duplicated
 * — this route is purely an orchestrator.
 *
 * Example:
 *   Vendor: "Create a description for my bakery"
 *   Josh: calls generate_description tool → returns result
 *
 *   Vendor: "How can I improve my listing?"
 *   Josh: calls audit_listing tool → returns score + suggestions
 *
 *   Vendor: "What should I post on Instagram?"
 *   Josh: calls generate_marketing tool → returns social posts
 *
 * Architecture:
 *   1. Authenticate vendor via Supabase session
 *   2. Build tool schemas from the registry
 *   3. Send vendor's message + tool schemas to LLM
 *   4. LLM returns a tool_call (or a direct response)
 *   5. If tool_call: execute the tool (calls existing API) → return result to LLM
 *   6. LLM verbalizes the result into natural language
 *   7. Return the response to the vendor
 */

const SYSTEM_PROMPT = `You are Josh AI, the AI business assistant for FindMyBites and PimpMyParty vendors.

You are NOT a chatbot. You are an operating system that orchestrates the vendor's entire business workflow.

When a vendor asks you to do something, you MUST use the available tools to actually DO it — don't just give advice. For example:
- "Create a description" → call generate_description
- "How's my listing?" → call audit_listing
- "What should I improve?" → call get_growth_actions
- "Am I charging enough?" → call get_price_advice
- "Create an Instagram post" → call generate_marketing
- "Improve my SEO" → call generate_seo
- "What do customers say?" → call get_review_summary
- "How's my business doing?" → call get_vendor_insights
- "Help me reply to a review" → call generate_review_reply
- "Give me my report" → call get_daily_report

After calling a tool, summarize the result in 2-3 sentences. Be specific and actionable.
If a tool fails, apologize and suggest the vendor try again or contact support.
Keep responses concise — vendors are busy. Use bullet points for lists.
Be encouraging but honest. If something needs improvement, say so directly.`;

interface ChatMessage {
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  tool_call_id?: string;
  tool_calls?: any[];
  name?: string;
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. Authenticate ──
    const supabase = await createSupabaseServerClient();
    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { userId = user.id; userEmail = user.email ?? null; }
    } catch {}
    if (!userId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) { userId = session.user.id; userEmail = session.user.email ?? null; }
      } catch {}
    }
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // ── 2. Resolve vendor ──
    const vendor = await db.vendor.findFirst({
      where: { OR: [{ owner_user_id: userId }, ...(userEmail ? [{ userEmail }] : [])] },
      select: {
        id: true, name: true, category: true, city: true,
        ecosystem: true, slug: true, countryCode: true,
      },
    }).catch(() => null);

    if (!vendor) {
      return NextResponse.json(
        { error: "No vendor listing found. Create a listing first." },
        { status: 404 }
      );
    }

    // ── 3. Parse request ──
    const body = await req.json();
    const { message, history = [] } = body as { message: string; history?: ChatMessage[] };

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // ── 4. Sanitize input ──
    const sanitizeResult = sanitizePrompt(message);
    if (sanitizeResult.blocked) {
      return NextResponse.json(
        { error: "Input rejected by security filter" },
        { status: 400 }
      );
    }

    // ── 5. Build tool context ──
    // The authFetch passes the session cookie so internal API calls are authenticated
    const cookieHeader = req.headers.get("cookie") || "";
    const toolContext: VendorToolContext = {
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorCategory: vendor.category,
      vendorCity: vendor.city,
      vendorEcosystem: vendor.ecosystem,
      authFetch: async (url: string, options?: RequestInit) => {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
        return fetch(`${baseUrl}${url}`, {
          ...options,
          headers: {
            ...(options?.headers || {}),
            cookie: cookieHeader,
          },
        });
      },
    };

    // ── 6. Call LLM with tools ──
    const zai = await getZAI();
    if (!zai) {
      return NextResponse.json({
        response: "I'm sorry, I'm not fully configured right now. Please try again later or contact support.",
        toolsAvailable: getToolSchemas().length,
      });
    }

    const tools = getToolSchemas();
    const messages: ChatMessage[] = [
      { role: "user", content: `Vendor context: ${vendor.name} (${vendor.category}) in ${vendor.city}. Ecosystem: ${vendor.ecosystem}.` },
      { role: "assistant", content: "Got it. I'm ready to help this vendor with their business." },
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-10), // keep last 10 messages for context
      { role: "user", content: sanitizeResult.sanitized },
    ];

    // ── 7. First LLM call — may return a tool_call ──
    const { result: firstResponse, timedOut } = await callWithTimeout(async () => {
      const completion = await zai.chat.completions.create({
        messages: messages as any,
        tools: tools as any,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 1000,
      });
      return completion;
    }, 30_000);

    if (timedOut) {
      return NextResponse.json(
        { error: "AI request timed out. Please try again." },
        { status: 504 }
      );
    }

    const firstChoice = firstResponse?.choices?.[0];
    if (!firstChoice) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 502 }
      );
    }

    // ── 8. If LLM made a tool call, execute it and get final response ──
    if (firstChoice.message?.tool_calls && firstChoice.message.tool_calls.length > 0) {
      const toolCall = firstChoice.message.tool_calls[0];
      const toolName = toolCall.function.name;
      let toolParams: Record<string, unknown> = {};

      try {
        toolParams = JSON.parse(toolCall.function.arguments || "{}");
      } catch {
        toolParams = {};
      }

      logger.info("josh-copilot", `LLM requested tool: ${toolName}`, {
        vendorId: vendor.id,
        toolParams: Object.keys(toolParams),
      });

      // Execute the tool (calls the existing production API)
      const toolResult = await executeTool(toolName, toolParams, toolContext);

      // Send the tool result back to the LLM for verbalization
      const { result: finalResponse, timedOut: finalTimedOut } = await callWithTimeout(async () => {
        const completion = await zai.chat.completions.create({
          messages: [
            ...messages as any,
            {
              role: "assistant",
              content: null,
              tool_calls: firstChoice.message.tool_calls,
            },
            {
              role: "tool",
              content: toolResult.slice(0, 4000), // truncate to fit context window
              tool_call_id: toolCall.id,
              name: toolName,
            },
          ] as any,
          temperature: 0.7,
          max_tokens: 800,
          thinking: { type: "disabled" as const },
        });
        return completion;
      }, 30_000);

      if (finalTimedOut) {
        return NextResponse.json({
          response: "I started working on that but it's taking longer than expected. The action may have been triggered — check your dashboard for updates.",
          toolCalled: toolName,
        });
      }

      const finalText = finalResponse?.choices?.[0]?.message?.content || "I've completed that for you. Is there anything else you need?";

      return NextResponse.json({
        response: finalText,
        toolCalled: toolName,
        toolResultPreview: toolResult.slice(0, 200),
      });
    }

    // ── 9. No tool call — LLM responded directly ──
    const directResponse = firstChoice.message?.content || "I'm here to help. What would you like to do?";

    return NextResponse.json({
      response: directResponse,
      toolCalled: null,
    });
  } catch (error: any) {
    logger.error("josh-copilot", "POST failed", error, { message: error?.message });
    return NextResponse.json(
      { error: `Failed to process request: ${error?.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/josh/vendor-copilot
 * Returns the list of available tools (for UI display / debugging)
 */
export async function GET() {
  const tools = getToolSchemas().map((t) => ({
    name: t.function.name,
    description: t.function.description,
  }));
  return NextResponse.json({
    status: "ok",
    tools,
    toolCount: tools.length,
    version: "1.0.0",
  });
}
