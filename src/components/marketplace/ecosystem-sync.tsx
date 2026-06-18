"use client";

import { useEffect } from "react";
import { useMarketplace } from "@/lib/store";

/**
 * Keeps the <html> element's `data-ecosystem` attribute in sync with the
 * active marketplace ecosystem so the brand color CSS variables switch.
 */
export function EcosystemSync() {
  const ecosystem = useMarketplace((s) => s.ecosystem);

  useEffect(() => {
    document.documentElement.setAttribute("data-ecosystem", ecosystem);
  }, [ecosystem]);

  return null;
}
