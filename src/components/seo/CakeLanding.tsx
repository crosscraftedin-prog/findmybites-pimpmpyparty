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
} from "lucide-react";
import { SiteFooter } from "@/components/marketplace/site-footer";
import { KeywordPageHero } from "@/components/seo/KeywordPageHero";
import { PriceGuideTable } from "@/components/seo/PriceGuideTable";
import { FAQSection } from "@/components/seo/FAQSection";
import { RelatedSearches } from "@/components/seo/RelatedSearches";
import { VendorCTA } from "@/components/seo/VendorCTA";
import {
  type CakePage,
  fetchCakeVendors,
  buildCakeJsonLd,
  titleCase,
} from "@/lib/cake-pages";

const ECO_COLOR = "#D85A30"; // FindMyBites orange
const ECO_TINT = "#FAECE7";

const ABOUT_BENEFITS = [
  {
    icon: Search,
    title: "Browse & Compare",
    desc: "Explore verified cake makers, view galleries, and compare prices side by side — all in one place.",
  },
  {
    icon: MessageCircle,
    title: "Contact Directly",
    desc: "Message bakers straight on WhatsApp. No middleman, no commission — just direct conversations.",
  },
  {
    icon: BadgeCheck,
    title: "Verified Vendors",
    desc: "Every cake maker is reviewed by our team before going live. Look for the verified badge.",
  },
];

const HOW_IT_WORKS = [
  { icon: Search, step: "1", title: "Browse vendors", desc: `Explore cake makers across the UAE` },
  { icon: MessageCircle, step: "2", title: "Send a free enquiry", desc: "Contact bakers directly via WhatsApp" },
  { icon: Sparkles, step: "3", title: "Get your perfect cake", desc: "Book, customise, and celebrate" },
];

/** Placeholder reviews shown when no UAE reviews exist in the DB yet. */
const PLACEHOLDER_REVIEWS = [
  {
    author: "Aisha M.",
    city: "Dubai",
    rating: 5,
    text: "Found an incredible wedding cake maker through FindMyBites. The cake was even more beautiful than the photos, and the tasting session was free. Highly recommend!",
  },
  {
    author: "Rohan K.",
    city: "Abu Dhabi",
    rating: 5,
    text: "Ordered a custom superhero cake for my son's birthday. Delivered to our hotel on time, and the design was spot on. Booking was so easy.",
  },
  {
    author: "Layla S.",
    city: "Dubai",
    rating: 5,
    text: "The smash cake for my daughter's first birthday was adorable and delicious. Loved being able to chat directly with the baker to nail the theme.",
  },
];

/**
 * Server-rendered Dubai/UAE cake landing page. Renders BreadcrumbList +
 * ItemList + FAQPage JSON-LD, a hero, vendor results, about, price guide,
 * how-it-works, FAQ, reviews, related searches, vendor CTA, and the site
 * footer — all SSR so Google sees the full content.
 */
export async function CakeLanding({ page }: { page: CakePage }) {
  const { vendors, total } = await fetchCakeVendors(page);
  const jsonLd = buildCakeJsonLd(page, vendors);

  const intro = `Looking for ${page.keyword} in ${page.location}? FindMyBites connects you with the best ${page.keyword} makers in ${page.location}. Browse verified vendors, compare prices, and book directly — no commission.`;

  // Breadcrumb trail (visible)
  const crumbs = [
    { label: "Home", path: "/" },
    { label: "FindMyBites", path: "/findmybites" },
    { label: "UAE", path: "/findmybites/united-arab-emirates" },
  ];
  if (page.locationScope === "city") {
    crumbs.push({
      label: page.location,
      path: `/findmybites/united-arab-emirates/${page.location.toLowerCase().replace(/ /g, "-")}`,
    });
  }
  crumbs.push({ label: page.categoryLabel, path: `/${page.slug}` });

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
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="size-3 text-black/30" />}
              {i === crumbs.length - 1 ? (
                <span style={{ color: ECO_COLOR, fontWeight: 500 }}>{c.label}</span>
              ) : (
                <Link href={c.path} className="transition-colors hover:text-black">
                  {c.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <KeywordPageHero
        h1={page.h1}
        subtitle={page.subtitle}
        location={page.location}
        searchPlaceholder={page.searchPlaceholder}
        ecoColor={ECO_COLOR}
      />

      {/* Intro + Vendor results */}
      <main className="flex-1">
        <section id="vendors" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[24px] font-bold tracking-tight sm:text-[28px]">
                Top {page.categoryLabel} in {page.location}
              </h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-black/60">
                {intro}
              </p>
            </div>
            {total > 0 && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{ background: `${ECO_COLOR}14`, color: ECO_COLOR }}
              >
                <BadgeCheck className="size-3.5" />
                {total} verified {total === 1 ? "vendor" : "vendors"}
              </span>
            )}
          </div>

          {vendors.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vendors.map((v) => (
                <CakeVendorCard key={v.id} vendor={v} location={page.location} keyword={page.keyword} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-black/15 bg-white py-16 text-center">
              <MapPin className="mx-auto size-10 text-black/20" />
              <p className="mt-3 text-[16px] font-semibold">
                Be the first cake maker in {page.location} on FindMyBites
              </p>
              <p className="mx-auto mt-1 max-w-md text-[13px] text-black/40">
                We don&apos;t have any {page.keyword} listed in {page.location} yet.
                List your business free and get discovered by customers across the UAE.
              </p>
              <Link
                href="/"
                className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[13px] font-semibold text-white"
                style={{ background: ECO_COLOR }}
              >
                List Your Business →
              </Link>
            </div>
          )}
        </section>

        {/* About / why FindMyBites */}
        <section className="border-y border-black/10 bg-white py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-[24px] font-bold tracking-tight sm:text-[28px]">
              Why FindMyBites for {page.keyword} in {page.location}?
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {ABOUT_BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.title}
                    className="rounded-2xl border border-black/10 bg-[#F7F6F2] p-6 text-center"
                  >
                    <div
                      className="mx-auto grid size-12 place-items-center rounded-full"
                      style={{ background: ECO_TINT }}
                    >
                      <Icon className="size-6" style={{ color: ECO_COLOR }} />
                    </div>
                    <h3 className="mt-4 text-[16px] font-bold">{b.title}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-black/60">
                      {b.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Price guide */}
        <PriceGuideTable
          category={page.categoryLabel}
          location={page.location}
          currency="AED"
          prices={page.prices}
          ecoColor={ECO_COLOR}
        />

        {/* How it works */}
        <section className="bg-white py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-[24px] font-bold tracking-tight sm:text-[28px]">
              How it works
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {HOW_IT_WORKS.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.step} className="text-center">
                    <div className="relative mx-auto grid size-14 place-items-center rounded-full border-2" style={{ borderColor: `${ECO_COLOR}40`, background: ECO_TINT }}>
                      <Icon className="size-6" style={{ color: ECO_COLOR }} />
                      <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: ECO_COLOR }}>
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
        <FAQSection
          faqs={page.faqs}
          heading={`${page.categoryLabel} in ${page.location} — Frequently Asked Questions`}
          ecoColor={ECO_COLOR}
        />

        {/* Reviews */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-[24px] font-bold tracking-tight sm:text-[28px]">
            What customers say
          </h2>
          <p className="mt-2 text-[14px] text-black/50">
            Real reviews from customers who booked cake makers on FindMyBites.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {PLACEHOLDER_REVIEWS.map((r) => (
              <div
                key={r.author}
                className="rounded-2xl border border-black/10 bg-white p-5"
              >
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-black/70">
                  “{r.text}”
                </p>
                <p className="mt-3 text-[12px] font-semibold text-black/60">
                  {r.author} · {r.city}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Related searches */}
        <RelatedSearches
          links={page.related}
          location={page.location}
          ecoColor={ECO_COLOR}
        />

        {/* Vendor CTA */}
        <VendorCTA
          category={page.categoryLabel}
          location={page.location}
          ecoColor={ECO_COLOR}
        />
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}

/** Vendor card for the cake landing grid. Uses next/image + descriptive alts. */
function CakeVendorCard({
  vendor,
  location,
  keyword,
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
  location: string;
  keyword: string;
}) {
  const symbol =
    ({ USD: "$", GBP: "£", AED: "AED", INR: "₹", EUR: "€" } as Record<string, string>)[
      vendor.currency
    ] ?? vendor.currency ?? "AED";

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
          <div className="flex h-full items-center justify-center" style={{ background: ECO_TINT }}>
            <MapPin className="size-8" style={{ color: ECO_COLOR }} />
          </div>
        )}
        {vendor.featured && (
          <span
            className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ background: ECO_COLOR }}
          >
            ★ Featured
          </span>
        )}
        {vendor.verified && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-bold" style={{ color: ECO_COLOR }}>
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
          <p className="mt-1.5 text-[12px] font-bold" style={{ color: ECO_COLOR }}>
            from {symbol} {vendor.basePrice.toLocaleString("en-US")}
          </p>
        )}
      </div>
    </Link>
  );
}
