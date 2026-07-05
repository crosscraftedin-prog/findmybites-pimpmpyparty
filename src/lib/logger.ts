/**
 * Structured Logger — production-ready, Sentry-compatible.
 * ───────────────────────────────────────────────────────────────────────────
 * Replaces console.log with structured logging that includes:
 *   - ISO timestamp
 *   - Log level (INFO/WARN/ERROR/DEBUG)
 *   - Module/route context
 *   - Optional metadata object
 *   - Request ID (when available via AsyncLocalStorage in future)
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

function formatLog(level: LogLevel, module: string, message: string, meta?: Record<string, any>): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";

  if (process.env.NODE_ENV === "production") {
    // JSON format for Vercel log ingestion
    return JSON.stringify({ ts: timestamp, level, module, message, ...meta });
  }

  // Colored dev output
  return `${COLORS[level]}[${level.toUpperCase()}]${RESET} ${timestamp} [${module}] ${message}${metaStr}`;
}

function log(level: LogLevel, module: string, message: string, meta?: Record<string, any>): void {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[MIN_LEVEL]) return;

  const formatted = formatLog(level, module, message, meta);

  if (level === "error") {
    console.error(formatted);
    // Future: Sentry.captureException(new Error(message), { extra: { module, ...meta } });
  } else if (level === "warn") {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

export const logger = {
  info: (module: string, message: string, meta?: Record<string, any>) => log("info", module, message, meta),
  warn: (module: string, message: string, meta?: Record<string, any>) => log("warn", module, message, meta),
  error: (module: string, message: string, meta?: Record<string, any>) => log("error", module, message, meta),
  debug: (module: string, message: string, meta?: Record<string, any>) => log("debug", module, message, meta),
};
