"use client";

import * as React from "react";
import { Sparkles, Loader2, RefreshCw, Edit2, Trash2, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FAQSection } from "@/components/seo/FAQSection";
import { generateFAQsFromProductInfo, type ProductInfo } from "@/lib/products/product-info";
import { toast } from "sonner";

/**
 * ProductFAQSection V2 — renders FAQs from Product Information.
 *
 * Workflow:
 *   1. Deterministic FAQs shown by default (instant).
 *   2. "Generate FAQs with AI" button calls /api/vendor/ai/generate-faqs.
 *   3. Vendor can edit/add/delete FAQs inline.
 *   4. FAQs are stored in productInfo.faqs (persisted via autosave).
 *   5. Display publicly from stored FAQs.
 *
 * Never regenerates on every page load — respects stored FAQs.
 */
export function ProductFAQSection({
  productName,
  productInfo,
  editable = false,
  onChange,
}: {
  productName: string;
  productInfo: ProductInfo;
  /** When true, shows edit/add/delete controls (vendor dashboard). */
  editable?: boolean;
  /** Called when FAQs change (vendor dashboard autosave). */
  onChange?: (faqs: { question: string; answer: string }[]) => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [draftFaqs, setDraftFaqs] = React.useState<{ question: string; answer: string }[]>([]);

  const storedFaqs = productInfo.faqs ?? [];
  const deterministicFaqs = React.useMemo(
    () => generateFAQsFromProductInfo(productInfo, productName),
    [productInfo, productName]
  );

  // Use stored FAQs if present, otherwise deterministic
  const faqsToShow = storedFaqs.length > 0 ? storedFaqs : deterministicFaqs;

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
        // Store in productInfo.faqs (persisted)
        onChange?.(data.faqs);
        toast.success(`Generated ${data.faqs.length} FAQs with AI!`);
      } else {
        toast.info("AI didn't return any FAQs — keeping the default ones.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to regenerate FAQs");
    }
    setLoading(false);
  };

  const startEditing = () => {
    setDraftFaqs(faqsToShow.map((f) => ({ ...f })));
    setEditing(true);
  };

  const saveEdits = () => {
    onChange?.(draftFaqs.filter((f) => f.question.trim() && f.answer.trim()));
    setEditing(false);
    toast.success("FAQs saved!");
  };

  const cancelEdits = () => {
    setEditing(false);
    setDraftFaqs([]);
  };

  const updateDraft = (idx: number, field: "question" | "answer", value: string) => {
    const newDraft = [...draftFaqs];
    newDraft[idx] = { ...newDraft[idx], [field]: value };
    setDraftFaqs(newDraft);
  };

  const addDraftFaq = () => {
    setDraftFaqs([...draftFaqs, { question: "", answer: "" }]);
  };

  const removeDraftFaq = (idx: number) => {
    setDraftFaqs(draftFaqs.filter((_, i) => i !== idx));
  };

  if (faqsToShow.length === 0 && !editable) return null;

  // Editing mode (vendor dashboard)
  if (editing) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-bold">Edit FAQs</h3>
        <div className="space-y-3">
          {draftFaqs.map((faq, idx) => (
            <div key={idx} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Input
                  value={faq.question}
                  onChange={(e) => updateDraft(idx, "question", e.target.value)}
                  placeholder="Question"
                  className="flex-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeDraftFaq(idx)}
                  className="text-red-600 hover:bg-red-50"
                  aria-label="Remove FAQ"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <Textarea
                value={faq.answer}
                onChange={(e) => updateDraft(idx, "answer", e.target.value)}
                placeholder="Answer"
                className="text-sm"
                rows={2}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" onClick={addDraftFaq} className="gap-1">
            <Plus className="size-3.5" /> Add FAQ
          </Button>
          <Button size="sm" onClick={saveEdits} className="gap-1">
            <Check className="size-3.5" /> Save
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelEdits} className="gap-1">
            <X className="size-3.5" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {faqsToShow.length > 0 && (
        <FAQSection
          faqs={faqsToShow.map((f) => ({ q: f.question, a: f.answer }))}
          heading="Product FAQs"
          ecoColor="#D85A30"
        />
      )}

      {/* Vendor controls */}
      {editable && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button
            onClick={regenerateWithAI}
            disabled={loading}
            variant="outline"
            size="sm"
            className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            {loading ? "Generating…" : "Generate FAQs with AI"}
          </Button>
          {faqsToShow.length > 0 && (
            <Button onClick={startEditing} variant="outline" size="sm" className="gap-1.5">
              <Edit2 className="size-3.5" /> Edit FAQs
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
