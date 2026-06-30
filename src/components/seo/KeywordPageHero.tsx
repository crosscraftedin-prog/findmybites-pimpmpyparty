"use client";

import * as React from "react";
import { Search, ShieldCheck, BadgeCheck, MessageCircle, Sparkles, ArrowRight } from "lucide-react";

interface KeywordPageHeroProps {
  h1: string;
  subtitle: string;
  location: string;
  searchPlaceholder: string;
  ecoColor: string;
}

const TRUST_BADGES = [
  { icon: BadgeCheck, label: "Verified vendors" },
  { icon: MessageCircle, label: "Free to enquire" },
  { icon: ShieldCheck, label: "No commission" },
  { icon: Sparkles, label: "Direct contact" },
];

/**
 * Hero section for keyword landing pages. Renders the H1, a keyword-rich
 * subtitle, a search bar (scrolls to the vendor results), and a row of
 * trust badges. Client component because of the form interaction.
 */
export function KeywordPageHero({
  h1,
  subtitle,
  location,
  searchPlaceholder,
  ecoColor,
}: KeywordPageHeroProps) {
  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    document.getElementById("vendors")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      className="relative overflow-hidden border-b border-black/10"
      style={{ background: `linear-gradient(135deg, ${ecoColor}14, ${ecoColor}08)` }}
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <p
          className="text-[12px] font-semibold uppercase tracking-wide"
          style={{ color: ecoColor }}
        >
          FindMyBites · {location}
        </p>
        <h1 className="mt-2 max-w-3xl text-[32px] font-extrabold leading-[1.1] tracking-tight text-black sm:text-[42px] lg:text-[50px]">
          {h1}
        </h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-black/60 sm:text-[18px]">
          {subtitle}
        </p>

        {/* Search bar */}
        <form onSubmit={onSearch} className="mt-7 flex flex-col gap-3 sm:flex-row sm:max-w-xl">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-black/40" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="h-14 w-full rounded-full border border-black/15 bg-white pl-12 pr-4 text-sm font-medium text-black shadow-sm placeholder:text-black/40 focus:outline-none focus:ring-2"
              style={{ ["--tw-ring-color" as any]: `${ecoColor}55` }}
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
            style={{ background: ecoColor }}
          >
            Find Cake Makers
            <ArrowRight className="size-4" />
          </button>
        </form>

        {/* Trust badges */}
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
          {TRUST_BADGES.map((b) => {
            const Icon = b.icon;
            return (
              <span
                key={b.label}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-black/70"
              >
                <Icon className="size-4" style={{ color: ecoColor }} />
                {b.label}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
