import { ChevronRight } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQSectionProps {
  faqs: FAQItem[];
  heading?: string;
  ecoColor: string;
}

/**
 * FAQ section using native <details> for accessibility + no JS. The
 * matching FAQPage JSON-LD is emitted separately by the page (so it stays
 * in the server-rendered HTML).
 */
export function FAQSection({
  faqs,
  heading,
  ecoColor,
}: FAQSectionProps) {
  const title =
    heading ?? "Frequently Asked Questions";

  return (
    <section className="bg-black/[0.02] py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-[24px] font-bold tracking-tight sm:text-[28px]">
          {title}
        </h2>
        <div className="mt-6 space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-xl border border-black/10 bg-white p-4 open:shadow-sm"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-[15px] font-semibold text-black/80 list-none">
                {faq.q}
                <ChevronRight
                  className="size-4 shrink-0 text-black/40 transition-transform group-open:rotate-90"
                  style={{ color: ecoColor }}
                />
              </summary>
              <p className="mt-3 text-[14px] leading-relaxed text-black/60">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
