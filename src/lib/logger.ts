/**
 * Structured Logger — production-ready, Sentry-compatible.
 * ───────────────────────────────────────────────────────────────────────────
 * Replaces console.log with structured logging that includes:
 *   - ISO timestamp (ts)
 *   - Log level (info/warn/error/debug)
 *   - Module/route context (module)
 *   - Request ID (requestId — when provided in meta or via withContext)
 *   - User ID (userId — when provided in meta or via withContext)
 *   - Route (route — when provided in meta or via withContext)
 *   - Optional metadata object (automatically redacted for secrets)
 *
 * Sensitive data redaction:
 *   Any meta key matching the SENSITIVE_KEY_PATTERNS list is replaced with
 *   "[REDACTED]" before the log is written. This prevents accidental leakage
 *   of passwords, cookies, JWTs, API keys, authorization headers, and secrets.
 *
 * In production: logs as JSON to stdout (Vercel captures automatically).
 * In development: logs as colored text for readability.
 *
 * Future: Add Sentry transport by calling Sentry.captureMessage/Exception
 * in the error() method.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const MIN_LEVEL: LogLevel =
  process.env.NODE_ENV === "production" ? "info" : "debug";

const COLORS: Record<LogLevel, string> = {
  debug: "\x1b[36m", // cyan
  info: "\x1b[32m",  // green
  warn: "\x1b[33m",  // yellow
  error: "\x1b[31m", // red
};
const RESET = "\x1b[0m";

// ── Sensitive key redaction ──────────────────────────────────────────────────
// Keys (case-insensitive) whose values must never be logged.
const SENSITIVE_KEY_PATTERNS = [
  /^password$/i,
  /^pass$/i,
  /^passwd$/i,
  /^secret$/i,
  /^secrets$/i,
  /^apiKey$/i,
  /^api_key$/i,
  /^apikey$/i,
  /^apiSecret$/i,
  /^api_secret$/i,
  /^token$/i,
  /^accessToken$/i,
  /^access_token$/i,
  /^refreshToken$/i,
  /^refresh_token$/i,
  /^authToken$/i,
  /^auth_token$/i,
  /^jwt$/i,
  /^jwtSecret$/i,
  /^jwt_secret$/i,
  /^cookie$/i,
  /^cookies$/i,
  /^setCookie$/i,
  /^set_cookie$/i,
  /^authorization$/i,
  /^auth$/i,        // careful: "author" would match /^auth/i but we use exact
  /^privateKey$/i,
  /^private_key$/i,
  /^clientSecret$/i,
  /^client_secret$/i,
  /^razorpayKeySecret$/i,
  /^keySecret$/i,
  /^supabase.*Key$/i,
  /^anonKey$/i,
  /^serviceRoleKey$/i,
];

const REDACTED = "[REDACTED]";

/**
 * Deep-clone the metadata object, replacing any sensitive key's value with
 * "[REDACTED]". Non-object values are returned as-is.
 */
function redactSensitive(value: any): any {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(redactSensitive);

  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_KEY_PATTERNS.some((p) => p.test(key))) {
      result[key] = REDACTED;
    } else if (typeof val === "object" && val !== null) {
      result[key] = redactSensitive(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

// ── Log context (request-scoped) ─────────────────────────────────────────────
export interface LogContext {
  requestId?: string;
  userId?: string;
  route?: string;
}

/**
 * Generate a short unique request ID (for correlation across log lines).
 */
export function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatLog(level: LogLevel, module: string, message: string, meta?: Record<string, any>, ctx?: LogContext): string {
  const timestamp = new Date().toISOString();

  // Redact sensitive data from metadata before logging
  const safeMeta = meta ? redactSensitive(meta) : undefined;

  // Build the context fields (requestId, userId, route)
  const ctxFields: Record<string, any> = {};
  if (ctx?.requestId) ctxFields.requestId = ctx.requestId;
  if (ctx?.userId) ctxFields.userId = ctx.userId;
  if (ctx?.route) ctxFields.route = ctx.route;

  if (process.env.NODE_ENV === "production") {
    // JSON format for Vercel log ingestion
    return JSON.stringify({ ts: timestamp, level, module, message, ...ctxFields, ...(safeMeta || {}) });
  }

  // Colored dev output
  const ctxStr = ctx?.requestId ? ` ${ctx.requestId}` : "";
  const metaStr = safeMeta && Object.keys(safeMeta).length > 0 ? ` ${JSON.stringify(safeMeta)}` : "";
  return `${COLORS[level]}[${level.toUpperCase()}]${RESET} ${timestamp}${ctxStr} [${module}] ${message}${metaStr}`;
}

function log(level: LogLevel, module: string, message: string, meta?: Record<string, any>, ctx?: LogContext): void {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[MIN_LEVEL]) return;

  const formatted = formatLog(level, module, message, meta, ctx);

  if (level === "error") {
    console.error(formatted);
    // Future: Sentry.captureException(new Error(message), { extra: { module, ...meta } });
  } else if (level === "warn") {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

// ── Logger interface ─────────────────────────────────────────────────────────
interface Logger {
  info: (module: string, message: string, meta?: Record<string, any>) => void;
  warn: (module: string, message: string, meta?: Record<string, any>) => void;
  error: (module: string, message: string, meta?: Record<string, any>) => void;
  debug: (module: string, message: string, meta?: Record<string, any>) => void;
  /** Create a child logger that auto-includes request context in every log line. */
  withContext: (ctx: LogContext) => ContextualLogger;
}

interface ContextualLogger {
  info: (module: string, message: string, meta?: Record<string, any>) => void;
  warn: (module: string, message: string, meta?: Record<string, any>) => void;
  error: (module: string, message: string, meta?: Record<string, any>) => void;
  debug: (module: string, message: string, meta?: Record<string, any>) => void;
}

export const logger: Logger = {
  info: (module, message, meta) => log("info", module, message, meta),
  warn: (module, message, meta) => log("warn", module, message, meta),
  error: (module, message, meta) => log("error", module, message, meta),
  debug: (module, message, meta) => log("debug", module, message, meta),
  withContext: (ctx: LogContext) => ({
    info: (module, message, meta) => log("info", module, message, meta, ctx),
    warn: (module, message, meta) => log("warn", module, message, meta, ctx),
    error: (module, message, meta) => log("error", module, message, meta, ctx),
    debug: (module, message, meta) => log("debug", module, message, meta, ctx),
  }),
};
