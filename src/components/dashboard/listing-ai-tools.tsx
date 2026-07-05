"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Store, Image as ImageIcon, Package, Search, Share2, ShieldCheck,
  Heart, BarChart3, CheckCircle2, AlertTriangle, XCircle, Rocket,
  Sparkles, Loader2, PartyPopper, ArrowRight, Copy, Clock, Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Business Score ───────────────────────────────────────────────────────────

export interface ScoreSection {
  key: string;
  label: string;
  score: number;
  icon: React.ElementType;
}

export interface BusinessScoreData {
  overall: number;
  sections: ScoreSection[];
}

export function computeBusinessScore(form: any, gallery: string[], productCount: number): BusinessScoreData {
  const sections: ScoreSection[] = [
    {
      key: "businessInfo",
      label: "Business Info",
      icon: Store,
      score: computeBusinessInfoScore(form),
    },
    {
      key: "gallery",
      label: "Gallery",
      icon: ImageIcon,
      score: Math.min(100, gallery.length * 20),
    },
    {
      key: "products",
      label: "Products",
      icon: Package,
      score: Math.min(100, productCount * 25),
    },
    {
      key: "seo",
      label: "SEO",
      icon: Search,
      score: computeSeoScore(form),
    },
    {
      key: "social",
      label: "Social",
      icon: Share2,
      score: computeSocialScore(form),
    },
    {
      key: "verification",
      label: "Verification",
      icon: ShieldCheck,
      score: form.approved ? 100 : 30,
    },
    {
      key: "customerTrust",
      label: "Customer Trust",
      icon: Heart,
      score: computeTrustScore(form),
    },
    {
      key: "analyticsReady",
      label: "Analytics Ready",
      icon: BarChart3,
      score: computeAnalyticsScore(form),
    },
  ];

  const overall = Math.round(sections.reduce((sum, s) => sum + s.score, 0) / sections.length);
  return { overall, sections };
}

function computeBusinessInfoScore(form: any): number {
  let s = 0;
  if (form.name) s += 15;
  if (form.category) s += 15;
  if (form.city) s += 10;
  if (form.country) s += 10;
  if (form.state) s += 5;
  if (form.whatsapp) s += 15;
  if (form.address) s += 10;
  if (form.tagline) s += 10;
  if (form.description && form.description.length >= 50) s += 10;
  return Math.min(100, s);
}

function computeSeoScore(form: any): number {
  let s = 0;
  if (form.metaTitle) s += 30;
  if (form.metaDescription && form.metaDescription.length >= 100) s += 30;
  const tags = typeof form.tags === "string" ? form.tags.split(",").filter(Boolean) : (Array.isArray(form.tags) ? form.tags : []);
  if (tags.length >= 3) s += 20;
  if (form.description && form.description.length >= 100) s += 20;
  return Math.min(100, s);
}

function computeSocialScore(form: any): number {
  let s = 0;
  if (form.instagram) s += 25;
  if (form.facebook) s += 25;
  if (form.youtube) s += 20;
  if (form.website) s += 15;
  if (form.tiktok || form.linkedin || form.pinterest) s += 15;
  return Math.min(100, s);
}

function computeTrustScore(form: any): number {
  let s = 0;
  if (form.whatsapp) s += 30;
  if (form.openHours) s += 20;
  if (form.responseTime) s += 20;
  if (form.deliveryAvailable || form.pickupAvailable) s += 15;
  if (form.languagesSpoken) s += 15;
  return Math.min(100, s);
}

function computeAnalyticsScore(form: any): number {
  let s = 0;
  if (form.latitude && form.longitude) s += 30;
  if (form.serviceRadiusKm) s += 20;
  if (form.priceRange) s += 20;
  if (form.openHours) s += 15;
  if (form.website) s += 15;
  return Math.min(100, s);
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function scoreBgColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export function BusinessScoreCard({ data }: { data: BusinessScoreData }) {
  const missingItems = data.sections.filter((s) => s.score < 50);
  const estimatedMinutes = Math.max(1, missingItems.length * 2);

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <BarChart3 className="size-4 text-primary" /> Business Score
        </h3>
        <div className="text-right">
          <span className={cn("text-2xl font-extrabold", scoreColor(data.overall))}>{data.overall}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${data.overall}%` }}
          transition={{ duration: 0.5 }}
          className={cn("h-full rounded-full", scoreBgColor(data.overall))}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {data.sections.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="rounded-lg border p-2 text-center">
              <Icon className={cn("mx-auto size-4 mb-1", scoreColor(s.score))} />
              <div className={cn("text-sm font-bold", scoreColor(s.score))}>{s.score}</div>
              <div className="text-[9px] text-muted-foreground leading-tight">{s.label}</div>
            </div>
          );
        })}
      </div>
      {/* Missing items + estimated time */}
      {missingItems.length > 0 && (
        <div className="border-t pt-2">
          <p className="text-[11px] font-semibold text-muted-foreground">Missing:</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {missingItems.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-0.5 rounded-full bg-red-50 dark:bg-red-950/20 px-2 py-0.5 text-[10px] text-red-600 dark:text-red-400">
                <XCircle className="size-2.5" /> {s.label}
              </span>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">⏱ Est. {estimatedMinutes} min to complete</p>
        </div>
      )}
      {missingItems.length === 0 && data.overall >= 80 && (
        <div className="flex items-center gap-1.5 border-t pt-2 text-xs text-emerald-600">
          <CheckCircle2 className="size-3.5" /> All sections look great!
        </div>
      )}
    </div>
  );
}

// ── Smart Missing Field Detection ────────────────────────────────────────────

export interface MissingField {
  field: string;
  label: string;
  tab: string;
  severity: "critical" | "warning";
  suggestion: string;
}

export function detectMissingFields(form: any, gallery: string[]): MissingField[] {
  const missing: MissingField[] = [];

  if (!form.category) missing.push({ field: "category", label: "Category", tab: "business", severity: "critical", suggestion: "Select your business category" });
  if (!form.description || form.description.length < 20) missing.push({ field: "description", label: "Description", tab: "business", severity: "critical", suggestion: "Add a description or click 'Generate with AI'" });
  if (!form.avatarImage) missing.push({ field: "avatarImage", label: "Logo", tab: "media", severity: "critical", suggestion: "Upload your business logo" });
  if (gallery.length === 0) missing.push({ field: "gallery", label: "Gallery", tab: "media", severity: "warning", suggestion: "Upload at least 1 gallery image" });
  if (!form.whatsapp) missing.push({ field: "whatsapp", label: "WhatsApp", tab: "contact", severity: "warning", suggestion: "Add your WhatsApp number" });
  if (!form.city) missing.push({ field: "city", label: "City", tab: "location", severity: "warning", suggestion: "Add your city" });
  if (!form.metaTitle) missing.push({ field: "metaTitle", label: "SEO Title", tab: "seo", severity: "warning", suggestion: "Generate SEO title with AI" });
  if (!form.openHours) missing.push({ field: "openHours", label: "Business Hours", tab: "hours", severity: "warning", suggestion: "Add your operating hours" });

  return missing;
}

export function MissingFieldsCard({ missing, onNavigate }: { missing: MissingField[]; onNavigate: (tab: string) => void }) {
  if (missing.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-emerald-500" />
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">All key fields completed!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <AlertTriangle className="size-4 text-amber-500" /> Smart Suggestions
      </h3>
      <div className="space-y-1.5">
        {missing.map((m) => (
          <button
            key={m.field}
            onClick={() => onNavigate(m.tab)}
            className={cn("flex w-full items-center gap-2 rounded-lg border p-2 text-left transition-colors hover:bg-accent",
              m.severity === "critical" ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20" : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20")}
          >
            <span className={cn("flex size-6 items-center justify-center rounded-full",
              m.severity === "critical" ? "bg-red-100 text-red-600 dark:bg-red-950/40" : "bg-amber-100 text-amber-600 dark:bg-amber-950/40")}>
              {m.severity === "critical" ? <XCircle className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium">{m.label}</p>
              <p className="text-[10px] text-muted-foreground">{m.suggestion}</p>
            </div>
            <ArrowRight className="size-3.5 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Auto-save indicator ──────────────────────────────────────────────────────

export function AutoSaveIndicator({ status, lastSavedAt }: { status: "idle" | "saving" | "saved"; lastSavedAt?: number }) {
  const [, force] = React.useReducer((x) => x + 1, 0);
  // Re-render every 5s so "Last saved X seconds ago" stays fresh
  React.useEffect(() => {
    if (status !== "idle" || !lastSavedAt) return;
    const interval = setInterval(force, 5000);
    return () => clearInterval(interval);
  }, [status, lastSavedAt]);

  const timeAgo = lastSavedAt ? formatTimeAgo(lastSavedAt) : "";

  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      {status === "saving" && (
        <><Loader2 className="size-3 animate-spin text-amber-500" /> <span className="text-amber-600 dark:text-amber-400">Saving…</span></>
      )}
      {status === "saved" && (
        <><CheckCircle2 className="size-3 text-emerald-500" /> <span className="text-emerald-600 dark:text-emerald-400">Saved ✓</span></>
      )}
      {status === "idle" && (
        <>
          <CheckCircle2 className="size-3 text-muted-foreground" />
          <span className="text-muted-foreground">{lastSavedAt ? `Last saved ${timeAgo}` : "All changes saved"}</span>
        </>
      )}
    </div>
  );
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 5000) return "just now";
  if (diff < 60000) return `${Math.floor(diff / 1000)} seconds ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)} minute${Math.floor(diff / 60000) > 1 ? "s" : ""} ago`;
  return `${Math.floor(diff / 3600000)} hour${Math.floor(diff / 3600000) > 1 ? "s" : ""} ago`;
}

// ── AI Quality Check ─────────────────────────────────────────────────────────

export interface QualityCheck {
  check: string;
  passed: boolean;
  detail: string;
}

export function runQualityChecks(form: any): QualityCheck[] {
  const checks: QualityCheck[] = [];

  // Description length
  checks.push({
    check: "Description length",
    passed: form.description && form.description.length >= 50,
    detail: form.description ? `${form.description.length} chars (min 50)` : "Missing",
  });

  // SEO title
  checks.push({
    check: "SEO Title",
    passed: !!form.metaTitle && form.metaTitle.length >= 30,
    detail: form.metaTitle ? `${form.metaTitle.length} chars` : "Missing",
  });

  // Meta description
  checks.push({
    check: "Meta Description",
    passed: !!form.metaDescription && form.metaDescription.length >= 100,
    detail: form.metaDescription ? `${form.metaDescription.length} chars` : "Missing",
  });

  // Tags
  const tags = typeof form.tags === "string" ? form.tags.split(",").filter(Boolean) : (Array.isArray(form.tags) ? form.tags : []);
  checks.push({
    check: "Tags (min 3)",
    passed: tags.length >= 3,
    detail: `${tags.length} tags`,
  });

  // Contact details
  checks.push({
    check: "WhatsApp/Phone",
    passed: !!form.whatsapp || !!form.phone,
    detail: form.whatsapp ? "WhatsApp set" : form.phone ? "Phone set" : "Missing",
  });

  // Social media
  checks.push({
    check: "Social media",
    passed: !!(form.instagram || form.facebook || form.youtube),
    detail: [form.instagram, form.facebook, form.youtube].filter(Boolean).length > 0 ? "Connected" : "None connected",
  });

  // Category
  checks.push({
    check: "Category set",
    passed: !!form.category,
    detail: form.category || "Missing",
  });

  // City
  checks.push({
    check: "Location (city)",
    passed: !!form.city,
    detail: form.city || "Missing",
  });

  return checks;
}

export function QualityCheckCard({ checks, onFix }: { checks: QualityCheck[]; onFix: (check: string) => void }) {
  const failed = checks.filter((c) => !c.passed);
  const passed = checks.filter((c) => c.passed);

  // One-click fix suggestions for each failed check
  const fixSuggestions: Record<string, { label: string; action: string }> = {
    "Description length": { label: "✨ Generate with AI", action: "generate_description" },
    "SEO Title": { label: "✨ Generate SEO", action: "generate_seo" },
    "Meta Description": { label: "✨ Generate SEO", action: "generate_seo" },
    "Tags (min 3)": { label: "Add: Wedding, Birthday, Custom", action: "add_tags" },
    "WhatsApp/Phone": { label: "Add WhatsApp", action: "add_whatsapp" },
    "Social media": { label: "Connect Instagram", action: "add_social" },
    "Category set": { label: "Select category", action: "select_category" },
    "Location (city)": { label: "Add city", action: "add_city" },
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-primary" /> AI Quality Check
        <span className="ml-auto text-xs font-normal text-muted-foreground">{passed.length}/{checks.length} passed</span>
      </h3>
      {failed.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3">
          <CheckCircle2 className="size-5 text-emerald-500" />
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">All quality checks passed! Ready to publish.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {checks.map((c) => (
            <div key={c.check} className={cn("rounded-lg border p-2 text-xs",
              c.passed ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/10" : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20")}>
              <div className="flex items-center gap-2">
                {c.passed ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <XCircle className="size-3.5 text-red-500" />}
                <span className="font-medium">{c.check}</span>
                <span className="ml-auto text-muted-foreground">{c.detail}</span>
              </div>
              {/* One-click fix for failed checks */}
              {!c.passed && fixSuggestions[c.check] && (
                <button
                  onClick={() => onFix(fixSuggestions[c.check].action)}
                  className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20"
                >
                  {fixSuggestions[c.check].label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── One-Click Publish + Success Screen ───────────────────────────────────────

export function PublishCard({ score, canPublish, onPublish, publishing }: {
  score: number; canPublish: boolean; onPublish: () => void; publishing: boolean;
}) {
  return (
    <div className={cn("rounded-xl border p-4", canPublish ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20" : "border-muted bg-muted/30")}>
      <div className="flex items-center gap-3">
        <Rocket className={cn("size-6", canPublish ? "text-emerald-500" : "text-muted-foreground")} />
        <div className="flex-1">
          {canPublish ? (
            <>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">🚀 Your business is ready.</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">Business score: {score}/100 — publish your listing now!</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-muted-foreground">Not ready to publish yet</p>
              <p className="text-xs text-muted-foreground">Score must be 80+ to publish. Currently: {score}/100</p>
            </>
          )}
        </div>
        <Button onClick={onPublish} disabled={!canPublish || publishing} className={canPublish ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}>
          {publishing ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Rocket className="mr-1.5 size-4" />}
          Publish Listing
        </Button>
      </div>
    </div>
  );
}

export function SuccessScreen({ vendorName, onAction }: { vendorName: string; onAction: (action: string) => void }) {
  const actions = [
    { id: "products", label: "Add Products", icon: Package },
    { id: "gallery", label: "Upload Gallery", icon: ImageIcon },
    { id: "share", label: "Share Your Profile", icon: Share2 },
    { id: "invite", label: "Invite Customers", icon: Heart },
    { id: "reviews", label: "Request Reviews", icon: Star },
    { id: "upgrade", label: "Upgrade to Pro", icon: Sparkles },
  ];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-background dark:border-emerald-800 dark:from-emerald-950/30 p-6 text-center space-y-4">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
        className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500">
        <PartyPopper className="size-8 text-white" />
      </motion.div>
      <div>
        <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-200">🎉 Congratulations!</h3>
        <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">Your business profile for <strong>{vendorName}</strong> is now live.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button key={a.id} onClick={() => onAction(a.id)} className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-background p-3 text-xs font-medium transition-colors hover:bg-accent">
              <Icon className="size-4 text-primary" />
              {a.label}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Integrated AI Generator Panel (for the Business tab) ─────────────────────

export interface AiBusinessProfile {
  description: string;
  shortDescription: string;
  tagline: string;
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  tags: string[];
  services: string[];
  whyChooseUs: string[];
  highlights: string[];
  customerPromise: string;
  faq: { question: string; answer: string }[];
  socialBio: string;
}

export function IntegratedAIPanel({ form, onApply, onNavigate }: {
  form: any;
  onApply: (profile: AiBusinessProfile) => void;
  onNavigate: (tab: string) => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [profile, setProfile] = React.useState<AiBusinessProfile | null>(null);
  const [copied, setCopied] = React.useState(false);

  const canGenerate = form.name?.trim() && form.category;

  const generate = async () => {
    if (!canGenerate) {
      toast.error("Please fill in business name and category first");
      return;
    }
    setLoading(true);
    setProfile(null);
    try {
      const res = await fetch("/api/vendor/ai/setup-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_profile",
          style: "professional",
          businessName: form.name,
          marketplace: form.ecosystem || "FINDMYBITES",
          category: form.category,
          subcategory: form.subcategory,
          city: form.city,
          state: form.state,
          country: form.country,
          whatsapp: form.whatsapp,
          specialities: form.tagline,
          yearsExperience: form.yearStarted,
          deliveryOptions: form.deliveryAvailable ? "Delivery" : form.pickupAvailable ? "Pickup" : "None",
          languages: form.languagesSpoken,
          priceRange: form.priceRange,
          tags: typeof form.tags === "string" ? form.tags : (Array.isArray(form.tags) ? form.tags.join(", ") : ""),
        }),
      });
      const data = await res.json();
      if (res.ok && data.description) {
        setProfile(data);
        toast.success("AI generated your business profile!");
      } else {
        toast.error(data.error || "AI generation failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  const applyAll = () => {
    if (!profile) return;
    onApply(profile);
    toast.success("Applied to your form — review and save");
  };

  const copyAll = async () => {
    if (!profile) return;
    const text = `Description: ${profile.description}\n\nTagline: ${profile.tagline}\n\nSEO Title: ${profile.seoTitle}\n\nMeta Description: ${profile.metaDescription}\n\nKeywords: ${profile.keywords.join(", ")}\n\nTags: ${profile.tags.join(", ")}\n\nServices: ${profile.services.join(", ")}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error("Copy failed"); }
  };

  return (
    <div className="rounded-xl border border-brand-border bg-brand-soft/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
          <Sparkles className="size-4" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">AI Business Profile Generator</p>
          <p className="text-[11px] text-muted-foreground">Generates description, SEO, keywords, tags, services, FAQ & more — in one click</p>
        </div>
      </div>

      {!profile && (
        <Button onClick={generate} disabled={loading || !canGenerate} className="w-full" size="sm">
          {loading ? <><Loader2 className="mr-1.5 size-4 animate-spin" /> Generating your profile…</> : <><Sparkles className="mr-1.5 size-4" /> Generate My Business Profile</>}
        </Button>
      )}

      {!canGenerate && !profile && (
        <p className="text-center text-[11px] text-muted-foreground">Fill in business name + category to enable AI</p>
      )}

      {profile && (
        <>
          <div className="flex gap-2">
            <Button onClick={generate} disabled={loading} variant="outline" size="sm" className="flex-1">
              {loading ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : "🔄 Regenerate"}
            </Button>
            <Button onClick={applyAll} size="sm" className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700">
              ✨ Apply all to form
            </Button>
            <Button onClick={copyAll} variant="outline" size="sm">
              {copied ? "✓" : "📋"}
            </Button>
          </div>

          {/* Preview generated content */}
          <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border bg-background p-3 text-xs">
            {profile.description && (
              <div><span className="font-semibold text-muted-foreground">Description:</span> {profile.description.slice(0, 120)}…</div>
            )}
            {profile.tagline && (
              <div><span className="font-semibold text-muted-foreground">Tagline:</span> {profile.tagline}</div>
            )}
            {profile.seoTitle && (
              <div><span className="font-semibold text-muted-foreground">SEO Title:</span> {profile.seoTitle}</div>
            )}
            {profile.keywords?.length > 0 && (
              <div><span className="font-semibold text-muted-foreground">Keywords:</span> {profile.keywords.join(", ")}</div>
            )}
            {profile.tags?.length > 0 && (
              <div><span className="font-semibold text-muted-foreground">Tags:</span> {profile.tags.join(", ")}</div>
            )}
            {profile.services?.length > 0 && (
              <div><span className="font-semibold text-muted-foreground">Services:</span> {profile.services.join(", ")}</div>
            )}
          </div>

          {/* Smart Suggestions — appear after AI generation */}
          <SmartSuggestionsPanel form={form} onNavigate={onNavigate} />
        </>
      )}
    </div>
  );
}

// ── Smart Suggestions Panel (8 specific items, appears after AI generation) ──

export function SmartSuggestionsPanel({ form, onNavigate }: { form: any; onNavigate: (tab: string) => void }) {
  const suggestions = [
    { id: "gallery", label: "Upload 5 more gallery images", done: false, tab: "media", icon: ImageIcon },
    { id: "product", label: "Add your first product", done: false, tab: "products", icon: Package },
    { id: "hours", label: "Complete business hours", done: !!form.openHours, tab: "hours", icon: Clock },
    { id: "verify", label: "Verify your business", done: form.approved, tab: "business", icon: ShieldCheck },
    { id: "instagram", label: "Connect Instagram", done: !!form.instagram, tab: "contact", icon: Share2 },
    { id: "whatsapp", label: "Add WhatsApp", done: !!form.whatsapp, tab: "contact", icon: Heart },
    { id: "delivery", label: "Enable delivery", done: !!form.deliveryAvailable, tab: "delivery", icon: Truck },
    { id: "upgrade", label: "Upgrade to Pro", done: false, tab: "billing", icon: Sparkles },
  ];

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20 p-3 space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-800 dark:text-blue-200">
        <Sparkles className="size-3.5" /> Smart Suggestions
      </p>
      <div className="space-y-1">
        {suggestions.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => onNavigate(s.tab)}
              className={cn("flex w-full items-center gap-2 rounded-md p-1.5 text-left text-xs transition-colors hover:bg-white/50 dark:hover:bg-white/5",
                s.done ? "opacity-50" : "")}
            >
              {s.done ? (
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
              ) : (
                <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full border border-blue-400" />
              )}
              <Icon className="size-3 shrink-0 text-blue-600 dark:text-blue-400" />
              <span className={cn(s.done ? "line-through text-muted-foreground" : "text-blue-800 dark:text-blue-200")}>{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
