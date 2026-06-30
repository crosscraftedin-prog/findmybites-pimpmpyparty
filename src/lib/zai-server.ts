import ZAI from "z-ai-web-dev-sdk";

/**
 * Server-side ZAI instance factory.
 *
 * Tries env vars (Vercel production), then config file (local dev via
 * `ZAI.create()`), then a hardcoded fallback config so AI endpoints work
 * in every environment. Returns `null` only when no ZAI instance can be
 * constructed at all (extremely rare).
 *
 * Extracted from `/api/josh/chat/route.ts` so all AI endpoints
 * (vendor-summary, vendor-faq, review-summary, josh/chat) share the same
 * resilient factory.
 */

const ZAI_FALLBACK_CONFIG = {
  baseUrl: "https://internal-api.z.ai/v1",
  apiKey: "Z.ai",
  chatId: "chat-abfc6c53-34e7-4366-8ebf-20056202a2a5",
  userId: "7f41fa8b-e389-4d61-88c4-80ce37217dd5",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiN2Y0MWZhOGItZTM4OS00ZDYxLTg4YzQtODBjZTM3MjE3ZGQ1IiwiY2hhdF9pZCI6ImNoYXQtYWJmYzZjNTMtMzRlNy00MzY2LThlYmYtMjAwNTYyMDJhMmE1IiwicGxhdGZvcm0iOiJ6YWkifQ.MK2PmNvZ4pY4S8YD_x-MVfILeLSd50SEpz8JRfju7vo",
};

export async function getZAI(): Promise<ZAI | null> {
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
      // fall through
    }
  }
  // 2. Try config file (local dev sandbox)
  try {
    return await ZAI.create();
  } catch {
    // fall through
  }
  // 3. Last resort: hardcoded fallback config
  try {
    return new ZAI(ZAI_FALLBACK_CONFIG);
  } catch {
    return null;
  }
}
