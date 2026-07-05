/**
 * AI Security: Prompt injection protection + timeout.
 * ───────────────────────────────────────────────────────────────────────────
 * 1. sanitizePrompt(): Detects and blocks common prompt injection attempts
 *    before sending user input to the LLM.
 * 2. callLLMWithTimeout(): Wraps LLM calls with a 30-second timeout using
 *    AbortController. Returns null on timeout with logged warning.
 */

// ── Prompt injection patterns ────────────────────────────────────────────────
const INJECTION_PATTERNS = [
  /ignore\s+(previous|prior|above|all)\s+instructions/i,
  /reveal\s+(system\s+)?prompt/i,
  /act\s+as\s+(developer|admin|root|system)/i,
  /print\s+(hidden|secret|system)\s+instructions/i,
  /jailbreak/i,
  /prompt\s+injection/i,
  /you\s+are\s+now\s+(a|an)\s+(developer|admin|root|dan)/i,
  /forget\s+(everything|all|previous)/i,
  /override\s+(safety|content|system)/i,
  /\bDAN\b.*prompt/i,
  /developer\s+mode/i,
  /\bsystem\s+prompt\b/i,
];

export interface SanitizeResult {
  safe: boolean;
  sanitized: string;
  blocked: boolean;
  reason?: string;
}

/**
 * Check user input for prompt injection attempts.
 * If detected, blocks the request.
 * If suspicious but not definitive, sanitizes by escaping.
 */
export function sanitizePrompt(userInput: string): SanitizeResult {
  const input = userInput.trim();

  // Check for injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return {
        safe: false,
        sanitized: "",
        blocked: true,
        reason: `Prompt injection attempt detected: matched pattern "${pattern.source}"`,
      };
    }
  }

  // Remove any attempt to inject system/role markers
  const sanitized = input
    .replace(/<\|system\|>/gi, "")
    .replace(/<\|user\|>/gi, "")
    .replace(/<\|assistant\|>/gi, "")
    .replace(/\[SYSTEM\]/gi, "")
    .replace(/\[INST\]/gi, "")
    .replace(/```system/gi, "```");

  return { safe: true, sanitized, blocked: false };
}

// ── LLM Timeout ──────────────────────────────────────────────────────────────
const AI_TIMEOUT_MS = 30_000; // 30 seconds

/**
 * Wraps an LLM call with a 30-second timeout.
 * Returns null if the timeout is reached.
 */
export async function callWithTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = AI_TIMEOUT_MS
): Promise<{ result: T | null; timedOut: boolean }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await fn(controller.signal);
    clearTimeout(timeout);
    return { result, timedOut: false };
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === "AbortError" || controller.signal.aborted) {
      return { result: null, timedOut: true };
    }
    throw err;
  }
}
