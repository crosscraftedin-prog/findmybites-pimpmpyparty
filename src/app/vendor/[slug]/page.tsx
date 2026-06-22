"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useMarketplace } from "@/lib/store";
import { Loader2 } from "lucide-react";

/**
 * /vendor/[slug] — redirects to homepage and opens the vendor modal.
 *
 * The vendor profile is displayed as a modal overlay on the homepage
 * (VendorModal component). This route ensures /vendor/[slug] links work
 * from external sources (dashboard, SEO pages, share links) by redirecting
 * to the homepage with the vendor slug pre-selected.
 */
export default function VendorProfileRedirect() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const openVendor = useMarketplace((s) => s.openVendor);

  React.useEffect(() => {
    if (params.slug) {
      // Open the vendor modal on the homepage
      openVendor(params.slug);
      // Redirect to homepage (modal will be open)
      router.push("/");
    }
  }, [params.slug, openVendor, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}
