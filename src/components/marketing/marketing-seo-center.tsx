"use client";

import * as React from "react";
import {
  Search, Sparkles, Loader2, Check, X, AlertTriangle, Globe, RefreshCw, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SeoData {
  score: number;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string[];
  slug: string;
  indexStatus: string;
  openGraph: { title: string | null; description: string | null; image: string | null };
  schemaStatus: { product: boolean; vendor: boolean; faq: boolean; reviews: boolean };
  checks: { label: string; passed: boolean; detail?: string }[];
  suggestions: string[];
}

export function SeoCenter() {
  const [data, setData] = React.useState<SeoData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [draft, setDraft] = React.useState<{ metaTitle: string; metaDescription: string; keywords: string[] } | null>(null);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/marketing/seo");
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setDraft({ metaTitle: d.metaTitle || "", metaDescription: d.metaDescription || "", keywords: d.keywords || [] });
      }
    } catch {} finally { setLoading(false); }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/vendor/marketing/ai/seo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const json = await res.json();
      if (json.seo) {
        setDraft({ metaTitle: json.seo.metaTitle, metaDescription: json.seo.metaDescription, keywords: json.seo.keywords });
        toast.success("AI generated SEO copy — review and save");
      } else { toast.error("AI generation failed"); }
    } catch { toast.error("Failed"); } finally { setGenerating(false); }
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch("/api/vendor/marketing/ai/seo", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ save: true }),
      });
      // The save endpoint regenerates; to save the user's edits we use the vendor profile API.
      await fetch("/api/vendor/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metaTitle: draft.metaTitle, metaDescription: draft.metaDescription, tags: draft.keywords }),
      });
      toast.success("SEO saved");
      load();
    } catch { toast.error("Save failed"); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!data) return <div className="p-4 text-sm text-muted-foreground">Unable to load SEO data.</div>;

  return (
    <div className="space-y-4">
      {/* Score header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted" />
              <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                className={cn(data.score >= 70 ? "text-emerald-500" : data.score >= 40 ? "text-amber-500" : "text-red-500")}
                strokeDasharray={`${(data.score / 100) * 150.8} 150.8`} />
            </svg>
            <span className="absolute text-sm font-bold">{data.score}</span>
          </div>
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold"><Search className="h-4 w-4" /> SEO Score</h3>
            <p className="text-xs text-muted-foreground">{data.indexStatus === "indexable" ? "Indexable by Google" : "Noindex"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={generate} disabled={generating}>
            {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
            Generate with AI
          </Button>
          <Button size="sm" onClick={save} disabled={saving || !draft}>
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Editable fields */}
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <h4 className="text-sm font-semibold">Meta Tags</h4>
          <div className="space-y-1.5">
            <Label className="text-xs">Meta Title ({draft?.metaTitle?.length || 0}/60)</Label>
            <Input value={draft?.metaTitle || ""} onChange={(e) => setDraft((d) => d ? { ...d, metaTitle: e.target.value.slice(0, 60) } : d)} placeholder="e.g. Sweet Bakes — Best Cakes in Mumbai" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Meta Description ({draft?.metaDescription?.length || 0}/160)</Label>
            <Textarea rows={3} value={draft?.metaDescription || ""} onChange={(e) => setDraft((d) => d ? { ...d, metaDescription: e.target.value.slice(0, 160) } : d)} placeholder="Short, persuasive description with a call-to-action…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Keywords (press Enter to add)</Label>
            <Input
              placeholder="Type a keyword and press Enter"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                  e.preventDefault();
                  const v = (e.target as HTMLInputElement).value.trim();
                  setDraft((d) => d ? { ...d, keywords: [...new Set([...d.keywords, v])] } : d);
                  (e.target as HTMLInputElement).value = "";
                }
              }}
            />
            <div className="flex flex-wrap gap-1.5">
              {draft?.keywords.map((k) => (
                <Badge key={k} variant="secondary" className="gap-1">
                  {k}
                  <button onClick={() => setDraft((d) => d ? { ...d, keywords: d.keywords.filter((x) => x !== k) } : d)} className="hover:text-destructive">×</button>
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Slug</Label>
            <Input value={data.slug} disabled className="font-mono text-xs" />
          </div>
        </div>

        {/* Checks + previews */}
        <div className="space-y-3">
          <div className="rounded-xl border bg-card p-4">
            <h4 className="mb-2 text-sm font-semibold">SEO Checks</h4>
            <div className="space-y-1.5">
              {data.checks.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {c.passed ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-red-500" />}
                  <span className="flex-1">{c.label}</span>
                  {c.detail && <span className="text-muted-foreground">{c.detail}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Google preview */}
          <div className="rounded-xl border bg-card p-4">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Globe className="h-4 w-4" /> Google Preview</h4>
            <div className="rounded border bg-white p-2.5 text-xs dark:bg-background">
              <div className="text-emerald-700 dark:text-emerald-500">{`findmybites.com › vendor › ${data.slug}`}</div>
              <div className="mt-0.5 text-base font-medium text-blue-700 dark:text-blue-400 line-clamp-1">{draft?.metaTitle || "Untitled"}</div>
              <div className="text-muted-foreground line-clamp-2">{draft?.metaDescription || "No description set."}</div>
            </div>
          </div>

          {/* Schema status */}
          <div className="rounded-xl border bg-card p-4">
            <h4 className="mb-2 text-sm font-semibold">Schema Status</h4>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(data.schemaStatus).map(([k, v]) => (
                <Badge key={k} variant={v ? "default" : "outline"} className="text-[10px] capitalize">
                  {v ? <Check className="mr-1 h-3 w-3" /> : <X className="mr-1 h-3 w-3" />}
                  {k}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {data.suggestions.length > 0 && (
        <div className="rounded-xl border bg-amber-50 p-4 dark:bg-amber-950/20">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" /> Suggestions to Improve
          </h4>
          <ul className="space-y-1 text-xs text-amber-800 dark:text-amber-200">
            {data.suggestions.map((s, i) => <li key={i} className="flex gap-1.5"><span>•</span><span>{s}</span></li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
