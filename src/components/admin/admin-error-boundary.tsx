"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary that catches render errors and shows a fallback UI
 * instead of a white screen. Used to wrap the admin panel content.
 */
export class AdminErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[AdminErrorBoundary] Render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-red-500/10">
            <AlertCircle className="size-6 text-red-500" />
          </div>
          <p className="mt-3 text-sm font-medium">Something went wrong</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {this.state.error?.message || "An unexpected error occurred while rendering this section."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            <RefreshCw className="size-3.5" />
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
