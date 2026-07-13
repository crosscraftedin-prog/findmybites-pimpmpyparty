"use client";

import * as React from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAQSection } from "@/components/seo/FAQSection";
import { generateFAQsFromProductInfo, type ProductInfo } from "@/lib/products/product-info";
import { toast } from "sonner";

/**
 * ProductFAQSection — renders auto-generated FAQs from Product Information,
 * with a "Regenerate with AI" button that uses Josh AI to create richer FAQs.
 *
 * The deterministic FAQs are shown by default (instant, no API call).
 * When the user clicks "Regenerate with AI", we call /api/vendor/ai/generate-faqs
 * to produce more natural, varied FAQs.
 */
export function ProductFAQSection({
  productName,
  productInfo,
}: {
  productName: string;
  productInfo: ProductInfo;
}) {
  const [aiFaqs, setAiFaqs] = React.useState<{ question: string; answer: string }[] | null>(null);
  const [loading, setLoading] = React.useState(false);

  const deterministicFaqs = React.useMemo(
    () => generateFAQsFromProductInfo(productInfo, productName),
    [productInfo, productName]
  );

  const faqsToShow = aiFaqs ?? deterministicFaqs;

  if (faqsToShow.length === 0) return null;

  const regenerateWithAI = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/ai/generate-faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, productInfo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate FAQs");
      if (data.faqs?.length > 0) {
        setAiFaqs(data.faqs);
        toast.success(`Generated ${data.faqs.length} FAQs with AI!`);
      } else {
        toast.info("AI didn't return any FAQs — keeping the default ones.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to regenerate FAQs");
    }
    setLoading(false);
  };

  return (
    <div>
      <FAQSection
        faqs={faqsToShow.map((f) => ({ q: f.question, a: f.answer }))}
        heading="Product FAQs"
        ecoColor="#D85A30"
      />
      {/* Regenerate with AI button — shown only when the vendor is logged in.
          This is a progressive enhancement; the deterministic FAQs work without it. */}
      <div className="mt-4 flex justify-center">
        <Button
          onClick={regenerateWithAI}
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : aiFaqs ? <RefreshCw className="size-3.5" /> : <Sparkles className="size-3.5" />}
          {loading ? "Generating…" : aiFaqs ? "Regenerate FAQs" : "Generate FAQs with AI"}
        </Button>
      </div>
    </div>
  );
}
