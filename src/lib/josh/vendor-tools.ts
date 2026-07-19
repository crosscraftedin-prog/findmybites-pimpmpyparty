/**
 * Josh AI Vendor Copilot — Tool Registry
 *
 * This module defines the tools Josh AI can call when a vendor asks for help.
 * Each tool connects to an EXISTING production API — no business logic is
 * duplicated here. Josh is the orchestrator; the existing APIs do the work.
 *
 * Architecture:
 *   Vendor asks Josh → LLM picks a tool → tool calls existing API → result returned
 *
 * The existing APIs are NOT modified, duplicated, or rebuilt. This module
 * simply wraps them in a tool-calling interface so Josh can invoke them.
 */

import { getZAI } from "@/lib/zai-server";
import { callWithTimeout } from "@/lib/ai/security";
import { logger } from "@/lib/logger";

// ── Types ─────────────────────────────────────────────────────────────────

export interface VendorTool {
  name: string;
  description: string;
  parameters: Record<string, {
    type: string;
    description: string;
    required?: boolean;
  }>;
  /** Executes the tool by calling an existing API. Returns a JSON string for the LLM. */
  execute: (params: Record<string, unknown>, context: VendorToolContext) => Promise<string>;
}

export interface VendorToolContext {
  vendorId: string;
  vendorName: string;
  vendorCategory: string;
  vendorCity: string;
  vendorEcosystem: string;
  /** Authenticated server-side fetch (passes session cookie) */
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

// ── Tool Implementations ──────────────────────────────────────────────────

/**
 * TOOL: Generate product description from basic info
 * Connects to: POST /api/ai/generate-description (existing)
 */
const generateDescriptionTool: VendorTool = {
  name: "generate_description",
  description: "Generate a professional product/business description, tagline, SEO keywords, meta description, and tags. Use when the vendor asks to write or improve a description.",
  parameters: {
    name: { type: "string", description: "Business or product name", required: true },
    category: { type: "string", description: "Business category (e.g., Bakery, Photography)", required: true },
    subcategory: { type: "string", description: "Business type or subcategory (e.g., Home Baker)" },
    city: { type: "string", description: "City" },
  },
  async execute(params) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/ai/generate-description`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendorName: params.name,
        category: params.category,
        subcategory: params.subcategory || "",
        city: params.city || "",
      }),
    });
    const data = await res.json();
    if (!res.ok) return JSON.stringify({ error: data.error || "Failed to generate description" });
    return JSON.stringify(data);
  },
};

/**
 * TOOL: Audit vendor listing
 * Connects to: POST /api/ai/listing-audit (existing)
 */
const auditListingTool: VendorTool = {
  name: "audit_listing",
  description: "Audit the vendor's listing and return a quality score (0-100) with specific improvement suggestions. Use when the vendor asks 'how can I improve my listing' or 'what's my score'.",
  parameters: {},
  async execute(_params, ctx) {
    const res = await ctx.authFetch(`/api/ai/listing-audit?vendorId=${ctx.vendorId}`);
    const data = await res.json();
    if (!res.ok) return JSON.stringify({ error: data.error || "Failed to audit listing" });
    return JSON.stringify(data);
  },
};

/**
 * TOOL: Get daily business report
 * Connects to: GET /api/vendor/growth-manager/daily-report (existing)
 */
const dailyReportTool: VendorTool = {
  name: "get_daily_report",
  description: "Get today's AI business report with KPIs, performance summary, and recommendations. Use when the vendor asks 'how am I doing' or 'give me my report'.",
  parameters: {},
  async execute(_params, ctx) {
    const res = await ctx.authFetch(`/api/vendor/growth-manager/daily-report?vendorId=${ctx.vendorId}`);
    const data = await res.json();
    if (!res.ok) return JSON.stringify({ error: data.error || "Failed to get report" });
    return JSON.stringify(data);
  },
};

/**
 * TOOL: Get growth actions
 * Connects to: GET /api/vendor/growth-manager (existing, via chat endpoint)
 */
const growthActionsTool: VendorTool = {
  name: "get_growth_actions",
  description: "Get actionable growth recommendations with estimated impact. Use when the vendor asks 'what should I do' or 'how can I grow'.",
  parameters: {},
  async execute(_params, ctx) {
    const res = await ctx.authFetch(`/api/vendor/growth-manager/daily-report?vendorId=${ctx.vendorId}`);
    const data = await res.json();
    if (!res.ok) return JSON.stringify({ error: data.error || "Failed to get growth actions" });
    // Extract just the actions portion for the LLM
    return JSON.stringify({
      actions: data.actions || data.growthActions || [],
      summary: data.summary || data.aiSummary || "",
    });
  },
};

/**
 * TOOL: Get price advice
 * Connects to: GET /api/vendor/growth-manager/price-advisor (existing)
 */
const priceAdvisorTool: VendorTool = {
  name: "get_price_advice",
  description: "Get AI pricing recommendations based on competitor analysis. Use when the vendor asks about pricing, 'am I charging enough', or 'what should I charge'.",
  parameters: {},
  async execute(_params, ctx) {
    const res = await ctx.authFetch(`/api/vendor/growth-manager/price-advisor?vendorId=${ctx.vendorId}`);
    const data = await res.json();
    if (!res.ok) return JSON.stringify({ error: data.error || "Failed to get price advice" });
    return JSON.stringify(data);
  },
};

/**
 * TOOL: Generate marketing content
 * Connects to: POST /api/vendor/marketing/ai/social (existing)
 */
const generateMarketingTool: VendorTool = {
  name: "generate_marketing",
  description: "Generate social media posts for Instagram, Facebook, and WhatsApp. Use when the vendor asks to 'create a post', 'generate marketing content', or 'what should I post'.",
  parameters: {
    platform: { type: "string", description: "Platform: instagram, facebook, whatsapp, or all" },
    topic: { type: "string", description: "What the post is about (e.g., 'Bluey birthday cake')" },
  },
  async execute(params, ctx) {
    const res = await ctx.authFetch(`/api/vendor/marketing/ai/social`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendorId: ctx.vendorId,
        platform: params.platform || "all",
        topic: params.topic || "",
      }),
    });
    const data = await res.json();
    if (!res.ok) return JSON.stringify({ error: data.error || "Failed to generate marketing content" });
    return JSON.stringify(data);
  },
};

/**
 * TOOL: Generate SEO content
 * Connects to: POST /api/vendor/marketing/ai/seo (existing)
 */
const generateSeoTool: VendorTool = {
  name: "generate_seo",
  description: "Generate SEO meta title, meta description, and keywords. Use when the vendor asks about SEO, 'improve my search ranking', or 'generate keywords'.",
  parameters: {
    productId: { type: "string", description: "Product ID (optional — if not provided, generates for the vendor profile)" },
  },
  async execute(params, ctx) {
    const res = await ctx.authFetch(`/api/vendor/marketing/ai/seo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendorId: ctx.vendorId,
        productId: params.productId || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) return JSON.stringify({ error: data.error || "Failed to generate SEO" });
    return JSON.stringify(data);
  },
};

/**
 * TOOL: Get review summary
 * Connects to: GET /api/ai/review-summary (existing)
 */
const reviewSummaryTool: VendorTool = {
  name: "get_review_summary",
  description: "Get an AI summary of customer reviews — what customers love, what needs improvement, frequently mentioned topics. Use when the vendor asks about reviews or feedback.",
  parameters: {},
  async execute(_params, ctx) {
    const res = await ctx.authFetch(`/api/ai/review-summary?vendorId=${ctx.vendorId}`);
    const data = await res.json();
    if (!res.ok) return JSON.stringify({ error: data.error || "Failed to get review summary" });
    return JSON.stringify(data);
  },
};

/**
 * TOOL: Get vendor insights/analytics
 * Connects to: GET /api/vendor/success-center (existing)
 */
const vendorInsightsTool: VendorTool = {
  name: "get_vendor_insights",
  description: "Get comprehensive vendor insights including growth score, KPIs, competitors, SEO status, and performance metrics. Use when the vendor asks 'how's my business' or wants an overview.",
  parameters: {},
  async execute(_params, ctx) {
    const res = await ctx.authFetch(`/api/vendor/success-center?vendorId=${ctx.vendorId}`);
    const data = await res.json();
    if (!res.ok) return JSON.stringify({ error: data.error || "Failed to get insights" });
    return JSON.stringify(data);
  },
};

/**
 * TOOL: Generate review reply
 * Connects to: POST /api/vendor/growth-manager/review-reply (existing)
 */
const generateReviewReplyTool: VendorTool = {
  name: "generate_review_reply",
  description: "Generate an AI reply to a customer review. Use when the vendor asks 'help me reply to a review' or 'what should I say to this customer'.",
  parameters: {
    reviewId: { type: "string", description: "The review ID to reply to", required: true },
    style: { type: "string", description: "Writing style: professional, friendly, luxury, funny, or custom" },
  },
  async execute(params, ctx) {
    const res = await ctx.authFetch(`/api/vendor/growth-manager/review-reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendorId: ctx.vendorId,
        reviewId: params.reviewId,
        style: params.style || "professional",
      }),
    });
    const data = await res.json();
    if (!res.ok) return JSON.stringify({ error: data.error || "Failed to generate reply" });
    return JSON.stringify(data);
  },
};

// ── Tool Registry ─────────────────────────────────────────────────────────

export const VENDOR_TOOLS: VendorTool[] = [
  generateDescriptionTool,
  auditListingTool,
  dailyReportTool,
  growthActionsTool,
  priceAdvisorTool,
  generateMarketingTool,
  generateSeoTool,
  reviewSummaryTool,
  vendorInsightsTool,
  generateReviewReplyTool,
];

/**
 * Convert the tool registry to the ZAI/OpenAI function-calling format.
 * This is the schema passed to the LLM so it knows what tools are available.
 */
export function getToolSchemas() {
  return VENDOR_TOOLS.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties: tool.parameters,
      },
    },
  }));
}

/**
 * Execute a tool by name. Called when the LLM returns a tool_call.
 */
export async function executeTool(
  toolName: string,
  params: Record<string, unknown>,
  context: VendorToolContext
): Promise<string> {
  const tool = VENDOR_TOOLS.find((t) => t.name === toolName);
  if (!tool) {
    logger.warn("josh-copilot", `Unknown tool: ${toolName}`);
    return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }

  try {
    logger.info("josh-copilot", `Executing tool: ${toolName}`, {
      vendorId: context.vendorId,
      params: Object.keys(params),
    });
    const result = await tool.execute(params, context);
    logger.info("josh-copilot", `Tool completed: ${toolName}`, {
      vendorId: context.vendorId,
      resultLength: result.length,
    });
    return result;
  } catch (err: any) {
    logger.error("josh-copilot", `Tool failed: ${toolName}`, err, {
      vendorId: context.vendorId,
    });
    return JSON.stringify({ error: err?.message || "Tool execution failed" });
  }
}
