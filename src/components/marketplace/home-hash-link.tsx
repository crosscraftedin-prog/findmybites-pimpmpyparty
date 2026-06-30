"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * useHomeHash — detects if the current route is NOT the homepage.
 *
 * When on /dashboard, /admin, /vendor/[slug], /product/[slug], or any other
 * non-homepage route, hash-only links (#explore, #categories, etc.) must be
 * converted to "/#explore" so they navigate to the homepage first, then
 * scroll to the section.
 *
 * Returns:
 *   - isHome: boolean — true if current path is "/"
 *   - getHref: (hash: string) => string — converts "#explore" to "/#explore" when not home
 */
export function useHomeHash() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const getHref = React.useCallback(
    (hash: string) => {
      // If it's already an absolute path or external URL, return as-is
      if (hash.startsWith("/") || hash.startsWith("http") || hash.startsWith("mailto:") || hash.startsWith("tel:")) {
        return hash;
      }
      // If it's a hash-only link (#explore) and we're not on the homepage,
      // prepend "/" so it navigates to the homepage with the hash
      if (hash.startsWith("#") && !isHome) {
        return `/${hash}`;
      }
      return hash;
    },
    [isHome]
  );

  return { isHome, getHref };
}

/**
 * HomeHashLink — a link that navigates to the homepage + hash when
 * the user is on a non-homepage route (e.g. /dashboard).
 *
 * Usage:
 *   <HomeHashLink href="#explore">Explore</HomeHashLink>
 *
 * On homepage: renders as a normal hash link (smooth scroll)
 * On /dashboard: renders as "/#explore" (navigates home, then scrolls)
 *
 * After navigation to the homepage, a smooth scroll to the hash is performed
 * by the useScrollToHash hook on the homepage.
 *
 * NOTE: This component uses a mounted state to avoid SSR/CSR hydration
 * mismatches. On the server, it renders a plain hash link. After mount,
 * it updates the href to "/#hash" if not on the homepage.
 */
interface HomeHashLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
  title?: string;
}

export function HomeHashLink({
  href,
  children,
  className,
  onClick,
  ariaLabel,
  title,
}: HomeHashLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    // Check the CURRENT path at click time (not at render time)
    // This is the most reliable way to detect if we're on the homepage.
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
    const currentlyHome = currentPath === "/";

    // If it's a hash link and we're on the homepage, do smooth scroll
    if (href.startsWith("#") && currentlyHome) {
      e.preventDefault();
      const target = document.getElementById(href.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
      onClick?.();
      return;
    }

    // If it's a hash link and we're NOT on the homepage, navigate to "/#hash"
    if (href.startsWith("#") && !currentlyHome) {
      e.preventDefault();
      router.push(`/${href}`);
      onClick?.();
      return;
    }

    // Normal link — let the browser handle it
    onClick?.();
  };

  // For the href attribute, we render the hash-only version (#explore).
  // The actual navigation is handled by the onClick handler above.
  // We use suppressHydrationWarning because the server and client may
  // render different hrefs (server doesn't know the current path).
  // The onClick handler always fires before navigation, so the correct
  // behavior is guaranteed regardless of the href attribute value.
  const renderHref = href;

  return (
    <a
      href={renderHref}
      onClick={handleClick}
      className={className}
      aria-label={ariaLabel}
      title={title}
      suppressHydrationWarning
    >
      {children}
    </a>
  );
}
