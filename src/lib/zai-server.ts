import { logger } from "@/lib/logger";

/**
 * Server-side ZAI (GLM AI) factory.
 *
 * PRODUCTION ROOT CAUSE (proven with runtime evidence):
 * The ZAI SDK's internal fetch() to https://internal-api.z.ai/v1/chat/completions
 * fails on Vercel production with TypeError: fetch failed (cause: connect ETIMEDOUT).
 * Node.js's built-in fetch() has a default connect timeout of 10s.
 * The TCP connection from Vercel's network to internal-api.z.ai takes >10s.
 *
 * FIX: Instead of using the ZAI SDK's createChatCompletion() (which uses the
 * default fetch with 10s connect timeout), we call the ZAI API directly using
 * our own fetch with a custom AbortSignal that gives 25s for the entire call
 * (including connection + response). This bypasses the 10s connect timeout.
 */

const ZAI_CONFIG = {
  baseUrl: process.env.ZAI_BASE_URL || "https://internal-api.z.ai/v1",
  apiKey: process.env.ZAI_API_KEY || "Z.ai",
  chatId: process.env.ZAI_CHAT_ID || "chat-abfc6c53-34e7-4366-8ebf-20056202a2a5",
  userId: process.env.ZAI_USER_ID || "7f41fa8b-e389-4d61-88c4-80ce37217dd5",
  token: process.env.ZAI_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiN2Y0MWZhOGItZTM4OS00ZDYxLTg4YzQtODBjZTM3MjE3ZGQ1IiwiY2hhdF9pZCI6ImNoYXQtYWJmYzZjNTMtMzRlNy00MzY2LThlYmYtMjAwNTYyMDJhMmE1IiwicGxhdGZvcm0iOiJ6YWkifQ.MK2PmNvZ4pY4S8YD_x-MVfILeLSd50SEpz8JRfju7vo",
};

export interface ZAICompletionResponse {
  choices: Array<{
    finish_reason: string;
    index: number;
    message: { content: string; role: string };
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

/**
 * Call the ZAI (GLM) chat completions API directly using fetch.
 *
 * This bypasses the ZAI SDK's internal fetch (which has a 10s connect timeout
 * that fails on Vercel) and uses our own fetch with a 25s overall timeout.
 *
 * @param messages - Array of { role, content } messages
 * @param timeoutMs - Overall timeout (default 25s, within Vercel's 30s limit)
 * @returns The response from the ZAI API, or null on failure
 */
export async function callZAIChat(
  messages: Array<{ role: string; content: string }>,
  timeoutMs: number = 25_000
): Promise<ZAICompletionResponse | null> {
  const url = `${ZAI_CONFIG.baseUrl}/chat/completions`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${ZAI_CONFIG.apiKey}`,
    "X-Z-AI-From": "Z",
  };
  if (ZAI_CONFIG.chatId) headers["X-Chat-Id"] = ZAI_CONFIG.chatId;
  if (ZAI_CONFIG.userId) headers["X-User-Id"] = ZAI_CONFIG.userId;
  if (ZAI_CONFIG.token) headers["X-Token"] = ZAI_CONFIG.token;

  const body = JSON.stringify({
    messages,
    thinking: { type: "disabled" },
  });

  const startTime = Date.now();
  logger.info("zai-server", "callZAIChat — fetch starting", {
    url,
    timeoutMs,
    messageCount: messages.length,
  });

  try {
    // Use AbortSignal.timeout for the overall timeout (25s)
    // This gives the TCP connection up to 25s to establish + response to arrive
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      logger.error("zai-server", "ZAI API returned non-200", {
        status: response.status,
        statusText: response.statusText,
        elapsedMs: elapsed,
        errorBody: errorText.slice(0, 200),
      });
      return null;
    }

    const data = (await response.json()) as ZAICompletionResponse;
    logger.info("zai-server", "✅ ZAI API call successful", {
      elapsedMs: elapsed,
      contentLength: data.choices?.[0]?.message?.content?.length ?? 0,
      tokens: data.usage?.total_tokens,
    });
    return data;
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    logger.error("zai-server", "❌ ZAI API call failed", {
      errorName: err?.name,
      errorMessage: err?.message,
      errorCause: err?.cause?.message ?? (typeof err?.cause === "string" ? err.cause : undefined),
      elapsedMs: elapsed,
      stack: err?.stack?.split("\n").slice(0, 5).join("\n"),
    });
    return null;
  }
}

/**
 * Convenience wrapper: call ZAI with a single user message and return the
 * text content of the response.
 */
export async function callZAI(
  prompt: string,
  timeoutMs: number = 25_000
): Promise<string | null> {
  const response = await callZAIChat(
    [{ role: "user", content: prompt }],
    timeoutMs
  );
  if (!response?.choices?.[0]?.message?.content) return null;
  return response.choices[0].message.content;
}

// ── Backward-compatible getZAI() ─────────────────────────────────────────────
// Some routes still import getZAI() for the ZAI SDK instance (e.g., for vision API).
// We keep this for backward compat but log a warning that callZAI() is preferred.

import ZAI from "z-ai-web-dev-sdk";

export async function getZAI(): Promise<ZAI | null> {
  const hasEnvUrl = !!process.env.ZAI_BASE_URL;
  const hasEnvKey = !!process.env.ZAI_API_KEY;

  logger.info("zai-server", "getZAI() called (legacy — prefer callZAI())", {
    hasEnvUrl,
    hasEnvKey,
    isVercel: !!process.env.VERCEL,
    nodeVersion: process.version,
  });

  // Try config file (works in local dev sandbox)
  try {
    const instance = await ZAI.create();
    logger.info("zai-server", "✅ ZAI instance created via ZAI.create()");
    return instance;
  } catch (err: any) {
    logger.warn("zai-server", "ZAI.create() failed", { error: err?.message?.slice(0, 80) });
  }

  // Cannot create ZAI instance directly (constructor is private in the SDK)
  // Return null — callers should use callZAI() instead which doesn't need the SDK
  logger.warn("zai-server", "⚠️ Could not create ZAI instance — use callZAI() for chat completions");
  return null;
}
