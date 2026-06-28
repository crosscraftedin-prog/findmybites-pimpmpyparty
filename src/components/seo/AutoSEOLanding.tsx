import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  MapPin,
  ChevronRight,
  Search,
  BadgeCheck,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Store,
  ArrowRight,
} from "lucide-react";
import { SiteFooter } from "@/components/marketplace/site-footer";
import {
  type SEOPage,
  type SEOCity,
  type SEOVendor,
  type SEOCategory,
  titleCase,
} from "@/lib/seo-data";
import {
  type FAQ,
  type PriceRow,
  generateFAQs,
  generatePriceGuide,
} from "@/lib/seo-content";

const ECO_COLOR_FOOD = "#D85A30";
const ECO_COLOR_PARTY = "#7F77DD";
const ECO_TINT_FOOD = "#FAECE7";
const ECO_TINT_PARTY = "#EEEDFE";

interface LandingProps {
  /** "keyword" | "city" | "cityCategory" — controls H1 + intro wording */
  variant: "keyword" | "city" | "cityCategory";
  page?: SEOPage;
  city?: SEOCity;
  vendors: SEOVendor[];
  total: number;
  related: { label: string; slug: string }[];
  cityCategories?: SEOCategory[];
  jsonLd: Record<string, any>[];
  breadcrumbs: { label: string; url: string }[];
}

const TRUST_BADGES = [
  { icon: BadgeCheck, label: "Verified vendors" },
  { icon: MessageCircle, label: "Free to enquire" },
  { icon: ShieldCheck, label: "No commission" },
  { icon: Sparkles, label: "Direct contact" },
];

const ABOUT_BENEFITS = [
  { icon: Search, title: "Browse & Compare", desc: "Explore verified vendors, view galleries, and compare prices side by side — all in one place." },
  { icon: MessageCircle, title: "Contact Directly", desc: "Message vendors straight on WhatsApp. No middleman, no commission — just direct conversations." },
  { icon: BadgeCheck, title: "Verified Vendors", desc: "Every vendor is reviewed by our team before going live. Look for the verified badge." },
];

const HOW_IT_WORKS = [
  { icon: Search, step: "1", title: "Browse vendors", desc: "Explore verified vendors in your city" },
  { icon: MessageCircle, step: "2", title: "Send a free enquiry", desc: "Contact vendors directly via WhatsApp" },
  { icon: Sparkles, step: "3", title: "Book & celebrate", desc: "Agree terms and enjoy your event" },
];

/**
 * Shared SSR page assembly for all auto-generated SEO pages (keyword, city,
 * city/category). Renders JSON-LD, breadcrumbs, hero, vendor results,
 * about, price guide, how-it-works, FAQ, related searches, vendor CTA,
 * and the site footer.
 */
export function AutoSEOLanding({
  variant,
  page,
  city,
  vendors,
  total,
  related,
  cityCategories,
  jsonLd,
  breadcrumbs,
}: LandingProps) {
  // Derive display values based on variant
  const eco = page?.ecosystem ?? city?.continent ?? "FINDMYBITES";
  const ecoColor = eco === "PIMPMYPARTY" ? ECO_COLOR_PARTY : ECO_COLOR_FOOD;
  const ecoTint = eco === "PIMPMYPARTY" ? ECO_TINT_PARTY : ECO_TINT_FOOD;
  const ecoLabel = eco === "PIMPMYPARTY" ? "PimpMyParty" : "FindMyBites";

  let h1: string;
  let subtitle: string;
  let searchPlaceholder: string;
  let locationName: string;
  let categoryLabel: string;
  let categorySlug: string;
  let countryCode: string;

  if (variant === "city" && city) {
    locationName = titleCase(city.city);
    categoryLabel = "Vendors";
    categorySlug = "";
    countryCode = city.countryCode;
    h1 = `Top Vendors in ${locationName}`;
    subtitle = `Discover ${total > 0 ? total : ""} verified food and event vendors in ${locationName}, ${city.country}. Browse, compare, and book directly — no commission.`;
    searchPlaceholder = `Search vendors in ${locationName}…`;
  } else if (page) {
    locationName = titleCase(page.city);
    categoryLabel = page.category;
    categorySlug = page.categorySlug;
    countryCode = page.countryCode;
    if (variant === "cityCategory") {
      h1 = `Best ${categoryLabel} in ${locationName}`;
      subtitle = `Find the best ${categoryLabel.toLowerCase()} in ${locationName}, ${page.country}. Browse verified vendors, compare prices, and enquire for free.`;
    } else {
      h1 = `${categoryLabel} in ${locationName}`;
      subtitle = `Looking for ${categoryLabel.toLowerCase()} in ${locationName}? ${ecoLabel} connects you with the best ${categoryLabel.toLowerCase()} in ${locationName}. Browse verified vendors, compare prices, and book directly — no commission.`;
    }
    searchPlaceholder = `Search ${categoryLabel.toLowerCase()} in ${locationName}…`;
  } else {
    // Fallback (shouldn't happen)
    h1 = "Find Vendors Near You";
    subtitle = "Browse verified vendors on FindMyBites.";
    searchPlaceholder = "Search vendors…";
    locationName = "your city";
    categoryLabel = "Vendors";
    categorySlug = "";
    countryCode = "AE";
  }

  const faqs: FAQ[] =
    page && variant !== "city"
      ? generateFAQs(categoryLabel, categorySlug, locationName, page.country, vendors)
      : generateFAQs(categoryLabel, categorySlug, locationName, "", vendors);

  const priceGuide: { currency: string; rows: PriceRow[] } | null =
    variant === "city"
      ? null
      : generatePriceGuide(categorySlug || "bakers-bakery", countryCode);

  const vendorSectionTitle =
    variant === "city"
      ? `Top vendors in ${locationName}`
      : variant === "cityCategory"
        ? `Top ${categoryLabel} in ${locationName}`
        : `Top ${categoryLabel} in ${locationName}`;

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F6F2]">
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
          {breadcrumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="size-3 text-black/30" />}
              {i === breadcrumbs.length - 1 ? (
                <span style={{ color: ecoColor, fontWeight: 500 }}>{c.label}</span>
              ) : (
                <Link href={c.url.replace("https://www.findmybites.com", "")} className="transition-colors hover:text-black">
                  {c.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-black/10"
        style={{ background: `linear-gradient(135deg, ${ecoColor}14, ${ecoColor}08)` }}
      >
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: ecoColor }}>
            {ecoLabel} · {locationName}
          </p>
          <h1 className="mt-2 max-w-3xl text-[32px] font-extrabold leading-[1.1] tracking-tight text-black sm:text-[42px] lg:text-[50px]">
            {h1}
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-black/60 sm:text-[18px]">
            {subtitle}
          </p>

          {/* Search bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              document.getElementById("vendors")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="mt-7 flex flex-col gap-3 sm:flex-row sm:max-w-xl"
          >
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
              Find Vendors
              <ArrowRight className="size-4" />
            </button>
          </form>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
            {TRUST_BADGES.map((b) => {
              const Icon = b.icon;
              return (
                <span key={b.label} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-black/70">
                  <Icon className="size-4" style={{ color: ecoColor }} />
                  {b.label}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* Vendor results */}
      <main className="flex-1">
        <section id="vendors" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[24px] font-bold tracking-tight sm:text-[28px]">
                {vendorSectionTitle}
              </h2>
              {total > 0 && (
                <p className="mt-2 text-[14px] text-black/60">
                  {total} verified {total === 1 ? "vendor" : "vendors"} found in {locationName}
                </p>
              )}
            </div>
            {total > 0 && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{ background: `${ecoColor}14`, color: ecoColor }}
              >
                <BadgeCheck className="size-3.5" />
                {total} verified
              </span>
            )}
          </div>

          {vendors.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vendors.map((v) => (
                <AutoVendorCard key={v.id} vendor={v} ecoColor={ecoColor} ecoTint={ecoTint} keyword={categoryLabel} location={locationName} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-black/15 bg-white py-16 text-center">
              <MapPin className="mx-auto size-10 text-black/20" />
              <p className="mt-3 text-[16px] font-semibold">
                Be the first {categoryLabel.toLowerCase()} vendor in {locationName} on FindMyBites
              </p>
              <p className="mx-auto mt-1 max-w-md text-[13px] text-black/40">
                We don&apos;t have any {categoryLabel.toLowerCase()} listed in {locationName} yet. List your business free and get discovered by customers.
              </p>
              <Link
                href="/"
                className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[13px] font-semibold text-white"
                style={{ background: ecoColor }}
              >
                List Your Business →
              </Link>
            </div>
          )}

          {/* City category chips (city page only) */}
          {variant === "city" && cityCategories && cityCategories.length > 0 && (
            <div className="mt-10">
              <h2 className="text-[18px] font-bold">Popular categories in {locationName}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {cityCategories.map((c) => (
                  <Link
                    key={c.categorySlug}
                    href={`/${c.categorySlug}-${city?.citySlug}`}
                    className="rounded-lg border border-black/10 bg-white px-4 py-2 text-[13px] font-medium text-black/70 transition-colors hover:bg-black/[0.04]"
                  >
                    {c.categoryLabel} in {locationName}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* About / why FindMyBites */}
        <section className="border-y border-black/10 bg-white py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-[24px] font-bold tracking-tight sm:text-[28px]">
              Why FindMyBites for {categoryLabel.toLowerCase()} in {locationName}?
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {ABOUT_BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="rounded-2xl border border-black/10 bg-[#F7F6F2] p-6 text-center">
                    <div className="mx-auto grid size-12 place-items-center rounded-full" style={{ background: ecoTint }}>
                      <Icon className="size-6" style={{ color: ecoColor }} />
                    </div>
                    <h3 className="mt-4 text-[16px] font-bold">{b.title}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-black/60">{b.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Price guide (keyword + cityCategory only) */}
        {priceGuide && (
          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="text-[24px] font-bold tracking-tight sm:text-[28px]">
              How much do {categoryLabel.toLowerCase()} cost in {locationName}?
            </h2>
            <p className="mt-2 text-[15px] text-black/60">
              Typical price ranges across {locationName}. All amounts in {priceGuide.currency}.
            </p>
            <div className="mt-6 overflow-x-auto rounded-xl border border-black/10 bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 bg-black/[0.02]">
                    <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-black/50">Type</th>
                    <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-black/50">Price Range</th>
                  </tr>
                </thead>
                <tbody>
                  {priceGuide.rows.map((row, i) => (
                    <tr key={row.type} className={i < priceGuide.rows.length - 1 ? "border-b border-black/5" : ""}>
                      <td className="px-4 py-3 font-medium text-black/80">{row.type}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-md px-2 py-0.5 text-[13px] font-bold" style={{ background: `${ecoColor}14`, color: ecoColor }}>
                          {row.range}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[12px] text-black/40">
              Note: Prices vary by vendor, size, and complexity. Contact vendors directly for exact quotes.
            </p>
          </section>
        )}

        {/* How it works */}
        <section className="bg-white py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-[24px] font-bold tracking-tight sm:text-[28px]">How it works</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {HOW_IT_WORKS.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.step} className="text-center">
                    <div className="relative mx-auto grid size-14 place-items-center rounded-full border-2" style={{ borderColor: `${ecoColor}40`, background: ecoTint }}>
                      <Icon className="size-6" style={{ color: ecoColor }} />
                      <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: ecoColor }}>
                        {s.step}
                      </span>
                    </div>
                    <h3 className="mt-3 text-[15px] font-bold">{s.title}</h3>
                    <p className="mt-1 text-[13px] text-black/60">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-black/[0.02] py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-[24px] font-bold tracking-tight sm:text-[28px]">
              {categoryLabel} in {locationName} — Frequently Asked Questions
            </h2>
            <div className="mt-6 space-y-3">
              {faqs.map((faq) => (
                <details key={faq.q} className="group rounded-xl border border-black/10 bg-white p-4 open:shadow-sm">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 text-[15px] font-semibold text-black/80 list-none">
                    {faq.q}
                    <ChevronRight className="size-4 shrink-0 text-black/40 transition-transform group-open:rotate-90" style={{ color: ecoColor }} />
                  </summary>
                  <p className="mt-3 text-[14px] leading-relaxed text-black/60">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Related searches */}
        {related.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="text-[20px] font-bold tracking-tight">Also popular in {locationName}</h2>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {related.map((l) => (
                <Link
                  key={l.slug}
                  href={`/${l.slug}`}
                  className="inline-flex items-center rounded-lg border border-black/10 bg-white px-4 py-2 text-[13px] font-medium text-black/70 transition-colors hover:bg-black/[0.04]"
                  style={{ borderColor: `${ecoColor}33` }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Vendor CTA */}
        <section className="py-14" style={{ background: `linear-gradient(135deg, ${ecoColor}12, ${ecoColor}06)` }}>
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide" style={{ background: `${ecoColor}1f`, color: ecoColor }}>
              <Store className="size-3.5" />
              For vendors
            </span>
            <h2 className="mt-4 text-[26px] font-extrabold tracking-tight sm:text-[32px]">
              Are you a {categoryLabel.toLowerCase()} vendor in {locationName}?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[15px] text-black/60">
              Join hundreds of vendors already on FindMyBites. List your business free, get discovered by customers across {locationName}, and keep 100% of your bookings — zero commission.
            </p>
            <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.03]" style={{ background: ecoColor }}>
              List your business free
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function AutoVendorCard({
  vendor,
  ecoColor,
  ecoTint,
  keyword,
  location,
}: {
  vendor: SEOVendor;
  ecoColor: string;
  ecoTint: string;
  keyword: string;
  location: string;
}) {
  const symbol =
    ({ USD: "$", GBP: "£", AED: "AED", INR: "₹", EUR: "€", SAR: "SAR", NGN: "₦", AUD: "A$" } as Record<string, string>)[
      vendor.currency
    ] ?? vendor.currency ?? "AED";

  return (
    <Link href={`/vendor/${vendor.slug}`} className="group overflow-hidden rounded-xl border border-black/10 bg-white transition-all hover:shadow-md">
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
          <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: ecoColor }}>
            ★ Featured
          </span>
        )}
        {vendor.verified && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-bold" style={{ color: ecoColor }}>
            <ShieldCheck className="size-3" /> Verified
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate text-[14px] font-bold">{vendor.name}</h3>
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
            from {symbol} {vendor.basePrice.toLocaleString("en-US")}
          </p>
        )}
      </div>
    </Link>
  );
}
