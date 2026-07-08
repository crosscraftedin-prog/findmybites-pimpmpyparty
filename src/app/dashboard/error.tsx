"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Dashboard Error Boundary — catches runtime errors in the vendor dashboard
 * and shows a friendly recovery screen instead of a blank white page.
 *
 * INSTRUMENTED: Logs the FULL exception details to identify the exact
 * root cause of the "Application error: A client-side exception" crash.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // ── FULL EXCEPTION CAPTURE ──
    console.error("[dashboard/error] ═══════════════════════════════════════");
    console.error("[dashboard/error] CRASH CAPTURED — full details:");
    console.error("[dashboard/error] error.name:", error?.name);
    console.error("[dashboard/error] error.message:", error?.message);
    console.error("[dashboard/error] error.digest:", error?.digest);
    console.error("[dashboard/error] error.stack:", error?.stack);
    console.error("[dashboard/error] error.cause:", error?.cause);

    // Log to server for production debugging
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "dashboard_crash",
        properties: {
          name: error?.name,
          message: error?.message?.slice(0, 500),
          digest: error?.digest,
          stack: error?.stack?.slice(0, 1000),
          url: typeof window !== "undefined" ? window.location.href : "unknown",
          timestamp: new Date().toISOString(),
        },
      }),
    }).catch(() => {});
    console.error("[dashboard/error] ═══════════════════════════════════════");
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
        <AlertTriangle className="size-8 text-amber-600 dark:text-amber-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold">Something went wrong</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          An unexpected error occurred while loading your dashboard. Your data is safe — try refreshing.
        </p>
        {/* Show the error message for debugging */}
        <p className="mt-2 rounded-lg bg-muted p-2 text-xs font-mono text-muted-foreground">
          {error?.message || "Unknown error"}
        </p>
      </div>
      <Button onClick={reset} className="gap-2">
        <RefreshCw className="size-4" /> Try again
      </Button>
    </div>
  );
}
