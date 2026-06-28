import Link from "next/link";

interface RelatedLink {
  label: string;
  slug: string;
}

interface RelatedSearchesProps {
  links: RelatedLink[];
  heading?: string;
  location?: string;
  ecoColor: string;
}

/**
 * "Also popular in [location]" — internal links to related keyword landing
 * pages, strengthening topical relevance and crawl depth.
 */
export function RelatedSearches({
  links,
  heading,
  location,
  ecoColor,
}: RelatedSearchesProps) {
  if (links.length === 0) return null;
  const title = heading ?? (location ? `Also popular in ${location}` : "Related searches");

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="text-[20px] font-bold tracking-tight">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {links.map((l) => (
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
  );
}
