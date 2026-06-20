"use client";

import * as React from "react";

/**
 * Error monitoring component.
 *
 * In production with NEXT_PUBLIC_SENTRY_DSN set, this would initialize
 * Sentry. For now, it captures errors via window.onerror and
 * unhandledrejection events, logging them to console with structured data
 * that can be picked up by Vercel's runtime logs or a log drain.
 *
 * To enable Sentry:
 * 1. npm install @sentry/nextjs
 * 2. Set NEXT_PUBLIC_SENTRY_DSN in .env
 * 3. Replace the console.error calls with Sentry.captureException()
 */
export function ErrorMonitoring() {
  React.useEffect(() => {
    // Capture uncaught JavaScript errors
    const handleError = (event: ErrorEvent) => {
      const errorData = {
        type: "javascript_error",
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      };
      console.error("[ErrorMonitoring]", errorData);

      // TODO: Send to Sentry when configured
      // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      //   Sentry.captureException(event.error);
      // }
    };

    // Capture unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      const errorData = {
        type: "unhandled_promise_rejection",
        reason: event.reason?.message || event.reason,
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      };
      console.error("[ErrorMonitoring]", errorData);

      // TODO: Send to Sentry when configured
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
