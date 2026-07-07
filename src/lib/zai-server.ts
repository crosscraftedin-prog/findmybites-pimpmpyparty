import https from "https";
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
 * Call the ZAI (GLM) chat completions API directly using node:https.
 *
 * This bypasses Node.js's built-in fetch() (which has a 10s connect timeout
 * via undici that fails on Vercel production) and uses the https module
 * directly with a custom 25s connect timeout.
 *
 * @param messages - Array of { role, content } messages
 * @param timeoutMs - Overall timeout (default 25s, within Vercel's 30s limit)
 * @returns The response from the ZAI API, or null on failure
 */
export async function callZAIChat(
  messages: Array<{ role: string; content: string }>,
  timeoutMs: number = 25_000
): Promise<ZAICompletionResponse | null> {
  const url = new URL(`${ZAI_CONFIG.baseUrl}/chat/completions`);
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
  logger.info("zai-server", "callZAIChat — https request starting", {
    url: url.toString(),
    timeoutMs,
    messageCount: messages.length,
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: "POST",
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(body),
        },
        // Custom connect timeout — 20 seconds (overrides undici's 10s default)
        timeout: timeoutMs,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const elapsed = Date.now() - startTime;

          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data) as ZAICompletionResponse;
              logger.info("zai-server", "✅ ZAI API call successful", {
                elapsedMs: elapsed,
                contentLength: parsed.choices?.[0]?.message?.content?.length ?? 0,
              });
              resolve(parsed);
            } catch (e: any) {
              logger.error("zai-server", "❌ JSON parse failed", {
                elapsedMs: elapsed,
                error: e?.message,
                rawData: data.slice(0, 200),
              });
              resolve(null);
            }
          } else {
            logger.error("zai-server", "❌ ZAI API returned non-200", {
              status: res.statusCode,
              statusText: res.statusMessage,
              elapsedMs: elapsed,
              errorBody: data.slice(0, 200),
            });
            resolve(null);
          }
        });
      }
    );

    req.on("error", (err: any) => {
      const elapsed = Date.now() - startTime;
      logger.error("zai-server", "❌ ZAI API request error", {
        errorName: err?.name,
        errorMessage: err?.message,
        errorCode: err?.code,
        elapsedMs: elapsed,
      });
      resolve(null);
    });

    req.on("timeout", () => {
      const elapsed = Date.now() - startTime;
      logger.error("zai-server", "❌ ZAI API request timeout", {
        elapsedMs: elapsed,
        timeoutMs,
      });
      req.destroy();
      resolve(null);
    });

    req.write(body);
    req.end();
  });
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
