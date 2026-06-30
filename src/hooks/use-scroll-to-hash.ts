"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * useScrollToHash — scrolls to the element matching the URL hash on mount.
 *
 * Used on the homepage to handle incoming hash navigation from other routes
 * (e.g. /dashboard → /#explore). After the homepage loads, this hook waits
 * for the page to render, then smoothly scrolls to the target section.
 *
 * Also handles hash changes while already on the homepage (clicking nav links).
 */
export function useScrollToHash() {
  const pathname = usePathname();

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname !== "/") return;

    const scrollToHash = () => {
      const hash = window.location.hash;
      if (!hash) return;
      const target = document.getElementById(hash.slice(1));
      if (target) {
        // Small delay to ensure the page has rendered
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    };

    // Scroll on mount (incoming navigation with hash)
    scrollToHash();

    // Scroll on hash change (clicking nav links while on homepage)
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, [pathname]);
}
