"use client";

import * as React from "react";
import Script from "next/script";

/**
 * Google Analytics 4 component.
 * Only loads in production (NODE_ENV === 'production') to avoid
 * tracking dev traffic.
 *
 * Set NEXT_PUBLIC_GA_ID in .env to enable (e.g. G-XXXXXXXXXX)
 */
export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  if (!gaId || process.env.NODE_ENV !== "production") {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}

/**
 * Track a custom event in GA4.
 * Call from client components: trackEvent('vendor_signup', { ecosystem: 'FINDMYBITES' })
 */
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;
  if (!(window as any).gtag) return;
  (window as any).gtag("event", eventName, params);
}

/**
 * Track page views (for client-side navigation).
 */
export function trackPageView(path: string) {
  if (typeof window === "undefined") return;
  if (!(window as any).gtag) return;
  (window as any).gtag("config", process.env.NEXT_PUBLIC_GA_ID, {
    page_path: path,
  });
}
