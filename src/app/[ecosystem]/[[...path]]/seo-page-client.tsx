"use client";

import * as React from "react";
import Link from "next/link";
import { Star, MapPin, ChevronRight, Search } from "lucide-react";
import type { SEOContext } from "@/lib/seo";
import type { Ecosystem } from "@/lib/types";
import { countryCodeToFlag, formatPrice } from "@/lib/format";
import { CURRENCY_SYMBOLS, CATEGORIES } from "@/lib/constants";

interface Vendor {
  id: string;
  name: string;
  slug: string;
  ecosystem: string;
  category: string;
  city: string;
  state: string | null;
  country: string;
  countryCode: string;
  rating: number;
  reviewCount: number;
  heroImage: string;
  tagline: string;
  basePrice: number;
  currency: string;
  whatsapp: string | null;
  featured: boolean;
  verified: boolean;
}

interface Props {
  ctx: SEOContext;
  vendors: Vendor[];
  vendorCount: number;
  breadcrumbs: { label: string; path: string }[];
  introContent: string;
  jsonLd: Record<string, any>[];
  relatedCategories: { id: string; label: string; ecosystem: string }[];
  relatedCities: { city: string; slug: string; count: number }[];
}

export function SeoPageClient({
  ctx,
  vendors,
  vendorCount,
  breadcrumbs,
  introContent,
  jsonLd,
  relatedCategories,
  relatedCities,
}: Props) {
  const ecoLabel = ctx.ecosystem === "FINDMYBITES" ? "FindMyBites" : "PimpMyParty";
  const ecoColor = ctx.ecosystem === "FINDMYBITES" ? "#D85A30" : "#7F77DD";
  const ecoTint = ctx.ecosystem === "FINDMYBITES" ? "#FAECE7" : "#EEEDFE";

  // Build H1
  const h1 = buildH1(ctx, vendorCount);

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      {/* JSON-LD structured data */}
      {jsonLd.map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}

      {/* Breadcrumbs */}
      <nav className="border-b border-black/10 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center gap-1 text-[12px] text-black/50">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="size-3 text-black/30" />}
              <Link
                href={crumb.path}
                className="transition-colors hover:text-black"
                style={i === breadcrumbs.length - 1 ? { color: ecoColor, fontWeight: 500 } : {}}
              >
                {crumb.label}
              </Link>
            </React.Fragment>
          ))}
        </div>
      </nav>

      {/* Header */}
      <header className="border-b border-black/10 bg-white px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-[12px] font-medium uppercase tracking-wide" style={{ color: ecoColor }}>
            {ecoLabel}
          </p>
          <h1 className="mt-1 text-[28px] font-bold tracking-tight">{h1}</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-black/60">
            {introContent}
          </p>
          {vendorCount > 0 && (
            <p className="mt-2 text-[13px] font-medium" style={{ color: ecoColor }}>
              {vendorCount} {vendorCount === 1 ? "vendor" : "vendors"} found
            </p>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Vendor grid */}
        {vendors.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((v) => (
              <VendorCard key={v.id} vendor={v} ecoColor={ecoColor} ecoTint={ecoTint} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-black/15 bg-white py-16 text-center">
            <MapPin className="mx-auto size-10 text-black/20" />
            <p className="mt-3 text-[15px] font-medium">No vendors found yet</p>
            <p className="mt-1 text-[13px] text-black/40">
              Be the first to list your business in this area.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg px-4 py-2 text-[13px] font-medium text-white"
              style={{ background: ecoColor }}
            >
              List your business
            </Link>
          </div>
        )}

        {/* Internal linking: Related categories */}
        {relatedCategories.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-[16px] font-bold">
              Popular Categories in {ctx.city?.replace(/-/g, " ")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {relatedCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${ctx.ecosystem === "FINDMYBITES" ? "findmybites" : "pimpmyparty"}/${ctx.country}/${ctx.city}/${cat.id}`}
                  className="rounded-lg border border-black/10 bg-white px-3 py-2 text-[12px] font-medium transition-colors hover:bg-black/5"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Internal linking: Related cities */}
        {relatedCities.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-[16px] font-bold">
              Popular Cities in {ctx.country?.replace(/-/g, " ")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {relatedCities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/${ctx.ecosystem === "FINDMYBITES" ? "findmybites" : "pimpmyparty"}/${ctx.country}/${c.slug}`}
                  className="rounded-lg border border-black/10 bg-white px-3 py-2 text-[12px] font-medium transition-colors hover:bg-black/5"
                >
                  {c.city} ({c.count})
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function VendorCard({ vendor, ecoColor, ecoTint }: { vendor: Vendor; ecoColor: string; ecoTint: string }) {
  const symbol = CURRENCY_SYMBOLS[vendor.currency as string] ?? vendor.currency ?? "$";

  return (
    <Link
      href={vendor?.slug ? `/vendor/${vendor.slug}` : "#"}
      className="group overflow-hidden rounded-xl border border-black/10 bg-white transition-all hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {vendor.heroImage ? (
          <img
            src={vendor.heroImage}
            alt={vendor.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center" style={{ background: ecoTint }}>
            <MapPin className="size-8" style={{ color: ecoColor }} />
          </div>
        )}
        {vendor.featured && (
          <span
            className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ background: ecoColor }}
          >
            ★ Featured
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-center gap-1">
          <h3 className="truncate text-[14px] font-bold">{vendor.name}</h3>
          {vendor.verified && (
            <span className="shrink-0 text-[10px]" style={{ color: ecoColor }}>✓</span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[12px] text-black/50">{vendor.tagline || vendor.category}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px]">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{vendor.rating.toFixed(1)}</span>
            <span className="text-black/40">({vendor.reviewCount})</span>
          </span>
          <span className="flex items-center gap-0.5 text-[11px] text-black/50">
            <MapPin className="size-3" />
            {vendor.city}
          </span>
        </div>
        {vendor.basePrice > 0 && (
          <p className="mt-1.5 text-[12px] font-bold" style={{ color: ecoColor }}>
            from {symbol}{vendor.basePrice.toLocaleString("en-US")}
          </p>
        )}
      </div>
    </Link>
  );
}

function buildH1(ctx: SEOContext, vendorCount: number): string {
  const ecoLabel = ctx.ecosystem === "FINDMYBITES" ? "FindMyBites" : "PimpMyParty";
  const cat = ctx.category ? getCategoryLabel(ctx.category) : null;
  const location = [ctx.city, ctx.state, ctx.country].filter(Boolean).map(s => s.replace(/-/g, " ")).join(", ");

  if (cat && ctx.city) {
    return `Best ${cat} in ${ctx.city.replace(/-/g, " ")}`;
  }
  if (ctx.city) {
    return `Top Vendors in ${ctx.city.replace(/-/g, " ")}`;
  }
  if (ctx.state) {
    return `${ecoLabel} Vendors in ${ctx.state.replace(/-/g, " ")}`;
  }
  if (ctx.country) {
    return `${ecoLabel} Vendors in ${ctx.country.replace(/-/g, " ")}`;
  }
  return `${ecoLabel} — Global Marketplace`;
}

function getCategoryLabel(slug: string): string | null {
  const cat = CATEGORIES.find((c) => c.id === slug);
  if (cat) return cat.label;
  // Try migrated
  return null;
}
