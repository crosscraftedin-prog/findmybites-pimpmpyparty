import type { Metadata, Viewport } from "next";
import * as React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/lib/providers";
import { EcosystemSync } from "@/components/marketplace/ecosystem-sync";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { ErrorMonitoring } from "@/components/analytics/error-monitoring";
import { MobileBottomNav } from "@/components/marketplace/mobile-bottom-nav";

// Lazy-load the AI chat widget so it doesn't bloat the initial bundle.
const AIChatWidget = React.lazy(() =>
  import("@/components/ai-chat/ai-chat-widget").then((m) => ({ default: m.AIChatWidget }))
);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#D85A30",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.findmybites.com"),
  title: "FindMyBites × PimpMyParty — Global Food & Party Marketplace",
  description:
    "The world's dual marketplace for food artisans, bakers, caterers, party planners, decorators and entertainers. Discover and book verified vendors across 6 continents.",
  keywords: [
    "FindMyBites",
    "PimpMyParty",
    "food marketplace",
    "catering",
    "bakers",
    "cake artists",
    "event planners",
    "party decorators",
    "DJs",
    "global marketplace",
  ],
  authors: [{ name: "FindMyBites × PimpMyParty" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FindMyBites",
  },
  openGraph: {
    title: "FindMyBites × PimpMyParty — Global Food & Party Marketplace",
    description:
      "Discover and book the world's best food artisans and party service providers across 6 continents.",
    type: "website",
    url: "https://www.findmybites.com",
    siteName: "FindMyBites × PimpMyParty",
    images: [
      {
        url: "/og-image.png",
        width: 1344,
        height: 768,
        alt: "FindMyBites × PimpMyParty — Global Food & Party Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FindMyBites × PimpMyParty",
    description:
      "Discover and book the world's best food artisans and party service providers.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Service worker registration with stale-cache cleanup.
         * On each load: register the latest SW, then immediately check for
         * updates. If a new SW is found, it takes control via skipWaiting().
         * The SW itself (v4) no longer intercepts /_next/static/ chunks,
         * fixing ChunkLoadError after Vercel deploys. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if('serviceWorker' in navigator){
                window.addEventListener('load', function(){
                  navigator.serviceWorker.register('/sw.js').then(function(reg){
                    // Force update check on every page load
                    reg.update();
                  }).catch(function(){});
                  // If a new SW takes control, reload once to get fresh chunks
                  var refreshing = false;
                  navigator.serviceWorker.addEventListener('controllerchange', function(){
                    if(!refreshing){
                      refreshing = true;
                      window.location.reload();
                    }
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:shadow-lg">
          Skip to content
        </a>
        <Providers>
          <EcosystemSync />
          <GoogleAnalytics />
          <ErrorMonitoring />
          {children}
          <MobileBottomNav />
          <Toaster />
          <SonnerToaster richColors position="top-center" />
          {/* AI Event Planner chatbot — floating button on every page */}
          <React.Suspense fallback={null}>
            <AIChatWidget />
          </React.Suspense>
        </Providers>
      </body>
    </html>
  );
}
