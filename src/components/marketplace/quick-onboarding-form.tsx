"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Sparkles, Check, ChevronRight, ChevronLeft, Camera, Store,
  MapPin, Phone, Tag, DollarSign, FileText, Eye, Share2, LayoutDashboard,
  TrendingUp, Plus, ArrowRight, CheckCircle2, MessageCircle, Star,
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
import { useCreateVendor } from "@/lib/queries";
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

type Step = 1 | 2 | "success";

interface QuickFormState {
  // Step 1
  name: string;
  category: string;
  businessType: string;
  city: string;
  countryCode: string;
  whatsapp: string;
  photo: string; // single cover photo (used as both logo + banner)
  // Step 2
  businessDescription: string; // user's raw description for AI
}

const INITIAL_STATE: QuickFormState = {
  name: "",
  category: "",
  businessType: "",
  city: "",
  countryCode: "IN",
  whatsapp: "",
  photo: "",
  businessDescription: "",
};

// Fallback business types — used if /api/business-types returns empty (DB not seeded)
const FALLBACK_BUSINESS_TYPES = [
  "Home Baker", "Bakery", "Restaurant", "Cafe", "Cloud Kitchen", "Caterer",
  "Event Planner", "Decorator", "Florist", "Photographer", "Videographer",
  "DJ", "Makeup Artist", "Mehendi Artist", "Venue", "Rental Service",
  "Gift Shop", "Balloon Artist", "Other",
];

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
  const [publishing, setPublishing] = React.useState(false);
  const [publishStep, setPublishStep] = React.useState<string>("");
  const [continuing, setContinuing] = React.useState(false);
  const [createdVendor, setCreatedVendor] = React.useState<Vendor | null>(null);
  const [pendingPublish, setPendingPublish] = React.useState(false);

  // ── Onboarding metrics ──
  const onboardingStartTime = React.useRef<number>(Date.now());
  const publishStartTime = React.useRef<number>(0);

  // Single source of truth for vendor creation — uses TanStack Query mutation
  // with automatic cache invalidation (no custom events needed)
  const createVendor = useCreateVendor();

  // Categories for this ecosystem
  const [categories, setCategories] = React.useState<{ slug: string; label: string }[]>([]);
  const [businessTypes, setBusinessTypes] = React.useState<string[]>(FALLBACK_BUSINESS_TYPES);
  React.useEffect(() => {
    fetch(`/api/categories?ecosystem=${ecosystem}`)
      .then((r) => r.json())
      .then((data) => {
        // API returns `id` (not `slug`) — use `c.id || c.slug` to handle both
        const cats = (data.categories || []).map((c: any) => ({ slug: c.id || c.slug, label: c.label }));
        setCategories(cats);
      })
      .catch(() => {});
  }, [ecosystem]);

  // Load business types when category changes (cascading)
  React.useEffect(() => {
    if (!form.category) return;
    fetch(`/api/business-types?category=${encodeURIComponent(form.category)}`)
      .then((r) => r.json())
      .then((data) => {
        const types = (data.businessTypes || []).map((t: any) => t.label || t.value || t.name);
        setBusinessTypes(types.length > 0 ? types : FALLBACK_BUSINESS_TYPES);
      })
      .catch(() => setBusinessTypes(FALLBACK_BUSINESS_TYPES));
  }, [form.category]);

  const currency = COUNTRIES.find((c) => c.code === form.countryCode)?.currency || "USD";
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  const set = (k: keyof QuickFormState, v: any) => setForm((f) => ({ ...f, [k]: v }));

  // ── Step 1 validation ──
  const step1Valid =
    form.name.trim().length >= 2 &&
    form.category &&
    form.businessType &&
    form.city.trim().length >= 2 &&
    form.whatsapp.trim().length >= 5;

  // ── Publish (does NOT wait for AI — AI runs in background after publish) ──
  const handlePublish = async () => {
    // If not signed in, trigger auth with a special intent to resume publishing
    if (!user) {
      setPendingPublish(true);
      setAuthIntent("list-vendor-publish");
      openAuthDialog();
      return;
    }

    setPublishing(true);
    publishStartTime.current = Date.now();
    setPublishStep("Publishing your business...");
    let msgTimer1: ReturnType<typeof setTimeout> | undefined;
    let msgTimer2: ReturnType<typeof setTimeout> | undefined;
    try {
      const country = COUNTRIES.find((c) => c.code === form.countryCode);

      // Progressive loading messages
      msgTimer1 = setTimeout(() => setPublishStep("Creating your listing..."), 1500);
      msgTimer2 = setTimeout(() => setPublishStep("Almost done..."), 3000);

      // Publish immediately with the user's raw description.
      // AI enrichment (SEO, tags, tagline) runs in the background after publish.
      const payload = {
        name: form.name.trim(),
        ecosystem,
        category: migrateCategory(form.category),
        businessType: form.businessType,
        tagline: form.businessDescription.slice(0, 60) || form.name,
        description: form.businessDescription,
        city: form.city.trim(),
        countryCode: form.countryCode,
        country: country?.name || "",
        continent: country?.continent || "",
        currency,
        priceRange: "$$",
        basePrice: 0,
        tags: [form.category, form.city.toLowerCase()],
        responseTime: "24 hours",
        yearsActive: 1,
        whatsapp: form.whatsapp,
        logoUrl: form.photo || undefined,
        bannerUrl: form.photo || undefined,
        metaTitle: `${form.name} — ${form.category} in ${form.city}`,
        metaDescription: form.businessDescription.slice(0, 160),
      };

      // Use TanStack Query mutation — automatically invalidates dashboard cache
      // Generate an idempotency key to prevent duplicate vendor creation if
      // the user clicks Publish multiple times or the network retries.
      const idempotencyKey = `vendor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const result = await createVendor.mutateAsync({ ...payload, _idempotencyKey: idempotencyKey });
      const vendor = result.vendor;

      setCreatedVendor(vendor);
      setStep("success");
      onCreated(vendor);

      // ── Onboarding metrics (client-side, logged to console for now) ──
      const totalTime = Date.now() - onboardingStartTime.current;
      const publishTime = Date.now() - publishStartTime.current;
      console.log(JSON.stringify({
        type: "onboarding_completed",
        vendorId: vendor?.id,
        totalDurationMs: totalTime,
        publishDurationMs: publishTime,
        hadPhoto: !!form.photo,
        ecosystem,
      }));

      // AI enrichment, search indexing, and upload migration are now handled
      // server-side in the POST /api/vendors handler — no client fire-and-forget needed.
    } catch (err: any) {
      // Keep user inside onboarding — do NOT navigate to dashboard.
      // Show a user-friendly error (not raw Prisma error).
      toast.error(err.message || "We couldn't create your business right now. Please try again.");
    }
    if (msgTimer1) clearTimeout(msgTimer1);
    if (msgTimer2) clearTimeout(msgTimer2);
    setPublishing(false);
    setPublishStep("");
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
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Step indicator — compact */}
      <div className="flex items-center justify-between px-5 pb-2 pt-1 sm:px-6">
        <div className="flex gap-1.5">
          <StepDot active={step === 1} completed={(step as number) > 1} label="1" />
          <div className={`h-0.5 w-6 self-center ${(step as number) > 1 ? "bg-emerald-500" : "bg-muted"}`} />
          <StepDot active={step === 2} completed={false} label="2" />
        </div>
        <span className="text-[11px] text-muted-foreground">
          {step === 1 && "Step 1 of 2 — Basics"}
          {step === 2 && "Step 2 of 2 — Describe"}
        </span>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-5 pb-3 sm:px-6">
      {/* ── STEP 1: BASICS — compact spacing ── */}
      {step === 1 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-bold">Tell us about your business</h3>
            <p className="text-xs text-muted-foreground">Just the basics — complete the rest later.</p>
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

          {/* Business Type — powers AI suggestions, SEO, templates, search */}
          <div>
            <Label className="text-sm font-semibold">What best describes your business? *</Label>
            <Select value={form.businessType} onValueChange={(v) => set("businessType", v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose your business type" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {businessTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
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
              compact
              value={form.photo}
              onChange={(url) => set("photo", url)}
              hint="JPG, PNG, WebP · max 5MB"
            />
          </div>
        </div>
      )}

      {/* ── STEP 2: DESCRIBE YOUR BUSINESS — compact spacing ── */}
      {step === 2 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-bold">Describe your business</h3>
            <p className="text-xs text-muted-foreground">Write a sentence or two — AI generates SEO, tags, and more after publishing.</p>
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
            <p className="mt-1 text-xs text-muted-foreground">Just write naturally — AI handles the rest after you publish.</p>
          </div>
        </div>
      )}
      </div>

      {/* Sticky footer — always visible */}
      <div className="shrink-0 border-t border-border bg-card px-5 py-3 [padding-bottom:calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-6">
        {step === 1 && (
          <Button
            onClick={() => {
              setContinuing(true);
              setTimeout(() => { setStep(2); setContinuing(false); }, 300);
            }}
            disabled={!step1Valid || continuing}
            className="w-full gap-2 bg-brand text-brand-foreground hover:bg-brand/90"
            size="lg"
          >
            {continuing ? <Loader2 className="size-4 animate-spin" /> : <ChevronRight className="size-4" />}
            {continuing ? "Loading..." : "Continue"}
            {!continuing && <ChevronRight className="size-4" />}
          </Button>
        )}
        {step === 2 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)} disabled={publishing} className="gap-1.5">
              <ChevronLeft className="size-4" /> Back
            </Button>
            <Button
              onClick={handlePublish}
              disabled={publishing || !form.businessDescription.trim()}
              className="flex-1 gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              size="lg"
            >
              {publishing ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              {publishing ? (publishStep || "Publishing...") : user ? "Publish My Business" : "Sign In & Publish"}
            </Button>
          </div>
        )}
      </div>
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

  // ── AI Product Assistant state ──
  const [productStep, setProductStep] = React.useState<"idle" | "choose-type" | "enter-name" | "generating" | "review" | "done">("idle");
  const [productType, setProductType] = React.useState("");
  const [productName, setProductName] = React.useState("");
  const [generatedProduct, setGeneratedProduct] = React.useState<any>(null);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/vendor/${vendor.slug}` : "";

  // Product type options based on ecosystem
  const isFood = vendor.ecosystem === "FINDMYBITES";
  const PRODUCT_TYPES = isFood
    ? ["Cake", "Cupcake", "Cookies", "Brownie", "Restaurant Meal", "Other"]
    : ["Wedding Package", "Decoration Package", "Photography Package", "DJ Package", "Other"];

  // ── Guided AI Product Assistant ──
  const handleGenerateProduct = async () => {
    setProductStep("generating");
    try {
      const res = await fetch("/api/vendor/ai/generate-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: vendor.id,
          productType,
          productName: productName.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedProduct(data.product);
        setProductStep("review");
      } else {
        throw new Error(data.error || "Failed");
      }
    } catch {
      toast.error("AI generation failed. You can add products manually in the dashboard.");
      setProductStep("idle");
    }
  };

  const handlePublishProduct = async () => {
    // Product is already created in DB by the generate API — just mark as done
    setProductStep("done");
    toast.success("Product published! 🎉");
  };

  return (
    <div className="space-y-5 text-center">
      {/* Checkmark */}
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-950/30">
        <CheckCircle2 className="size-9 text-emerald-600" />
      </div>

      <div>
        <h3 className="text-xl font-bold">🎉 Congratulations!</h3>
        <div className="mt-1 flex items-center justify-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className="size-4 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <p className="mt-1 text-sm font-semibold text-emerald-600">Your business is now LIVE.</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Customers can now discover you on FindMyBites.</p>
      </div>

      {/* AI background note */}
      <div className="flex items-center gap-2 rounded-lg border border-brand-border bg-brand-soft/30 p-3 text-left">
        <Loader2 className="size-4 shrink-0 animate-spin text-brand" />
        <div>
          <p className="text-xs font-semibold">✨ AI is improving your profile in the background.</p>
          <p className="text-[11px] text-muted-foreground">This usually takes less than 30 seconds. You don't need to wait.</p>
        </div>
      </div>

      {/* Preview card with badges */}
      <div className="overflow-hidden rounded-xl border border-border text-left">
        {vendor.heroImage && (
          <div className="aspect-[16/9] bg-muted">
            <img
              src={vendor.heroImage}
              alt={vendor.name}
              className="h-full w-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
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

      {/* Build Your Store — checklist with auto-update */}
      <div className="rounded-xl border border-border bg-card p-4 text-left">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold">Build Your Store</h4>
          <span className="text-xs font-semibold text-brand">
            {Math.round(([
              true, // business created
              productStep === "done", // products
              (vendor.gallery?.length || 0) >= 3, // gallery
              false, // business hours
              !!vendor.basePrice && vendor.basePrice > 0, // pricing
              false, // social links
              false, // reviews
            ].filter(Boolean).length / 7) * 100)}%
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-brand transition-all" style={{
            width: `${Math.round(([
              true, productStep === "done", (vendor.gallery?.length || 0) >= 3,
              false, !!vendor.basePrice && vendor.basePrice > 0, false, false,
            ].filter(Boolean).length / 7) * 100)}%`
          }} />
        </div>
        <div className="mt-3 space-y-1.5">
          <StoreChecklist label="Business Created" done />
          <StoreChecklist label="Products" done={productStep === "done"} />
          <StoreChecklist label="Gallery" done={(vendor.gallery?.length || 0) >= 3} />
          <StoreChecklist label="Business Hours" done={false} />
          <StoreChecklist label="Pricing" done={!!vendor.basePrice && vendor.basePrice > 0} />
          <StoreChecklist label="Social Links" done={false} />
          <StoreChecklist label="Reviews" done={false} />
        </div>
      </div>

      {/* AI Product Assistant — guided, not automatic */}
      {productStep === "idle" && (
        <div className="rounded-lg border border-brand-border bg-brand-soft/30 p-4 text-left">
          <p className="text-xs font-semibold uppercase text-muted-foreground">⭐ Let's Build Your First Product</p>
          <p className="mt-1 text-sm font-medium">Create Your First Product with AI</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Businesses with products receive significantly more enquiries.</p>
          <Button
            size="sm"
            className="mt-2 w-full gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90"
            onClick={() => setProductStep("choose-type")}
          >
            <Sparkles className="size-3.5" /> Create Product with AI
          </Button>
        </div>
      )}

      {/* Step 1: Choose product type */}
      {productStep === "choose-type" && (
        <div className="rounded-lg border border-border bg-card p-4 text-left">
          <p className="text-sm font-semibold">What would you like to list first?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRODUCT_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => { setProductType(t); setProductStep("enter-name"); }}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  productType === t ? "border-brand bg-brand text-brand-foreground" : "border-border hover:bg-accent"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="mt-3 text-xs" onClick={() => setProductStep("idle")}>
            Cancel
          </Button>
        </div>
      )}

      {/* Step 2: Enter product name */}
      {productStep === "enter-name" && (
        <div className="rounded-lg border border-border bg-card p-4 text-left">
          <p className="text-sm font-semibold">Product Name</p>
          <p className="mt-0.5 text-xs text-muted-foreground">e.g. {isFood ? "Chocolate Truffle Cake" : "Birthday Decoration Package"}</p>
          <Input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Enter product name"
            className="mt-2"
            autoFocus
          />
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setProductStep("choose-type")}>Back</Button>
            <Button
              size="sm"
              className="flex-1 gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90"
              onClick={handleGenerateProduct}
              disabled={!productName.trim()}
            >
              <Sparkles className="size-3.5" /> Generate with AI
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Generating */}
      {productStep === "generating" && (
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <Loader2 className="mx-auto size-6 animate-spin text-brand" />
          <p className="mt-2 text-sm text-muted-foreground">AI is creating your product...</p>
        </div>
      )}

      {/* Step 4: Review */}
      {productStep === "review" && generatedProduct && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-left dark:border-emerald-900 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-4" /> AI Generated — Review & Publish
          </div>
          <div className="mt-3 space-y-2">
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Name</Label>
              <p className="text-sm font-medium">{generatedProduct.name}</p>
            </div>
            {generatedProduct.description && (
              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Description</Label>
                <p className="text-sm text-muted-foreground">{generatedProduct.description}</p>
              </div>
            )}
            {generatedProduct.price != null && (
              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Price</Label>
                <p className="text-sm font-medium">{generatedProduct.price}</p>
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setProductStep("enter-name")}>Redo</Button>
            <Button size="sm" className="flex-1 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700" onClick={handlePublishProduct}>
              <Check className="size-3.5" /> Publish Product
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Done */}
      {productStep === "done" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-left dark:border-emerald-900 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-4" /> Product Published!
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Your first product is live. Add more products in the dashboard.</p>
          <Button size="sm" variant="outline" className="mt-2 w-full gap-1.5" onClick={() => router.push("/dashboard?tab=products")}>
            View Products
          </Button>
        </div>
      )}

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

// ── Store Checklist Item (for success screen Build Your Store) ──
function StoreChecklist({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`grid size-4 shrink-0 place-items-center rounded-full ${done ? "bg-emerald-500 text-white" : "border border-muted-foreground/30"}`}>
        {done && <Check className="size-3" />}
      </span>
      <span className={done ? "text-muted-foreground line-through" : "text-foreground"}>{label}</span>
    </div>
  );
}
