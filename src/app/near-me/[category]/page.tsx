import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Search,
  MapPin,
  ChevronRight,
  Navigation,
  BadgeCheck,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Store,
  ArrowRight,
  Star,
} from "lucide-react";
import { SiteFooter } from "@/components/marketplace/site-footer";
import { LocationButton } from "@/components/seo/LocationButton";
import { getAllCategories, slugify, titleCase } from "@/lib/seo-data";
import {
  generateNearMeMetadata,
  generateFAQs,
  generatePriceGuide,
  generateBreadcrumbJsonLd,
  generateFAQJsonLd,
} from "@/lib/seo-content";
import { CATEGORIES, getCategoryMigrated } from "@/lib/constants";
import { getCategoryInfo } from "@/lib/category-server";

/**
 * /near-me/[category] — "category near me" landing pages.
 *
 * Auto-generates for every category that has approved vendors. Asks for
 * location permission (client-side) then shows nearby vendors of that
 * category. SSR so Google sees the full content + FAQ + JSON-LD.
 */
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ category: string }>;
}

const ECO_COLOR_FOOD = "#D85A30";
const ECO_COLOR_PARTY = "#7F77DD";
const ECO_TINT_FOOD = "#FAECE7";
const ECO_TINT_PARTY = "#EEEDFE";

export async function generateStaticParams() {
  const cats = await getAllCategories();
  return cats.map((c) => ({ category: c.categorySlug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const catInfo = await getCategoryInfo(category);
  if (!catInfo) return { title: "Not Found" };
  return generateNearMeMetadata(catInfo.label, category);
}

export default async function NearMeCategoryPage({ params }: PageProps) {
  const { category: categorySlug } = await params;
  const catInfo = await getCategoryInfo(categorySlug);
  if (!catInfo) notFound();
  // Build a catDef-like object for compatibility with existing code
  const catDef = { ...catInfo, id: categorySlug, ecosystem: "", description: "" };

  const eco = catDef.ecosystem;
  const ecoColor = eco === "PIMPMYPARTY" ? ECO_COLOR_PARTY : ECO_COLOR_FOOD;
  const ecoTint = eco === "PIMPMYPARTY" ? ECO_TINT_PARTY : ECO_TINT_FOOD;
  const ecoLabel = eco === "PIMPMYPARTY" ? "PimpMyParty" : "FindMyBites";
  const categoryLabel = catDef.label;

  const faqs = generateFAQs(categoryLabel, categorySlug, "your area", "your country", []);
  const priceGuide = generatePriceGuide(categorySlug, "AE");

  const breadcrumbs = [
    { label: "Home", url: "https://www.findmybites.com" },
    { label: "Near me", url: "https://www.findmybites.com/near-me" },
    { label: `${categoryLabel} near me`, url: `https://www.findmybites.com/near-me/${categorySlug}` },
  ];

  const jsonLd = [
    generateBreadcrumbJsonLd(breadcrumbs),
    generateFAQJsonLd(faqs),
  ];

  // Related categories in the same ecosystem
  const related = CATEGORIES.filter(
    (c) => c.ecosystem === eco && c.id !== categorySlug
  )
    .slice(0, 6)
    .map((c) => ({ label: `${c.label} near me`, slug: c.id }));

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F6F2]">
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
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3 text-black/30" />}
              {i === breadcrumbs.length - 1 ? (
                <span style={{ color: ecoColor, fontWeight: 500 }}>{c.label}</span>
              ) : (
                <Link href={c.url.replace("https://www.findmybites.com", "")} className="transition-colors hover:text-black">
                  {c.label}
                </Link>
              )}
            </span>
          ))}
        </div>
      </nav>

      {/* Hero with location prompt */}
      <section
        className="relative overflow-hidden border-b border-black/10"
        style={{ background: `linear-gradient(135deg, ${ecoColor}14, ${ecoColor}08)` }}
      >
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: ecoColor }}>
            {ecoLabel} · Near me
          </p>
          <h1 className="mt-2 max-w-3xl text-[32px] font-extrabold leading-[1.1] tracking-tight text-black sm:text-[42px] lg:text-[50px]">
            {categoryLabel} Near Me
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-black/60 sm:text-[18px]">
            Find the best {categoryLabel.toLowerCase()} near you. Browse verified vendors in your
            city, compare prices, and enquire for free — no commission, direct contact.
          </p>

          {/* Location prompt */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <LocationButton ecoColor={ecoColor} />
            <Link
              href="/near-me"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-black/15 bg-white px-7 text-sm font-semibold text-black/70 transition-colors hover:bg-black/[0.04]"
            >
              <Search className="size-4" />
              Search by city
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
            {[
              { icon: BadgeCheck, label: "Verified vendors" },
              { icon: MessageCircle, label: "Free to enquire" },
              { icon: ShieldCheck, label: "No commission" },
              { icon: Sparkles, label: "Direct contact" },
            ].map((b) => {
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

      <main className="flex-1">
        {/* Price guide */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-[24px] font-bold tracking-tight sm:text-[28px]">
            How much do {categoryLabel.toLowerCase()} cost?
          </h2>
          <p className="mt-2 text-[15px] text-black/60">
            Typical price ranges. All amounts in {priceGuide.currency}.
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
            Prices vary by vendor, size, and complexity. Contact vendors directly for exact quotes.
          </p>
        </section>

        {/* FAQ */}
        <section className="bg-black/[0.02] py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-[24px] font-bold tracking-tight sm:text-[28px]">
              {categoryLabel} Near Me — Frequently Asked Questions
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

        {/* Related categories */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-[20px] font-bold tracking-tight">Other categories near me</h2>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {related.map((l) => (
              <Link
                key={l.slug}
                href={`/near-me/${l.slug}`}
                className="inline-flex items-center rounded-lg border border-black/10 bg-white px-4 py-2 text-[13px] font-medium text-black/70 transition-colors hover:bg-black/[0.04]"
                style={{ borderColor: `${ecoColor}33` }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Vendor CTA */}
        <section className="py-14" style={{ background: `linear-gradient(135deg, ${ecoColor}12, ${ecoColor}06)` }}>
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide" style={{ background: `${ecoColor}1f`, color: ecoColor }}>
              <Store className="size-3.5" />
              For vendors
            </span>
            <h2 className="mt-4 text-[26px] font-extrabold tracking-tight sm:text-[32px]">
              Are you a {categoryLabel.toLowerCase()} vendor?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[15px] text-black/60">
              List your business free on FindMyBites and get discovered by customers searching for {categoryLabel.toLowerCase()} near them.
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
