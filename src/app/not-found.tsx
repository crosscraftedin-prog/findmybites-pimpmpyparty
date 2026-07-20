import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Root not-found page — shown when a user visits a URL that doesn't exist.
 * Without this file, Next.js shows a default 404 page with minimal styling.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-6xl font-extrabold text-muted-foreground/30">404</div>
      <div>
        <h2 className="text-xl font-bold">Page not found</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
