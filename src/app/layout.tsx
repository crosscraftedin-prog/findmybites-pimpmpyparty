import type { Metadata } from "next";
import * as React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/lib/providers";
import { EcosystemSync } from "@/components/marketplace/ecosystem-sync";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { ErrorMonitoring } from "@/components/analytics/error-monitoring";

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

export const metadata: Metadata = {
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
  themeColor: "#D85A30",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FindMyBites",
  },
  openGraph: {
    title: "FindMyBites × PimpMyParty",
    description:
      "Discover and book the world's best food artisans and party service providers.",
    type: "website",
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
        {/* Register service worker for PWA offline support */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          <EcosystemSync />
          <GoogleAnalytics />
          <ErrorMonitoring />
          {children}
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
