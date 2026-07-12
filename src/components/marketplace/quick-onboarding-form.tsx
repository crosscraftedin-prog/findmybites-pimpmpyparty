"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Sparkles, Check, ChevronRight, ChevronLeft, Camera, Store,
  MapPin, Phone, Tag, DollarSign, FileText, Eye, Share2, LayoutDashboard,
  TrendingUp, Plus, ArrowRight, CheckCircle2, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "./image-upload";
import { useMarketplace } from "@/lib/store";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { COUNTRIES, CURRENCY_SYMBOLS, migrateCategory, ECOSYSTEM_META } from "@/lib/constants";
import { countryCodeToFlag } from "@/lib/format";
import { toast } from "sonner";
import type { Vendor } from "@/lib/types";

/**
 * QuickOnboardingForm — the new 3-minute vendor onboarding flow.
 *
 * Goal: maximize conversion by collecting only the absolute minimum,
 * using AI to generate the rest, and deferring auth until publish.
 *
 * Flow:
 *   Step 1: Business Name, Category, City, WhatsApp, One Photo, Starting Price
 *   Step 2: Describe your business → AI generates description/tagline/SEO/tags
 *   Step 3: Auth (if not signed in) → Publish → Success screen
 *
 * All other fields (languages, website, Instagram, address, etc.) are
 * completed later in the dashboard via the "Complete Your Profile" card.
 */

type Step = 1 | 2 | 3 | "success";

interface QuickFormState {
  // Step 1
  name: string;
  category: string;
  city: string;
  countryCode: string;
  whatsapp: string;
  photo: string; // single cover photo (used as both logo + banner)
  startingPrice: string;
  // Step 2
  businessDescription: string; // user's raw description for AI
  aiDescription: string;       // AI-generated description
  aiTagline: string;           // AI-generated tagline
  aiTags: string[];            // AI-generated tags
  aiSeoTitle: string;
  aiSeoDescription: string;
  aiSubcategory: string;
}

const INITIAL_STATE: QuickFormState = {
  name: "",
  category: "",
  city: "",
  countryCode: "IN",
  whatsapp: "",
  photo: "",
  startingPrice: "",
  businessDescription: "",
  aiDescription: "",
  aiTagline: "",
  aiTags: [],
  aiSeoTitle: "",
  aiSeoDescription: "",
  aiSubcategory: "",
};

// Auto-approval threshold: first N vendors are auto-approved
const AUTO_APPROVAL_THRESHOLD = 500;

export function QuickOnboardingForm({
  ecosystem,
  onCreated,
}: {
  ecosystem: "FINDMYBITES" | "PIMPMYPARTY";
  onCreated: (vendor: Vendor) => void;
}) {
  const router = useRouter();
  const openAuthDialog = useMarketplace((s) => s.openAuthDialog);
  const setAuthIntent = useMarketplace((s) => s.setAuthIntent);
  const { user, loading: sessionLoading } = useSupabaseSession();

  const [step, setStep] = React.useState<Step>(1);
  const [form, setForm] = React.useState<QuickFormState>(INITIAL_STATE);
  const [generating, setGenerating] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [createdVendor, setCreatedVendor] = React.useState<Vendor | null>(null);
  const [pendingPublish, setPendingPublish] = React.useState(false);

  // Categories for this ecosystem
  const [categories, setCategories] = React.useState<{ slug: string; label: string }[]>([]);
  React.useEffect(() => {
    fetch(`/api/categories?ecosystem=${ecosystem}`)
      .then((r) => r.json())
      .then((data) => {
        const cats = (data.categories || []).map((c: any) => ({ slug: c.slug, label: c.label }));
        setCategories(cats);
      })
      .catch(() => {});
  }, [ecosystem]);

  const currency = COUNTRIES.find((c) => c.code === form.countryCode)?.currency || "USD";
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  const set = (k: keyof QuickFormState, v: any) => setForm((f) => ({ ...f, [k]: v }));

  // ── Step 1 validation ──
  const step1Valid =
    form.name.trim().length >= 2 &&
    form.category &&
    form.city.trim().length >= 2 &&
    form.whatsapp.trim().length >= 5;

  // ── AI generation ──
  const generateWithAI = async () => {
    if (!form.businessDescription.trim()) {
      toast.error("Please describe your business first.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/vendor/ai/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.name,
          marketplace: ecosystem,
          category: form.category,
          city: form.city,
          country: COUNTRIES.find((c) => c.code === form.countryCode)?.name || "",
          specialities: form.businessDescription,
          style: "professional",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        set("aiDescription", data.description || "");
        set("aiTagline", data.tagline || "");
        set("aiTags", Array.isArray(data.businessTags) ? data.businessTags : (Array.isArray(data.tags) ? data.tags : []));
        set("aiSeoTitle", data.seoTitle || `${form.name} — ${form.category} in ${form.city}`);
        set("aiSeoDescription", data.seoDescription || data.description?.slice(0, 160) || "");
        toast.success("AI generated your business profile!");
      } else {
        // Fallback: use the user's description directly
        set("aiDescription", form.businessDescription);
        set("aiTagline", form.businessDescription.slice(0, 60));
        set("aiTags", [form.category, form.city.toLowerCase()]);
        set("aiSeoTitle", `${form.name} — ${form.category} in ${form.city}`);
        set("aiSeoDescription", form.businessDescription.slice(0, 160));
        toast.success("Profile created from your description.");
      }
    } catch {
      // Fallback on error
      set("aiDescription", form.businessDescription);
      set("aiTagline", form.businessDescription.slice(0, 60));
      set("aiTags", [form.category, form.city.toLowerCase()]);
      toast.error("AI generation failed — using your description directly.");
    }
    setGenerating(false);
  };

  // ── Publish ──
  const handlePublish = async () => {
    // If not signed in, trigger auth with a special intent to resume publishing
    if (!user) {
      setPendingPublish(true);
      setAuthIntent("list-vendor-publish");
      openAuthDialog();
      return;
    }

    setPublishing(true);
    try {
      const country = COUNTRIES.find((c) => c.code === form.countryCode);

      const payload = {
        name: form.name.trim(),
        ecosystem,
        category: migrateCategory(form.category),
        tagline: form.aiTagline || form.businessDescription.slice(0, 60) || form.name,
        description: form.aiDescription || form.businessDescription,
        city: form.city.trim(),
        countryCode: form.countryCode,
        country: country?.name || "",
        continent: country?.continent || "",
        currency,
        priceRange: "$$", // default — vendor sets pricing in dashboard
        basePrice: 0,
        tags: form.aiTags.length > 0 ? form.aiTags : [form.category, form.city.toLowerCase()],
        responseTime: "24 hours",
        yearsActive: 1,
        whatsapp: form.whatsapp,
        logoUrl: form.photo || undefined,
        bannerUrl: form.photo || undefined,
        metaTitle: form.aiSeoTitle,
        metaDescription: form.aiSeoDescription,
      };

      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish");

      setCreatedVendor(data.vendor);
      setStep("success");
      onCreated(data.vendor);
    } catch (err: any) {
      toast.error(err.message || "Failed to publish. Please try again.");
    }
    setPublishing(false);
  };

  // ── If user signs in while pending publish, auto-publish ──
  React.useEffect(() => {
    if (pendingPublish && user) {
      setPendingPublish(false);
      handlePublish();
    }
  }, [user, pendingPublish]);

  // ── SUCCESS SCREEN ──
  if (step === "success" && createdVendor) {
    return <SuccessScreen vendor={createdVendor} onGoToDashboard={() => router.push("/dashboard")} />;
  }

  // ── FORM STEPS ──
  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          <StepDot active={step === 1} completed={(step as number) > 1} label="1" />
          <div className={`h-0.5 w-8 self-center ${(step as number) > 1 ? "bg-emerald-500" : "bg-muted"}`} />
          <StepDot active={step === 2} completed={(step as number) > 2} label="2" />
          <div className={`h-0.5 w-8 self-center ${(step as number) > 2 ? "bg-emerald-500" : "bg-muted"}`} />
          <StepDot active={step === 3} completed={false} label="3" />
        </div>
        <span className="text-xs text-muted-foreground">
          {step === 1 && "Step 1 of 3 — Basics"}
          {step === 2 && "Step 2 of 3 — AI Description"}
          {step === 3 && "Step 3 of 3 — Publish"}
        </span>
      </div>

      {/* ── STEP 1: BASICS ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold">Tell us about your business</h3>
            <p className="text-sm text-muted-foreground">Just the basics — you can complete the rest later.</p>
          </div>

          {/* Business Name */}
          <div>
            <Label htmlFor="qo-name" className="text-sm font-semibold">Business Name *</Label>
            <Input
              id="qo-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Sweet Dreams Bakery"
              className="mt-1"
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <Label className="text-sm font-semibold">Category *</Label>
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose your category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City + Country */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="qo-city" className="text-sm font-semibold">City *</Label>
              <Input
                id="qo-city"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="e.g. Hyderabad"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold">Country</Label>
              <Select value={form.countryCode} onValueChange={(v) => set("countryCode", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {countryCodeToFlag(c.code)} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <Label htmlFor="qo-wa" className="text-sm font-semibold">WhatsApp Number *</Label>
            <Input
              id="qo-wa"
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="mt-1"
            />
          </div>

          {/* Photo */}
          <div>
            <Label className="text-sm font-semibold">Cover Photo *</Label>
            <p className="mb-2 text-xs text-muted-foreground">Upload one photo — it will be used as your logo and banner.</p>
            <ImageUpload
              label="Click or drag to upload"
              aspect="banner"
              value={form.photo}
              onChange={(url) => set("photo", url)}
              hint="JPG, PNG, WebP · max 5MB"
            />
          </div>

          {/* Continue */}
          <Button
            onClick={() => setStep(2)}
            disabled={!step1Valid}
            className="w-full gap-2 bg-brand text-brand-foreground hover:bg-brand/90"
            size="lg"
          >
            Continue
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* ── STEP 2: AI DESCRIPTION ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold">Describe your business</h3>
            <p className="text-sm text-muted-foreground">AI will create your description, tagline, SEO, and tags.</p>
          </div>

          <div>
            <Label htmlFor="qo-desc" className="text-sm font-semibold">Your Description *</Label>
            <Textarea
              id="qo-desc"
              value={form.businessDescription}
              onChange={(e) => set("businessDescription", e.target.value)}
              placeholder="e.g. I make eggless birthday cakes in Hyderabad. Specializing in fondant cakes, custom designs, and sugar-free options."
              className="mt-1 min-h-[100px]"
              autoFocus
            />
            <p className="mt-1 text-xs text-muted-foreground">Just write naturally — AI handles the rest.</p>
          </div>

          <Button
            onClick={generateWithAI}
            disabled={!form.businessDescription.trim() || generating}
            className="w-full gap-2"
            size="lg"
            variant="outline"
          >
            {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4 text-brand" />}
            {generating ? "Generating..." : "✨ Generate with AI"}
          </Button>

          {/* AI Results */}
          {form.aiDescription && (
            <div className="space-y-3 rounded-lg border border-brand-border bg-brand-soft/30 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                <CheckCircle2 className="size-4" />
                AI Generated — Edit if needed
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Tagline</Label>
                <Input
                  value={form.aiTagline}
                  onChange={(e) => set("aiTagline", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Description</Label>
                <Textarea
                  value={form.aiDescription}
                  onChange={(e) => set("aiDescription", e.target.value)}
                  className="mt-1 min-h-[80px]"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Tags</Label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {form.aiTags.map((tag, i) => (
                    <span key={i} className="rounded-full bg-background px-2.5 py-1 text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5">
              <ChevronLeft className="size-4" /> Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!form.aiDescription}
              className="flex-1 gap-2 bg-brand text-brand-foreground hover:bg-brand/90"
            >
              Review & Publish
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: REVIEW & PUBLISH ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold">Review & Publish</h3>
            <p className="text-sm text-muted-foreground">{user ? "Your listing will go live immediately." : "Sign in to publish your listing."}</p>
          </div>

          {/* Preview card */}
          <div className="overflow-hidden rounded-xl border border-border">
            {form.photo && (
              <div className="aspect-[16/9] bg-muted">
                <img src={form.photo} alt={form.name} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="p-4">
              <h4 className="font-bold">{form.name}</h4>
              <p className="text-sm text-muted-foreground">{form.aiTagline || form.businessDescription.slice(0, 60)}</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Tag className="size-3" /> {categories.find((c) => c.slug === form.category)?.label || form.category}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {form.city}</span>
              </div>
            </div>
          </div>

          {/* Auth status */}
          {!user && !sessionLoading && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
              <p className="font-medium text-amber-900 dark:text-amber-200">Almost there!</p>
              <p className="mt-0.5 text-amber-700 dark:text-amber-300">Sign in with Google or Email to publish your listing. You've already filled everything in — just one click left.</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-1.5">
              <ChevronLeft className="size-4" /> Back
            </Button>
            <Button
              onClick={handlePublish}
              disabled={publishing}
              className="flex-1 gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              size="lg"
            >
              {publishing ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              {publishing ? "Publishing..." : user ? "Publish Business" : "Sign In & Publish"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step Dot Component ──
function StepDot({ active, completed, label }: { active: boolean; completed: boolean; label: string }) {
  return (
    <div
      className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors ${
        completed ? "bg-emerald-500 text-white" : active ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"
      }`}
    >
      {completed ? <Check className="size-3.5" /> : label}
    </div>
  );
}

// ── Success Screen ──
function SuccessScreen({ vendor, onGoToDashboard }: { vendor: Vendor; onGoToDashboard: () => void }) {
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/vendor/${vendor.slug}` : "";

  return (
    <div className="space-y-5 text-center">
      {/* Checkmark */}
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-950/30">
        <CheckCircle2 className="size-9 text-emerald-600" />
      </div>

      <div>
        <h3 className="text-xl font-bold">🎉 Congratulations!</h3>
        <p className="mt-1 text-sm text-muted-foreground">Your business is <span className="font-semibold text-emerald-600">LIVE</span>.</p>
      </div>

      {/* Preview card with badges */}
      <div className="overflow-hidden rounded-xl border border-border text-left">
        {vendor.heroImage && (
          <div className="aspect-[16/9] bg-muted">
            <img src={vendor.heroImage} alt={vendor.name} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="p-4">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              ● LIVE
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              🟢 FREE PLAN
            </span>
          </div>
          <h4 className="font-bold">{vendor.name}</h4>
          <p className="text-sm text-muted-foreground">{vendor.tagline}</p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {vendor.city}, {vendor.country}</span>
          </div>
        </div>
      </div>

      {/* AI Product Suggestion */}
      <div className="rounded-lg border border-brand-border bg-brand-soft/30 p-4 text-left">
        <p className="text-xs font-semibold uppercase text-muted-foreground">⭐ Recommended Next Step</p>
        <p className="mt-1 text-sm font-medium">Create Your First Product with AI</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Businesses with products get 3x more enquiries. AI creates a product from your business info in seconds.</p>
        <Button
          size="sm"
          className="mt-2 w-full gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90"
          onClick={() => router.push("/dashboard?tab=products&action=new")}
        >
          <Sparkles className="size-3.5" /> Create Product with AI
        </Button>
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        <Button className="w-full gap-2" onClick={onGoToDashboard}>
          <LayoutDashboard className="size-4" /> Go to Dashboard
        </Button>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" className="gap-1.5 text-xs" onClick={() => window.open(`/vendor/${vendor.slug}`, "_blank")}>
            <Eye className="size-3.5" /> View
          </Button>
          <Button
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => {
              const waText = encodeURIComponent(`Check out ${vendor.name} on FindMyBites! ${shareUrl}`);
              window.open(`https://wa.me/?text=${waText}`, "_blank");
            }}
          >
            <MessageCircle className="size-3.5" /> WhatsApp
          </Button>
          <Button
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              toast.success("Link copied!");
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <Check className="size-3.5 text-emerald-600" /> : <Share2 className="size-3.5" />} Copy
          </Button>
        </div>
      </div>
    </div>
  );
}
