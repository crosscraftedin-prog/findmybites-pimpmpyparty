import { Loader2 } from "lucide-react";

/**
 * Root loading.tsx — shown while any page-level server component is loading.
 * Provides immediate visual feedback instead of a blank screen.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}
