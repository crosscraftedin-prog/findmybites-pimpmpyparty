"use client";

import Link from "next/link";
import {
  UtensilsCrossed,
  PartyPopper,
  Globe2,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";

const COLUMNS = [
  {
    title: "FindMyBites",
    links: [
      "Bakers & Bakeries",
      "Catering Services",
      "Dessert Specialists",
      "Cake Artists",
      "Food Trucks",
      "Private Chefs",
    ],
  },
  {
    title: "PimpMyParty",
    links: [
      "Event Planners",
      "Decorators & Stylists",
      "Entertainers",
      "DJs & Music",
      "Photographers",
      "Venues & Spaces",
    ],
  },
  {
    title: "Company",
    links: ["About us", "How it works", "Careers", "Press", "Blog", "Contact"],
  },
  {
    title: "Support",
    links: [
      "Help center",
      "Trust & safety",
      "Vendor guidelines",
      "Cancellation policy",
      "Terms",
      "Privacy",
    ],
  },
];

const REGIONS = [
  "North America",
  "South America",
  "Europe",
  "Middle East",
  "Africa",
  "Asia",
  "Oceania",
];

const SOCIAL = [Instagram, Twitter, Facebook, Youtube];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      {/* CTA strip */}
      <div className="border-b border-border bg-gradient-to-r from-amber-500/5 via-fuchsia-500/5 to-purple-500/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:px-6 lg:flex-row lg:text-left lg:px-8">
          <div>
            <h3 className="text-xl font-bold tracking-tight">
              Ready to grow your business globally?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Join thousands of food artisans and party pros on the world&apos;s
              dual marketplace.
            </p>
          </div>
          <Link
            href="#top"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-sm transition-transform hover:scale-105"
          >
            <Sparkles className="size-4" />
            List your business — free
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 font-bold">
              <span className="relative flex items-center gap-1">
                <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                  <UtensilsCrossed className="size-4" />
                </span>
                <span className="grid size-8 -ml-2 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white ring-2 ring-background">
                  <PartyPopper className="size-4" />
                </span>
              </span>
              <span className="text-sm leading-none">
                FindMyBites
                <span className="mx-1 text-muted-foreground">×</span>
                PimpMyParty
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The world&apos;s dual marketplace for food artisans and party
              professionals. Discover, connect and book verified vendors across
              the globe.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SOCIAL.map((Icon, i) => (
                <Link
                  key={i}
                  href="#top"
                  aria-label="social link"
                  className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-brand hover:text-brand"
                >
                  <Icon className="size-4" />
                </Link>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link
                      href="#explore"
                      className="text-sm text-muted-foreground transition-colors hover:text-brand"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Global regions */}
        <div className="mt-10 border-t border-border pt-8">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-muted-foreground">
            <Globe2 className="size-4 text-brand" />
            <span className="font-semibold text-foreground">Global presence:</span>
            {REGIONS.map((r, i) => (
              <span key={r} className="flex items-center gap-2">
                <span className="hover:text-brand">{r}</span>
                {i < REGIONS.length - 1 && (
                  <span className="text-border">•</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} FindMyBites × PimpMyParty. All rights
            reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <Mail className="size-3.5" /> hello@findmybites.party
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" /> Worldwide
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
