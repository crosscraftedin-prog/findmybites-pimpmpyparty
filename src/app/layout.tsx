import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/lib/providers";
import { EcosystemSync } from "@/components/marketplace/ecosystem-sync";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { ErrorMonitoring } from "@/components/analytics/error-monitoring";

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
        </Providers>
      </body>
    </html>
  );
}
