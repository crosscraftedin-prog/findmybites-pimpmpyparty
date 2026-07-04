import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, ChevronRight, Sparkles, ShieldCheck } from "lucide-react";
import {
  type KeywordPage,
  fetchKeywordVendors,
  buildKeywordJsonLd,
  titleCase,
} from "@/lib/keyword-pages";

/**
 * Server-rendered keyword landing page. Renders JSON-LD structured data,
 * a keyword-optimised H1, intro copy, matching vendor results, an FAQ
 * section (also emitted as FAQPage schema), related searches, and links
 * to the same keyword in other cities.
 *
 * SSR so Google sees the full content in the initial HTML.
 */
export async function KeywordLanding({ page }: { page: KeywordPage }) {
  const { vendors, total } = await fetchKeywordVendors(page);
  const jsonLd = buildKeywordJsonLd(page, vendors);

  const ecoLabel =
    page.ecosystem === "FINDMYBITES" ? "FindMyBites" : "PimpMyParty";
  const ecoColor = page.ecosystem === "FINDMYBITES" ? "#D85A30" : "#7F77DD";
  const ecoTint = page.ecosystem === "FINDMYBITES" ? "#FAECE7" : "#EEEDFE";
  const ecoSlug =
    page.ecosystem === "FINDMYBITES" ? "findmybites" : "pimpmyparty";

  const intro = `Looking for ${page.keyword.toLowerCase()} in ${page.location}? ${ecoLabel} connects you with the best ${page.keyword.toLowerCase()} professionals in ${page.location}. Browse verified vendors, compare prices, and book directly — no commission.`;

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
          <Link href="/" className="transition-colors hover:text-black">Home</Link>
          <ChevronRight className="size-3 text-black/30" />
          <Link href={`/${ecoSlug}`} className="transition-colors hover:text-black">{ecoLabel}</Link>
          <ChevronRight className="size-3 text-black/30" />
          <span style={{ color: ecoColor, fontWeight: 500 }}>
            {page.keyword} in {page.location}
          </span>
        </div>
      </nav>

      {/* Header */}
      <header className="border-b border-black/10 bg-white px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <p
            className="text-[12px] font-medium uppercase tracking-wide"
            style={{ color: ecoColor }}
          >
            {ecoLabel}
          </p>
          <h1 className="mt-1 text-[28px] font-bold tracking-tight sm:text-[34px]">
            Best {page.keyword} in {page.location}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-black/60">
            {intro}
          </p>
          <p className="mt-2 text-[13px] font-medium" style={{ color: ecoColor }}>
            {total > 0
              ? `${total} verified ${total === 1 ? "vendor" : "vendors"} found`
              : "Be the first to list your business here"}
          </p>
        </div>
      </header>

      {/* Vendor results */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        {vendors.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((v) => (
              <KeywordVendorCard
                key={v.id}
                vendor={v}
                ecoColor={ecoColor}
                ecoTint={ecoTint}
                keyword={page.keyword}
                location={page.location}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-black/15 bg-white py-16 text-center">
            <MapPin className="mx-auto size-10 text-black/20" />
            <p className="mt-3 text-[15px] font-medium">
              No {page.keyword.toLowerCase()} listed in {page.location} yet
            </p>
            <p className="mt-1 text-[13px] text-black/40">
              Be the first to list your {page.keyword.toLowerCase()} business in {page.location}.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg px-4 py-2 text-[13px] font-medium text-white"
              style={{ background: ecoColor }}
            >
              List your business — free
            </Link>
          </div>
        )}

        {/* FAQ section */}
        <section className="mt-12">
          <h2 className="text-[22px] font-bold tracking-tight">
            {page.keyword} in {page.location} — Frequently Asked Questions
          </h2>
          <div className="mt-4 space-y-3">
            {page.faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-black/10 bg-white p-4 open:shadow-sm"
              >
                <summary className="flex cursor-pointer items-center justify-between text-[15px] font-semibold text-black/80 list-none">
                  {faq.q}
                  <ChevronRight className="size-4 shrink-0 text-black/40 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-[14px] leading-relaxed text-black/60">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Related searches */}
        {page.related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[18px] font-bold">
              Also popular in {page.location}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {page.related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/${r.slug}`}
                  className="rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] font-medium transition-colors hover:bg-black/5"
                >
                  {r.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* City links */}
        {page.otherCities.length > 0 && (
          <section className="mt-8">
            <h2 className="text-[18px] font-bold">
              Find {page.keyword} in other cities
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {page.otherCities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/${c.slug}`}
                  className="rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] font-medium transition-colors hover:bg-black/5"
                >
                  {page.keyword} in {c.label}
                </Link>
              ))}
              <Link
                href={`/${ecoSlug}`}
                className="rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] font-medium transition-colors hover:bg-black/5"
              >
                All cities →
              </Link>
            </div>
          </section>
        )}

        {/* Trust strip */}
        <section className="mt-10 rounded-xl border border-black/10 bg-white p-6">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center text-[13px] text-black/60">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4" style={{ color: ecoColor }} />
              All vendors verified
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-4" style={{ color: ecoColor }} />
              Zero commission
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="size-4" style={{ color: ecoColor }} />
              Real customer reviews
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}

function KeywordVendorCard({
  vendor,
  ecoColor,
  ecoTint,
  keyword,
  location,
}: {
  vendor: {
    id: string;
    name: string;
    slug: string;
    city: string;
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
  };
  ecoColor: string;
  ecoTint: string;
  keyword: string;
  location: string;
}) {
  const symbol =
    ({ USD: "$", GBP: "£", AED: "AED", INR: "₹", EUR: "€" } as Record<string, string>)[
      vendor.currency
    ] ?? vendor.currency ?? "$";

  return (
    <Link
      href={`/vendor/${vendor.slug}`}
      className="group overflow-hidden rounded-xl border border-black/10 bg-white transition-all hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {vendor.heroImage ? (
          <Image
            src={vendor.heroImage}
            alt={`${vendor.name} — ${keyword} in ${location}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
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
      <div className="p-3">
        <div className="flex items-center gap-1">
          <h3 className="truncate text-[14px] font-bold">{vendor.name}</h3>
          {vendor.verified && (
            <span className="shrink-0 text-[10px]" style={{ color: ecoColor }}>✓</span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[12px] text-black/50">{vendor.tagline || keyword}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px]">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{vendor.rating.toFixed(1)}</span>
            <span className="text-black/40">({vendor.reviewCount})</span>
          </span>
          <span className="flex items-center gap-0.5 text-[11px] text-black/50">
            <MapPin className="size-3" />
            {titleCase(vendor.city)}
          </span>
        </div>
        {vendor.basePrice > 0 && (
          <p className="mt-1.5 text-[12px] font-bold" style={{ color: ecoColor }}>
            from {symbol}
            {vendor.basePrice.toLocaleString("en-US")}
          </p>
        )}
      </div>
    </Link>
  );
}
