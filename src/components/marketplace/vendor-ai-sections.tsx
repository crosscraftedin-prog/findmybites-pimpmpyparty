"use client";

import * as React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AIStoreSummary — displays an AI-generated summary of the vendor at the top
 * of the storefront. Falls back to template-based summary if AI unavailable.
 */
export function AIStoreSummary({ vendorId }: { vendorId: string }) {
  const [summary, setSummary] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<"ai" | "template">("template");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/ai/vendor-summary?vendorId=${vendorId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.summary) {
          setSummary(d.summary);
          setSource(d.source || "template");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [vendorId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-brand-border bg-brand-soft p-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-brand" />
        Generating store summary…
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="rounded-xl border border-brand-border bg-brand-soft p-4">
      <div className="flex items-start gap-2">
        <Sparkles className="size-4 shrink-0 text-brand" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-brand">
            AI Store Summary {source === "ai" && "✨"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground/90">{summary}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * AIFAQ — displays AI-generated FAQs in an accordion.
 */
export function AIFAQ({ vendorId }: { vendorId: string }) {
  const [faqs, setFaqs] = React.useState<{ question: string; answer: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  React.useEffect(() => {
    fetch(`/api/ai/vendor-faq?vendorId=${vendorId}`)
      .then((r) => r.json())
      .then((d) => {
        setFaqs(d.faqs ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [vendorId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Generating FAQs…
      </div>
    );
  }

  if (faqs.length === 0) return null;

  return (
    <div className="space-y-2">
      {faqs.map((faq, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-border bg-card">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between p-3 text-left"
          >
            <span className="text-sm font-semibold">{faq.question}</span>
            <span className={cn("text-muted-foreground transition-transform", openIndex === i && "rotate-180")}>
              ▾
            </span>
          </button>
          {openIndex === i && (
            <div className="border-t border-border p-3 text-sm text-muted-foreground">
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * AIReviewSummary — displays an AI summary of customer reviews.
 */
export function AIReviewSummary({ vendorId }: { vendorId: string }) {
  const [data, setData] = React.useState<{
    loved: string[];
    mostMentioned: string[];
    improvements: string[];
  } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/ai/review-summary?vendorId=${vendorId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [vendorId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Summarizing reviews…
      </div>
    );
  }

  if (!data || (data.loved.length === 0 && data.mostMentioned.length === 0)) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {data.loved.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              ✓ Customers love
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.loved.map((item, i) => (
                <span key={i} className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
        {data.mostMentioned.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-brand">
              🔥 Most mentioned
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.mostMentioned.map((item, i) => (
                <span key={i} className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
        {data.improvements.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-amber-600">
              💡 Could improve
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.improvements.map((item, i) => (
                <span key={i} className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
