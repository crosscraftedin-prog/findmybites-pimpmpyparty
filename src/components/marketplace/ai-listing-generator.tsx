"use client";

import * as React from "react";
import {
  Sparkles, Loader2, RefreshCw, Copy, Check, Pencil, X, Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { WRITING_STYLES, type WritingStyle } from "@/lib/ai/listing-types";

export interface AiListingResult {
  description: string;
  tagline: string;
  keywords: string[];
  businessTags: string[];
  services: string[];
}

interface AiListingGeneratorProps {
  /** Context the AI needs to generate the listing */
  context: {
    businessName: string;
    marketplace: string;
    category: string;
    subcategory?: string;
    city?: string;
    country?: string;
    specialities?: string;
    yearsExperience?: string;
    deliveryOptions?: string;
    customOrders?: boolean;
    languages?: string;
    priceRange?: string;
    tags?: string;
  };
  /** Called when the AI generates a result — parent updates the form */
  onApply: (result: AiListingResult) => void;
  /** Current description (for showing in the generated view) */
  currentDescription?: string;
}

/**
 * AI Business Description Generator.
 * One-click generation with 6 writing styles, plus Regenerate/Edit/Copy.
 * Also generates keywords, tags, and services (applied via onApply).
 */
export function AiListingGenerator({ context, onApply, currentDescription }: AiListingGeneratorProps) {
  const [style, setStyle] = React.useState<WritingStyle>("professional");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<AiListingResult | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [editText, setEditText] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [applied, setApplied] = React.useState(false);

  const canGenerate = context.businessName?.trim() && context.category;

  const generate = async (selectedStyle?: WritingStyle) => {
    if (!canGenerate) {
      toast.error("Please enter a business name and select a category first");
      return;
    }
    const useStyle = selectedStyle || style;
    setLoading(true);
    setResult(null);
    setApplied(false);
    try {
      const res = await fetch("/api/vendor/ai/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...context, style: useStyle }),
      });
      const data = await res.json();
      if (res.ok && data.description) {
        setResult(data);
        setEditText(data.description);
        toast.success(`Generated ${WRITING_STYLES.find((s) => s.value === useStyle)?.label} description`);
      } else {
        toast.error(data.error || "AI generation failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  const regenerate = () => generate(style);

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.description);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  const applyToForm = () => {
    if (!result) return;
    onApply(result);
    setApplied(true);
    toast.success("Applied to form — review and save");
  };

  const saveEdit = () => {
    if (!result) return;
    setResult({ ...result, description: editText });
    setEditing(false);
    toast.success("Description updated");
  };

  return (
    <div className="rounded-xl border border-brand-border bg-brand-soft/30 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
          <Wand2 className="size-4" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">AI Business Description Generator</p>
          <p className="text-[11px] text-muted-foreground">One click — writes your description, keywords, tags & services</p>
        </div>
      </div>

      {/* Style selector */}
      <div className="flex flex-wrap gap-1.5">
        {WRITING_STYLES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => { setStyle(s.value); if (result) generate(s.value); }}
            disabled={loading}
            title={s.desc}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-50",
              style === s.value ? "border-brand bg-brand text-brand-foreground" : "border-border bg-background hover:bg-accent"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Generate button */}
      {!result && (
        <Button
          type="button"
          onClick={() => generate()}
          disabled={loading || !canGenerate}
          className="w-full"
        >
          {loading ? (
            <><Loader2 className="mr-1.5 size-4 animate-spin" /> Generating…</>
          ) : (
            <><Sparkles className="mr-1.5 size-4" /> Generate with AI</>
          )}
        </Button>
      )}

      {!canGenerate && !result && (
        <p className="text-center text-[11px] text-muted-foreground">
          Enter a business name and select a category to enable AI generation
        </p>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3">
          {/* Description */}
          <div className="rounded-lg border bg-background p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">Description</span>
              <div className="flex gap-1">
                <button type="button" onClick={regenerate} disabled={loading} title="Regenerate" className="grid size-7 place-items-center rounded-md hover:bg-accent">
                  {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                </button>
                <button type="button" onClick={copy} title="Copy" className="grid size-7 place-items-center rounded-md hover:bg-accent">
                  {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                </button>
                <button type="button" onClick={() => setEditing(!editing)} title="Edit" className="grid size-7 place-items-center rounded-md hover:bg-accent">
                  <Pencil className="size-3.5" />
                </button>
              </div>
            </div>
            {editing ? (
              <div className="space-y-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={5}
                  maxLength={800}
                  className="resize-none text-sm"
                />
                <div className="flex gap-1.5">
                  <Button type="button" size="sm" onClick={saveEdit}><Check className="mr-1 size-3.5" /> Save edit</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => { setEditing(false); setEditText(result.description); }}><X className="mr-1 size-3.5" /> Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm">{result.description}</p>
            )}
            <p className="mt-1.5 text-right text-[10px] text-muted-foreground">{result.description.length}/800</p>
          </div>

          {/* Tagline */}
          {result.tagline && (
            <div className="rounded-lg border bg-background p-3">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">Tagline</span>
              <p className="mt-0.5 text-sm font-medium">{result.tagline}</p>
            </div>
          )}

          {/* Keywords */}
          {result.keywords.length > 0 && (
            <div className="rounded-lg border bg-background p-3">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">SEO Keywords ({result.keywords.length})</span>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {result.keywords.map((k, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">{k}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Business Tags */}
          {result.businessTags.length > 0 && (
            <div className="rounded-lg border bg-background p-3">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">Business Tags ({result.businessTags.length})</span>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {result.businessTags.map((t, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {result.services.length > 0 && (
            <div className="rounded-lg border bg-background p-3">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">Suggested Services ({result.services.length})</span>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {result.services.map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Apply button */}
          <Button type="button" onClick={applyToForm} disabled={applied} className="w-full">
            {applied ? (
              <><Check className="mr-1.5 size-4" /> Applied to form</>
            ) : (
              <><Sparkles className="mr-1.5 size-4" /> Apply all to form</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
