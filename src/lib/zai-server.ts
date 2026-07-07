import ZAI from "z-ai-web-dev-sdk";
import { logger } from "@/lib/logger";

/**
 * Server-side ZAI instance factory.
 *
 * Tries env vars (Vercel production), then config file (local dev via
 * `ZAI.create()`), then a hardcoded fallback config so AI endpoints work
 * in every environment. Returns `null` only when no ZAI instance can be
 * constructed at all (extremely rare).
 *
 * PRODUCTION DIAGNOSTICS: Logs which config path is used and all env var
 * availability so we can trace exactly which ZAI instance is created.
 *
 * PRODUCTION FIX: The fallback config uses `internal-api.z.ai` which has
 * connectivity issues from Vercel's network (TCP connect timeout > 10s).
 * Node.js's built-in fetch() has a default connect timeout of 10s, which
 * causes `TypeError: fetch failed` with `cause: connect ETIMEDOUT`.
 *
 * The env vars ZAI_BASE_URL, ZAI_API_KEY, ZAI_CHAT_ID, ZAI_USER_ID, and
 * ZAI_TOKEN should be set on Vercel to use the same endpoint explicitly.
 * When set, the env var path is used (step 1) instead of the fallback.
 */

const ZAI_FALLBACK_CONFIG = {
  baseUrl: "https://internal-api.z.ai/v1",
  apiKey: "Z.ai",
  chatId: "chat-abfc6c53-34e7-4366-8ebf-20056202a2a5",
  userId: "7f41fa8b-e389-4d61-88c4-80ce37217dd5",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiN2Y0MWZhOGItZTM4OS00ZDYxLTg4YzQtODBjZTM3MjE3ZGQ1IiwiY2hhdF9pZCI6ImNoYXQtYWJmYzZjNTMtMzRlNy00MzY2LThlYmYtMjAwNTYyMDJhMmE1IiwicGxhdGZvcm0iOiJ6YWkifQ.MK2PmNvZ4pY4S8YD_x-MVfILeLSd50SEpz8JRfju7vo",
};

export async function getZAI(): Promise<ZAI | null> {
  const hasEnvUrl = !!process.env.ZAI_BASE_URL;
  const hasEnvKey = !!process.env.ZAI_API_KEY;
  const nodeVersion = process.version;
  const runtime = process.env.NEXT_RUNTIME || "nodejs";
  const isVercel = !!process.env.VERCEL;

  logger.info("zai-server", "getZAI() called — env var check", {
    hasEnvUrl,
    hasEnvKey,
    nodeVersion,
    runtime,
    isVercel,
    vercelRegion: process.env.VERCEL_REGION || "unknown",
  });

  // 1. Try env vars (production / Vercel)
  if (hasEnvUrl && hasEnvKey) {
    try {
      const instance = new ZAI({
        baseUrl: process.env.ZAI_BASE_URL!,
        apiKey: process.env.ZAI_API_KEY!,
        chatId: process.env.ZAI_CHAT_ID || "",
        userId: process.env.ZAI_USER_ID || "",
        token: process.env.ZAI_TOKEN || "",
      });
      logger.info("zai-server", "✅ ZAI instance created via ENV VARS", {
        baseUrl: process.env.ZAI_BASE_URL,
      });
      return instance;
    } catch (err: any) {
      logger.error("zai-server", "❌ ENV VAR path failed", { error: err?.message });
    }
  } else {
    logger.warn("zai-server", "ENV VARS not set — skipping env path", {
      hasEnvUrl,
      hasEnvKey,
    });
  }

  // 2. Try config file (local dev sandbox)
  try {
    const instance = await ZAI.create();
    logger.info("zai-server", "✅ ZAI instance created via ZAI.create() (config file)");
    return instance;
  } catch (err: any) {
    logger.warn("zai-server", "ZAI.create() failed — config file not found", {
      error: err?.message?.slice(0, 100),
    });
  }

  // 3. Last resort: hardcoded fallback config
  try {
    const instance = new ZAI(ZAI_FALLBACK_CONFIG);
    logger.info("zai-server", "✅ ZAI instance created via FALLBACK CONFIG", {
      baseUrl: ZAI_FALLBACK_CONFIG.baseUrl,
      note: "This endpoint may have connectivity issues from Vercel — set ZAI_BASE_URL env var if AI calls fail",
    });
    return instance;
  } catch (err: any) {
    logger.error("zai-server", "❌ FALLBACK config failed — returning null", { error: err?.message });
    return null;
  }
}
