"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Root Error Boundary — catches runtime errors on any page that doesn't have
 * its own error.tsx. Shows a friendly recovery screen instead of a white page.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[root/error]", error?.message, error?.digest);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
        <AlertTriangle className="size-8 text-amber-600 dark:text-amber-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold">Something went wrong</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          An unexpected error occurred. Your data is safe — try refreshing the page.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="size-4" /> Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/" className="gap-2">
            <Home className="size-4" /> Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
