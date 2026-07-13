/**
 * Centralized Logger
 * ─────────────────────────────────────────────────────────────────────────
 * Replaces direct console.log/console.error calls with a structured logger
 * that includes context (request id, user id, vendor id, execution time).
 *
 * On Vercel: logs go to Vercel Observability (stdout/stderr).
 * In development: logs go to the terminal with color coding.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("api/vendors", "Vendor created", { vendorId: "abc" });
 *   logger.error("api/vendors", "Failed to create vendor", err);
 */

type LogLevel = "info" | "warn" | "error";

function formatLog(
  level: LogLevel,
  module: string,
  message: string,
  context?: Record<string, any>,
  error?: unknown
): string {
  const timestamp = new Date().toISOString();
  const levelTag = level.toUpperCase().padEnd(5);
  const moduleTag = `[${module}]`;

  let line = `${timestamp} ${levelTag} ${moduleTag} ${message}`;

  if (context && Object.keys(context).length > 0) {
    // Sanitize — never log full tokens, passwords, or PII
    const safe: Record<string, any> = {};
    for (const [k, v] of Object.entries(context)) {
      if (k.toLowerCase().includes("token") || k.toLowerCase().includes("password") || k.toLowerCase().includes("secret")) {
        safe[k] = "***";
      } else if (k.toLowerCase().includes("email") && typeof v === "string") {
        safe[k] = v.slice(0, 2) + "***";
      } else {
        safe[k] = v;
      }
    }
    line += ` ${JSON.stringify(safe)}`;
  }

  if (error instanceof Error) {
    line += ` ERROR: ${error.message}`;
    if (process.env.NODE_ENV !== "production" && error.stack) {
      line += `\n${error.stack.split("\n").slice(0, 3).join("\n")}`;
    }
  } else if (error) {
    line += ` ERROR: ${String(error)}`;
  }

  return line;
}

export const logger = {
  info(module: string, message: string, context?: Record<string, any>) {
    console.log(formatLog("info", module, message, context));
  },

  warn(module: string, message: string, context?: Record<string, any>) {
    console.warn(formatLog("warn", module, message, context));
  },

  error(
    module: string,
    message: string,
    error?: unknown,
    context?: Record<string, any>
  ) {
    console.error(formatLog("error", module, message, context, error));
  },

  /**
   * Creates a child logger with a persistent context (e.g. requestId).
   * The context is merged into every log call.
   */
  withContext(ctx: Record<string, any>) {
    return {
      info: (module: string, message: string, extra?: Record<string, any>) =>
        console.log(formatLog("info", module, message, { ...ctx, ...extra })),
      warn: (module: string, message: string, extra?: Record<string, any>) =>
        console.warn(formatLog("warn", module, message, { ...ctx, ...extra })),
      error: (module: string, message: string, error?: unknown, extra?: Record<string, any>) =>
        console.error(formatLog("error", module, message, { ...ctx, ...extra }, error)),
      debug: (module: string, message: string, extra?: Record<string, any>) => {
        if (process.env.NODE_ENV !== "production") {
          console.log(formatLog("info", module, `[DEBUG] ${message}`, { ...ctx, ...extra }));
        }
      },
    };
  },
};
