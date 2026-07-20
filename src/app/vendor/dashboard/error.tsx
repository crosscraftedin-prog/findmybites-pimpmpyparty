"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Vendor Dashboard Error Boundary — catches runtime errors in the vendor
 * dashboard and shows a friendly recovery screen.
 */
export default function VendorDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[vendor-dashboard/error]", error?.message, error?.digest);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
        <AlertTriangle className="size-8 text-amber-600 dark:text-amber-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold">Dashboard Error</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          An error occurred while loading your dashboard. Your data is safe — try refreshing.
        </p>
      </div>
      <Button onClick={reset} className="gap-2">
        <RefreshCw className="size-4" /> Try again
      </Button>
    </div>
  );
}
