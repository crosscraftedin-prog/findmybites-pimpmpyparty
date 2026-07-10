"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ChevronLeft, ChevronRight, Loader2, Sparkles, Upload, X,
  Image as ImageIcon, Eye, Star, AlertCircle, AlertTriangle, Wand2, Plus, PartyPopper, Monitor, Tablet, Smartphone,
  Boxes, Clock, CalendarDays, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Vendor } from "@/lib/types";
import { GalleryUpload } from "./image-upload";

interface ProductWizardProps {
  vendor: Vendor;
  initialData?: any;
  /** Returns the saved product (with slug) on success, or null/throws on failure. */
  onSave: (data: any) => Promise<{ slug?: string; id?: string } | null | void>;
  onClose: () => void;
  saving: boolean;
}

const STEPS = [
  { id: 1, title: "Basic Info", icon: Star },
  { id: 2, title: "Photos", icon: ImageIcon },
  { id: 3, title: "Pricing", icon: Star },
  { id: 4, title: "Variants", icon: Star },
  { id: 5, title: "Details", icon: Star },
  { id: 6, title: "SEO", icon: Star },
  { id: 7, title: "Inventory", icon: Boxes },
  { id: 8, title: "Preview", icon: Eye },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", GBP: "£", AED: "AED", AUD: "A$", CAD: "CA$", SGD: "S$", EUR: "€",
};

export function ProductWizard({ vendor, initialData, onSave, onClose, saving }: ProductWizardProps) {
  const [step, setStep] = React.useState(1);
  const [aiGenerating, setAiGenerating] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<string | null>(null);
  const [autoSaving, setAutoSaving] = React.useState(false);
  const [publishError, setPublishError] = React.useState<string | null>(null);
  const [savedProductSlug, setSavedProductSlug] = React.useState<string | null>(null);

  const symbol = CURRENCY_SYMBOLS[vendor.currency] ?? vendor.currency ?? "$";
  const isFood = vendor.ecosystem === "FINDMYBITES";

  // Form state
  const [form, setForm] = React.useState<any>({
    name: initialData?.name || "",
    category: initialData?.category || vendor.category || "",
    subCategory: initialData?.subCategory || "",
    shortDescription: initialData?.shortDescription || "",
    description: initialData?.description || "",
    images: initialData?.images || [],
    videoUrl: initialData?.videoUrl || "",
    price: initialData?.price || "",
    offerPrice: initialData?.offerPrice || "",
    startingFromPrice: initialData?.startingFromPrice || false,
    priceOnRequest: initialData?.priceOnRequest || false,
    hidePrice: initialData?.hidePrice || false,
    currency: vendor.currency || "INR",
    isAvailable: initialData?.isAvailable ?? true,
    status: initialData?.status || "draft",
    // Food
    flavours: initialData?.flavours || "",
    weight: initialData?.weight || "",
    servings: initialData?.servings || "",
    prepTime: initialData?.prepTime || "",
    deliveryAvailable: initialData?.deliveryAvailable || false,
    pickupAvailable: initialData?.pickupAvailable || false,
    eggless: initialData?.eggless || false,
    vegetarian: initialData?.vegetarian || false,
    vegan: initialData?.vegan || false,
    halal: initialData?.halal || false,
    glutenFree: initialData?.glutenFree || false,
    ingredients: initialData?.ingredients || "",
    allergenInfo: initialData?.allergenInfo || "",
    // Party
    duration: initialData?.duration || "",
    capacity: initialData?.capacity || "",
    includedServices: initialData?.includedServices || "",
    optionalServices: initialData?.optionalServices || "",
    equipmentIncluded: initialData?.equipmentIncluded || "",
    indoorOutdoor: initialData?.indoorOutdoor || "",
    travelAvailable: initialData?.travelAvailable || false,
    bookingNotice: initialData?.bookingNotice || "",
    cancellationPolicy: initialData?.cancellationPolicy || "",
    // SEO
    metaTitle: initialData?.metaTitle || "",
    metaDescription: initialData?.metaDescription || "",
    tags: initialData?.tags || "",
    // Variants & Inventory
    variants: initialData?.variants || [],
    stockType: initialData?.stockType || "unlimited",
    stockCount: initialData?.stockCount ?? "",
    lowStockThreshold: initialData?.lowStockThreshold ?? 5,
    // ── Inventory & Availability Management ──
    maxOrdersPerDay: initialData?.maxOrdersPerDay ?? "",
    availabilityMode: initialData?.availabilityMode || "always",
    availableDays: initialData?.availableDays || [],
    availabilityStart: initialData?.availabilityStart || "",
    availabilityEnd: initialData?.availabilityEnd || "",
    preparationTimeCategory: initialData?.preparationTimeCategory || "",
    preparationTimeCustom: initialData?.preparationTimeCustom || "",
    bookingNoticeHours: initialData?.bookingNoticeHours ?? "",
    serviceAreaType: initialData?.serviceAreaType || "",
    serviceCities: initialData?.serviceCities || [],
    seasonLabel: initialData?.seasonLabel || "",
    // Scheduling
    scheduledPublishAt: initialData?.scheduledPublishAt || "",
    scheduledExpiryAt: initialData?.scheduledExpiryAt || "",
    // Featured
    featured: initialData?.featured || false,
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  // ── Auto-save draft (every 15s) ──
  const formRef = React.useRef(form);
  React.useEffect(() => {
    formRef.current = form;
  }, [form]);

  const autoSave = React.useCallback(async () => {
    if (!formRef.current.name?.trim()) return; // don't save empty
    setAutoSaving(true);
    try {
      // Save to localStorage as draft
      const draftKey = `product-draft-${vendor.id}`;
      localStorage.setItem(draftKey, JSON.stringify({ ...formRef.current, _savedAt: Date.now() }));
      setLastSaved(new Date().toLocaleTimeString());
    } catch {}
    setAutoSaving(false);
  }, [vendor.id]);

  React.useEffect(() => {
    const interval = setInterval(autoSave, 15000);
    const handleBeforeUnload = () => autoSave();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [autoSave]);

  // Restore draft on mount
  React.useEffect(() => {
    if (!initialData) {
      const draftKey = `product-draft-${vendor.id}`;
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed.name && confirm("Found an unsaved draft. Restore it?")) {
            setForm(parsed);
            toast.success("Draft restored");
          }
        } catch {}
      }
    }
  }, [vendor.id, initialData]);

  // ── Validation ──
  const validation = React.useMemo(() => {
    const checks = [
      { id: "name", label: "Product Name", passed: !!form.name?.trim() },
      { id: "category", label: "Category", passed: !!form.category },
      { id: "images", label: "At least 1 Image", passed: form.images?.length > 0 },
      { id: "description", label: "Description", passed: !!form.description?.trim() && form.description.length > 20 },
      { id: "price", label: "Price or Price on Request", passed: !!form.price || form.priceOnRequest },
      { id: "availability", label: "Availability", passed: form.isAvailable !== undefined },
    ];
    const passedCount = checks.filter(c => c.passed).length;
    return { checks, passedCount, total: checks.length, allPassed: passedCount === checks.length };
  }, [form]);

  // ── Quality Score ──
  const qualityScore = React.useMemo(() => {
    let score = 0;
    if (form.name?.trim()) score += 10;
    if (form.category) score += 10;
    if (form.images?.length >= 1) score += 15;
    if (form.images?.length >= 3) score += 10;
    if (form.images?.length >= 5) score += 5;
    if (form.description?.length > 50) score += 15;
    if (form.description?.length > 150) score += 5;
    if (form.price || form.priceOnRequest) score += 10;
    if (form.shortDescription?.trim()) score += 5;
    if (form.metaTitle?.trim()) score += 5;
    if (form.metaDescription?.trim()) score += 5;
    if (form.tags?.trim()) score += 5;
    return Math.min(score, 100);
  }, [form]);

  const qualityStars = Math.round(qualityScore / 20);

  // ── SEO Score ──
  const seoScore = React.useMemo(() => {
    let score = 0;
    if (form.metaTitle?.trim()) {
      score += 25;
      if (form.metaTitle.length >= 30 && form.metaTitle.length <= 60) score += 10;
    }
    if (form.metaDescription?.trim()) {
      score += 25;
      if (form.metaDescription.length >= 120 && form.metaDescription.length <= 160) score += 10;
    }
    if (form.tags?.trim()) score += 20;
    if (form.images?.length > 0) score += 10;
    return Math.min(score, 100);
  }, [form]);

  const seoLabel = seoScore >= 80 ? "Excellent" : seoScore >= 50 ? "Good" : "Poor";

  // ── Success state ──
  const [published, setPublished] = React.useState(false);
  const [previewDevice, setPreviewDevice] = React.useState<"desktop" | "tablet" | "mobile">("desktop");

  // ── AI Product Writer ──
  const generateWithAI = async () => {
    if (!form.name?.trim()) {
      toast.error("Enter a product name first");
      return;
    }
    setAiGenerating(true);
    const ts = () => new Date().toISOString();
    console.log(`[AI-WRITER] ${ts()} ═══════════════════════════════════════`);
    console.log(`[AI-WRITER] ${ts()} Button clicked — name="${form.name}"`);

    const requestBody = {
      name: form.name,
      category: form.category,
      ecosystem: vendor.ecosystem,
      city: vendor.city,
    };
    console.log(`[AI-WRITER] ${ts()} Request body:`, JSON.stringify(requestBody));

    // ── FETCH START ──
    console.log(`[AI-WRITER] ${ts()} fetch() STARTING — POST /api/ai/product-writer`);
    const fetchStart = Date.now();

    let res: Response;
    try {
      res = await fetch("/api/ai/product-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
    } catch (fetchErr: any) {
      // ── SCENARIO A: Browser fetch() itself threw — never received a response ──
      const fetchEnd = Date.now();
      console.error(`[AI-WRITER] ${ts()} ❌❌❌ FETCH ITSELF THREW (${fetchEnd - fetchStart}ms)`);
      console.error(`[AI-WRITER] ${ts()} error.name: ${fetchErr?.name}`);
      console.error(`[AI-WRITER] ${ts()} error.message: ${fetchErr?.message}`);
      console.error(`[AI-WRITER] ${ts()} error.cause: ${fetchErr?.cause?.message ?? fetchErr?.cause}`);
      console.error(`[AI-WRITER] ${ts()} error.stack: ${fetchErr?.stack?.split('\n').slice(0, 5).join('\n')}`);
      console.error(`[AI-WRITER] ${ts()} THIS IS SCENARIO A — browser never received a response`);
      toast.error(fetchErr?.message || "Network error — could not reach server");
      setAiGenerating(false);
      return;
    }

    // ── FETCH COMPLETED — browser received a response ──
    const fetchEnd = Date.now();
    console.log(`[AI-WRITER] ${ts()} fetch() COMPLETED — status: ${res.status} ${res.statusText} (${fetchEnd - fetchStart}ms)`);
    console.log(`[AI-WRITER] ${ts()} Response content-type: ${res.headers.get("content-type")}`);

    // ── Read raw text BEFORE parsing JSON ──
    const rawText = await res.text();
    console.log(`[AI-WRITER] ${ts()} Raw response text (${rawText.length} chars): ${rawText.slice(0, 300)}`);

    // ── Parse JSON ──
    let data: any;
    try {
      data = JSON.parse(rawText);
      console.log(`[AI-WRITER] ${ts()} JSON parsed — keys: ${Object.keys(data)}`);
    } catch (parseErr: any) {
      console.error(`[AI-WRITER] ${ts()} ❌ JSON PARSE FAILED: ${parseErr.message}`);
      console.error(`[AI-WRITER] ${ts()} Raw text was: ${rawText.slice(0, 200)}`);
      toast.error("Server returned non-JSON response");
      setAiGenerating(false);
      return;
    }

    // ── Check HTTP status ──
    if (!res.ok) {
      console.error(`[AI-WRITER] ${ts()} ❌ API returned HTTP ${res.status}: ${data.error}`);
      toast.error(data.error || `AI generation failed (HTTP ${res.status})`);
      setAiGenerating(false);
      return;
    }

    // ── Success — apply content ──
    if (data.description) set("description", data.description);
    if (data.shortDescription) set("shortDescription", data.shortDescription);
    if (data.metaTitle) set("metaTitle", data.metaTitle);
    if (data.metaDescription) set("metaDescription", data.metaDescription);
    if (data.tags) set("tags", data.tags);

    // ── Log ai_source metric ──
    const source = data.ai_source || (data._fallback ? "Fallback" : "LLM");
    console.log(`[AI-WRITER] ${ts()} ✅ Content applied to form (ai_source: ${source})`);

    // ── Dev-only warning when fallback is used (never shown to production users) ──
    if (process.env.NODE_ENV !== "production" && source === "Fallback") {
      console.warn(`[AI-WRITER] ⚠️ Template fallback was used — LLM was unavailable or timed out`);
    }

    toast.success("AI generated content — review and edit!");
    setAiGenerating(false);
  };

  // ── Auto-generate SEO ──
  const generateSEO = () => {
    if (!form.name) return;
    const seoTitle = form.name.length > 60 ? form.name.slice(0, 57) + "…" : form.name;
    const seoDesc = form.shortDescription || form.description?.slice(0, 155) || `${form.name} — available on FindMyBites × PimpMyParty`;
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    set("metaTitle", seoTitle);
    set("metaDescription", seoDesc);
    if (!form.tags) set("tags", `${form.category}, ${form.name}, ${vendor.city}`);
    toast.success("SEO auto-generated — review and edit");
  };

  // ── Publish ──
  const handlePublish = async () => {
    if (!validation.allPassed) {
      toast.error("Please complete all required fields before publishing");
      setStep(1);
      return;
    }
    const payload = {
      ...form,
      price: form.price ? Number(form.price) : 0,
      offerPrice: form.offerPrice === "" || form.offerPrice == null ? null : Number(form.offerPrice),
      capacity: form.capacity === "" || form.capacity == null ? null : Number(form.capacity),
      duration: form.duration === "" || form.duration == null ? null : Number(form.duration),
      status: "active",
      variants: form.variants?.length > 0 ? JSON.stringify(form.variants) : null,
      // Normalise inventory fields for the API
      stockCount: form.stockCount === "" ? null : Number(form.stockCount),
      lowStockThreshold: Number(form.lowStockThreshold) || 5,
      maxOrdersPerDay: form.maxOrdersPerDay === "" ? null : Number(form.maxOrdersPerDay),
      bookingNoticeHours: form.bookingNoticeHours === "" ? null : Number(form.bookingNoticeHours),
      availabilityStart: form.availabilityStart ? new Date(form.availabilityStart).toISOString() : null,
      availabilityEnd: form.availabilityEnd ? new Date(form.availabilityEnd).toISOString() : null,
    };
    localStorage.removeItem(`product-draft-${vendor.id}`);
    setPublishError(null);
    try {
      const result = await onSave(payload);
      // Only show success if onSave returned a product with a slug (or didn't throw)
      // If onSave returns null/undefined without throwing, assume void and check indirectly
      if (result && typeof result === "object" && result.slug) {
        setSavedProductSlug(result.slug);
      }
      setPublished(true);
    } catch (e: any) {
      const msg = e?.message || "Failed to publish product. Please try again.";
      setPublishError(msg);
      toast.error(msg);
      // Do NOT set published=true — stay on the form so the user can retry
    }
  };

  const handleSaveDraft = async () => {
    const payload = {
      ...form,
      price: form.price ? Number(form.price) : 0,
      offerPrice: form.offerPrice === "" || form.offerPrice == null ? null : Number(form.offerPrice),
      capacity: form.capacity === "" || form.capacity == null ? null : Number(form.capacity),
      duration: form.duration === "" || form.duration == null ? null : Number(form.duration),
      status: "draft",
      stockCount: form.stockCount === "" ? null : Number(form.stockCount),
      lowStockThreshold: Number(form.lowStockThreshold) || 5,
      maxOrdersPerDay: form.maxOrdersPerDay === "" ? null : Number(form.maxOrdersPerDay),
      bookingNoticeHours: form.bookingNoticeHours === "" ? null : Number(form.bookingNoticeHours),
      availabilityStart: form.availabilityStart ? new Date(form.availabilityStart).toISOString() : null,
      availabilityEnd: form.availabilityEnd ? new Date(form.availabilityEnd).toISOString() : null,
    };
    localStorage.removeItem(`product-draft-${vendor.id}`);
    await onSave(payload);
  };

  const canProceed = React.useMemo(() => {
    if (step === 1) return !!form.name?.trim() && !!form.category;
    if (step === 2) return true; // photos optional on this step
    if (step === 3) return !!form.price || form.priceOnRequest;
    return true;
  }, [step, form]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full hover:bg-muted">
            <X className="size-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold">{initialData ? "Edit" : "New"} {isFood ? "Product" : "Package"}</h2>
            <p className="text-[10px] text-muted-foreground">
              {autoSaving ? "Saving…" : lastSaved ? `Last saved ${lastSaved}` : "Auto-save enabled"}
            </p>
          </div>
        </div>
        {/* Quality Score */}
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={cn("size-3", i <= qualityStars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
            ))}
          </div>
          <span className="text-xs font-bold">{qualityScore}%</span>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isCompleted = step > s.id;
          return (
            <React.Fragment key={s.id}>
              <button
                onClick={() => step > s.id && setStep(s.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors",
                  isActive ? "bg-brand/10 text-brand" : isCompleted ? "text-emerald-600" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "grid size-5 place-items-center rounded-full text-[10px]",
                  isActive ? "bg-brand text-white" : isCompleted ? "bg-emerald-500 text-white" : "bg-muted"
                )}>
                  {isCompleted ? <Check className="size-3" /> : s.id}
                </div>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn("h-0.5 flex-1", isCompleted ? "bg-emerald-400" : "bg-muted")} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Basic Information</h3>
                  <div>
                    <Label htmlFor="p-name">{isFood ? "Product" : "Package"} Name *</Label>
                    <Input id="p-name" value={form.name} onChange={e => set("name", e.target.value)}
                      placeholder={isFood ? "e.g. Chocolate Truffle Cake" : "e.g. Premium Wedding Photography"} className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="p-cat">Category *</Label>
                      <select id="p-cat" value={form.category} onChange={e => set("category", e.target.value)}
                        className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">Select…</option>
                        <option value="bakers-bakery">Bakers & Bakery</option>
                        <option value="caterers">Caterers</option>
                        <option value="chef-staff">Private Chef</option>
                        <option value="food-trucks">Food Trucks</option>
                        <option value="decorators">Decorators</option>
                        <option value="photographers">Photographers</option>
                        <option value="videographers">Videographers</option>
                        <option value="djs">DJs</option>
                        <option value="venues">Venues</option>
                        <option value="florists">Florists</option>
                        <option value="makeup-artists">Makeup Artists</option>
                        <option value="event-planners">Event Planners</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="p-subcat">Subcategory</Label>
                      <Input id="p-subcat" value={form.subCategory} onChange={e => set("subCategory", e.target.value)}
                        placeholder="e.g. Wedding Cakes" className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="p-short">Short Description</Label>
                    <Input id="p-short" value={form.shortDescription} onChange={e => set("shortDescription", e.target.value)}
                      placeholder="One-line summary shown in product cards" className="mt-1" maxLength={120} />
                    <p className="mt-1 text-[10px] text-muted-foreground">{(form.shortDescription || "").length}/120</p>
                  </div>
                  {/* AI Writer */}
                  <div className="rounded-xl border border-purple-200 bg-purple-50 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="size-4 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-900">AI Product Writer</span>
                    </div>
                    <p className="text-xs text-purple-700 mb-2">Generate description, SEO, and tags from the product name.</p>
                    <Button onClick={generateWithAI} disabled={aiGenerating || !form.name}
                      size="sm" className="gap-1.5 bg-purple-600 text-white hover:bg-purple-700">
                      {aiGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
                      {aiGenerating ? "Generating…" : "Generate with AI"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Photos */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Photos & Video</h3>
                  <div>
                    <Label>Product Images</Label>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Drag & drop or click to upload. First image is the cover.
                    </p>
                    <GalleryUpload
                      images={form.images || []}
                      onChange={(urls) => { set("images", urls); autoSave(); }}
                      maxImages={10}
                      vendorId={vendor.id}
                      folder="products"
                    />
                  </div>
                  <div>
                    <Label htmlFor="p-video">Product Video URL (optional)</Label>
                    <Input id="p-video" value={form.videoUrl} onChange={e => set("videoUrl", e.target.value)}
                      placeholder="YouTube or Instagram Reel URL" className="mt-1" />
                  </div>
                </div>
              )}

              {/* Step 3: Pricing */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Pricing</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="p-price">Regular Price ({symbol})</Label>
                      <Input id="p-price" type="number" value={form.price} onChange={e => set("price", e.target.value)}
                        placeholder="0" className="mt-1" disabled={form.priceOnRequest} />
                    </div>
                    <div>
                      <Label htmlFor="p-offer">Offer Price ({symbol})</Label>
                      <Input id="p-offer" type="number" value={form.offerPrice} onChange={e => set("offerPrice", e.target.value)}
                        placeholder="0" className="mt-1" disabled={form.priceOnRequest || form.hidePrice} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.startingFromPrice} onChange={e => set("startingFromPrice", e.target.checked)}
                        className="size-4 rounded border-border" />
                      Show "Starting from" prefix
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.priceOnRequest} onChange={e => { set("priceOnRequest", e.target.checked); if (e.target.checked) set("hidePrice", false); }}
                        className="size-4 rounded border-border" />
                      Price on request (hide price, show "Contact for price")
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.hidePrice} onChange={e => { set("hidePrice", e.target.checked); if (e.target.checked) set("priceOnRequest", false); }}
                        className="size-4 rounded border-border" />
                      Hide price completely
                    </label>
                  </div>
                </div>
              )}

              {/* Step 4: Variants & Inventory */}
              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Variants & Inventory</h3>

                  {/* Variants */}
                  <div>
                    <Label>Variants (optional)</Label>
                    <p className="text-xs text-muted-foreground mb-2">Add size/weight/package options with different prices</p>
                    {form.variants?.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {form.variants.map((v: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 rounded-lg border border-border p-2">
                            <Input value={v.name} onChange={(e) => {
                              const variants = [...form.variants]; variants[idx] = { ...v, name: e.target.value }; set("variants", variants);
                            }} placeholder="e.g. 1kg" className="h-8 flex-1 text-sm" />
                            <Input value={v.price} onChange={(e) => {
                              const variants = [...form.variants]; variants[idx] = { ...v, price: e.target.value }; set("variants", variants);
                            }} placeholder="Price" type="number" className="h-8 w-20 text-sm" />
                            <button onClick={() => set("variants", form.variants.filter((_: any, i: number) => i !== idx))}
                              className="grid size-7 place-items-center rounded text-red-600 hover:bg-red-50"><X className="size-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button variant="outline" size="sm" onClick={() => {
                      set("variants", [...(form.variants || []), { name: "", price: "", offerPrice: "", sku: "", available: true }]);
                    }} className="gap-1">
                      <Plus className="size-3.5" /> Add Variant
                    </Button>
                  </div>

                  {/* Inventory */}
                  <div className="rounded-xl border border-border p-3">
                    <Label className="mb-2 block">Inventory</Label>
                    <div className="flex gap-2 mb-2">
                      {["unlimited", "limited", "out_of_stock"].map(s => (
                        <button key={s} onClick={() => set("stockType", s)}
                          className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium",
                            form.stockType === s ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground")}>
                          {s === "unlimited" ? "Unlimited" : s === "limited" ? "Limited" : "Out of Stock"}
                        </button>
                      ))}
                    </div>
                    {form.stockType === "limited" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="p-stock" className="text-xs">Quantity Available</Label>
                          <Input id="p-stock" type="number" value={form.stockCount} onChange={e => set("stockCount", e.target.value)}
                            placeholder="50" className="mt-1 h-9" />
                        </div>
                        <div>
                          <Label htmlFor="p-low" className="text-xs">Low Stock Alert At</Label>
                          <Input id="p-low" type="number" value={form.lowStockThreshold} onChange={e => set("lowStockThreshold", e.target.value)}
                            placeholder="5" className="mt-1 h-9" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scheduling */}
                  <div className="rounded-xl border border-border p-3">
                    <Label className="mb-2 block">Scheduling (optional)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="p-pub" className="text-xs">Schedule Publish Date</Label>
                        <Input id="p-pub" type="datetime-local" value={form.scheduledPublishAt} onChange={e => set("scheduledPublishAt", e.target.value)}
                          className="mt-1 h-9 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="p-exp" className="text-xs">Schedule Expiry Date</Label>
                        <Input id="p-exp" type="datetime-local" value={form.scheduledExpiryAt} onChange={e => set("scheduledExpiryAt", e.target.value)}
                          className="mt-1 h-9 text-sm" />
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground">Leave empty to publish immediately. Expiry auto-hides the product.</p>
                  </div>

                  {/* Featured */}
                  <div className="flex items-center gap-2 rounded-xl border border-border p-3">
                    <input type="checkbox" id="p-featured" checked={form.featured} onChange={e => set("featured", e.target.checked)}
                      className="size-4 rounded border-border" />
                    <Label htmlFor="p-featured" className="text-sm cursor-pointer">
                      Feature this product <span className="text-xs text-muted-foreground">(appears first on your profile — Free plan: max 2)</span>
                    </Label>
                  </div>
                </div>
              )}

              {/* Step 5: Details (dynamic by ecosystem) */}
              {step === 5 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">{isFood ? "Food Product Details" : "Package Details"}</h3>
                  <div>
                    <Label htmlFor="p-desc">Full Description</Label>
                    <Textarea id="p-desc" value={form.description} onChange={e => set("description", e.target.value)}
                      placeholder="Describe your product in detail…" className="mt-1 min-h-[100px]" />
                  </div>
                  {isFood ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label htmlFor="p-flav">Flavours</Label><Input id="p-flav" value={form.flavours} onChange={e => set("flavours", e.target.value)} placeholder="Chocolate, Vanilla…" className="mt-1" /></div>
                      <div><Label htmlFor="p-wt">Weight</Label><Input id="p-wt" value={form.weight} onChange={e => set("weight", e.target.value)} placeholder="1kg, 2kg…" className="mt-1" /></div>
                      <div><Label htmlFor="p-serv">Serves</Label><Input id="p-serv" value={form.servings} onChange={e => set("servings", e.target.value)} placeholder="10-12 people" className="mt-1" /></div>
                      <div><Label htmlFor="p-prep">Preparation Time</Label><Input id="p-prep" value={form.prepTime} onChange={e => set("prepTime", e.target.value)} placeholder="24 hours" className="mt-1" /></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label htmlFor="p-dur">Duration</Label><Input id="p-dur" value={form.duration} onChange={e => set("duration", e.target.value)} placeholder="4 hours" className="mt-1" /></div>
                      <div><Label htmlFor="p-cap">Guest Capacity</Label><Input id="p-cap" type="number" value={form.capacity} onChange={e => set("capacity", e.target.value)} placeholder="100" className="mt-1" /></div>
                      <div><Label htmlFor="p-inc">Included Services</Label><Input id="p-inc" value={form.includedServices} onChange={e => set("includedServices", e.target.value)} placeholder="Photography, Album…" className="mt-1" /></div>
                      <div><Label htmlFor="p-eqp">Equipment Included</Label><Input id="p-eqp" value={form.equipmentIncluded} onChange={e => set("equipmentIncluded", e.target.value)} placeholder="Camera, Lights…" className="mt-1" /></div>
                    </div>
                  )}
                  {isFood && (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { k: "eggless", l: "Eggless" }, { k: "vegetarian", l: "Vegetarian" },
                        { k: "vegan", l: "Vegan" }, { k: "halal", l: "Halal" },
                        { k: "glutenFree", l: "Gluten Free" },
                      ].map(o => (
                        <label key={o.k} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={form[o.k]} onChange={e => set(o.k, e.target.checked)} className="size-4 rounded border-border" />
                          {o.l}
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.deliveryAvailable} onChange={e => set("deliveryAvailable", e.target.checked)} className="size-4 rounded border-border" />
                      Delivery Available
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.pickupAvailable} onChange={e => set("pickupAvailable", e.target.checked)} className="size-4 rounded border-border" />
                      Pickup Available
                    </label>
                  </div>
                </div>
              )}

              {/* Step 6: SEO */}
              {step === 6 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">SEO Settings</h3>
                    <Button onClick={generateSEO} variant="outline" size="sm" className="gap-1.5">
                      <Wand2 className="size-3.5" /> Auto-generate
                    </Button>
                  </div>
                  <div>
                    <Label htmlFor="p-seo-title">SEO Title</Label>
                    <Input id="p-seo-title" value={form.metaTitle} onChange={e => set("metaTitle", e.target.value)}
                      placeholder="Auto-generated from product name" className="mt-1" maxLength={60} />
                    <p className="mt-1 text-[10px] text-muted-foreground">{(form.metaTitle || "").length}/60</p>
                  </div>
                  <div>
                    <Label htmlFor="p-seo-desc">SEO Description</Label>
                    <Textarea id="p-seo-desc" value={form.metaDescription} onChange={e => set("metaDescription", e.target.value)}
                      placeholder="Auto-generated from description" className="mt-1 min-h-[60px]" maxLength={160} />
                    <p className="mt-1 text-[10px] text-muted-foreground">{(form.metaDescription || "").length}/160</p>
                  </div>
                  <div>
                    <Label htmlFor="p-tags">Tags (comma-separated)</Label>
                    <Input id="p-tags" value={form.tags} onChange={e => set("tags", e.target.value)}
                      placeholder="wedding cake, chocolate, eggless" className="mt-1" />
                  </div>
                </div>
              )}

              {/* Step 7: Inventory & Availability */}
              {step === 7 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold">
                      <Boxes className="size-5 text-primary" /> Inventory & Availability
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Control stock, availability windows, preparation time, and booking rules. You can fine-tune these later from the Inventory manager.
                    </p>
                  </div>

                  {/* Status */}
                  <WizardCard icon={<Star className="size-4" />} title="Publishing Status">
                    <Label className="text-xs">Status</Label>
                    <select
                      value={form.status}
                      onChange={(e) => set("status", e.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="active">Active (visible in marketplace)</option>
                      <option value="draft">Draft (hidden, work in progress)</option>
                      <option value="seasonal">Seasonal (limited-time offering)</option>
                      <option value="temporarily_unavailable">Temporarily Unavailable</option>
                    </select>
                  </WizardCard>

                  {/* Stock */}
                  <WizardCard icon={<Boxes className="size-4" />} title="Stock">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Stock type</Label>
                        <select
                          value={form.stockType}
                          onChange={(e) => set("stockType", e.target.value)}
                          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="unlimited">Unlimited Stock</option>
                          <option value="limited">Limited Stock</option>
                        </select>
                      </div>
                      {form.stockType === "limited" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Quantity available</Label>
                          <Input
                            type="number" min={0} placeholder="e.g. 12"
                            value={form.stockCount}
                            onChange={(e) => set("stockCount", e.target.value)}
                          />
                          <p className="text-[10px] text-muted-foreground">e.g. 12 Cakes Remaining — auto-decreases after orders.</p>
                        </div>
                      )}
                    </div>
                    {form.stockType === "limited" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Low-stock alert threshold</Label>
                        <Input
                          type="number" min={0}
                          value={form.lowStockThreshold}
                          onChange={(e) => set("lowStockThreshold", e.target.value)}
                          className="max-w-[160px]"
                        />
                      </div>
                    )}
                  </WizardCard>

                  {/* Availability */}
                  <WizardCard icon={<CalendarDays className="size-4" />} title="Availability">
                    <Label className="text-xs">Availability mode</Label>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {[
                        { v: "always", l: "Always Available" },
                        { v: "selected_days", l: "Selected Days" },
                        { v: "date_range", l: "Date Range" },
                      ].map((m) => (
                        <button
                          key={m.v}
                          type="button"
                          onClick={() => set("availabilityMode", m.v)}
                          className={`rounded-lg border p-2.5 text-xs font-medium transition ${form.availabilityMode === m.v ? "border-primary ring-1 ring-primary" : "border-border hover:bg-accent"}`}
                        >
                          {m.l}
                        </button>
                      ))}
                    </div>

                    {form.availabilityMode === "selected_days" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Available days (e.g. Fri / Sat / Sun for wedding packages)</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => {
                                const arr = form.availableDays || [];
                                set("availableDays", arr.includes(d) ? arr.filter((x: string) => x !== d) : [...arr, d]);
                              }}
                              className={`h-9 w-11 rounded-lg border text-xs font-medium transition ${form.availableDays?.includes(d) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"}`}
                            >
                              {d.slice(0, 3)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {form.availabilityMode === "date_range" && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Available from (e.g. 1 December)</Label>
                            <Input type="date" value={form.availabilityStart?.slice(0, 10) || ""} onChange={(e) => set("availabilityStart", e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Available until (e.g. 31 December)</Label>
                            <Input type="date" value={form.availabilityEnd?.slice(0, 10) || ""} onChange={(e) => set("availabilityEnd", e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Season label (optional)</Label>
                          <Input placeholder="e.g. Christmas 2025" value={form.seasonLabel} onChange={(e) => set("seasonLabel", e.target.value)} />
                        </div>
                      </>
                    )}
                  </WizardCard>

                  {/* Preparation & Notice */}
                  <WizardCard icon={<Clock className="size-4" />} title="Preparation Time & Booking Notice">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Preparation time</Label>
                        <select
                          value={form.preparationTimeCategory}
                          onChange={(e) => set("preparationTimeCategory", e.target.value)}
                          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="">Not specified</option>
                          <option value="same_day">Same Day</option>
                          <option value="24_hours">24 Hours</option>
                          <option value="2_days">2 Days</option>
                          <option value="3_days">3 Days</option>
                          <option value="1_week">1 Week</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      {form.preparationTimeCategory === "custom" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Custom prep time</Label>
                          <Input placeholder="e.g. 3-5 days" value={form.preparationTimeCustom} onChange={(e) => set("preparationTimeCustom", e.target.value)} />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1"><Bell className="size-3" /> Booking notice (customers can't book earlier than this)</Label>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => set("bookingNoticeHours", "")} className={`rounded-lg border px-3 py-1.5 text-xs ${form.bookingNoticeHours === "" ? "border-primary ring-1 ring-primary" : "border-border"}`}>No minimum</button>
                        {[{ v: "2", l: "2 hours" }, { v: "24", l: "24 hours" }, { v: "48", l: "48 hours" }, { v: "168", l: "7 days" }].map((b) => (
                          <button key={b.v} type="button" onClick={() => set("bookingNoticeHours", b.v)} className={`rounded-lg border px-3 py-1.5 text-xs ${String(form.bookingNoticeHours) === b.v ? "border-primary ring-1 ring-primary" : "border-border"}`}>{b.l}</button>
                        ))}
                      </div>
                    </div>
                  </WizardCard>

                  {/* Max orders per day */}
                  <WizardCard icon={<Boxes className="size-4" />} title="Maximum Orders Per Day">
                    <div className="flex items-center gap-3">
                      <Input
                        type="number" min={1} placeholder="e.g. 15"
                        value={form.maxOrdersPerDay}
                        onChange={(e) => set("maxOrdersPerDay", e.target.value)}
                        className="max-w-[160px]"
                      />
                      <span className="text-xs text-muted-foreground">orders / day — leave empty for unlimited. Shows "Fully Booked" when reached.</span>
                    </div>
                  </WizardCard>

                  {/* Service area (party packages only) */}
                  {vendor.ecosystem === "PIMPMYPARTY" && (
                    <WizardCard icon={<CalendarDays className="size-4" />} title="Service Area">
                      <Label className="text-xs">How far will you travel?</Label>
                      <select
                        value={form.serviceAreaType}
                        onChange={(e) => set("serviceAreaType", e.target.value)}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Select scope</option>
                        <option value="local">Local</option>
                        <option value="city">City</option>
                        <option value="state">State</option>
                        <option value="country">Country</option>
                        <option value="worldwide">Worldwide</option>
                      </select>
                    </WizardCard>
                  )}
                </div>
              )}

              {/* Step 8: Preview & Publish */}
              {step === 8 && (
                <div className="space-y-4">
                  {/* Publish Error (never show fake success) */}
                  {publishError ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-12 text-center">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
                        className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-red-500">
                        <AlertTriangle className="size-8 text-white" />
                      </motion.div>
                      <h3 className="text-xl font-bold text-red-700">Publish failed</h3>
                      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{publishError}</p>
                      <div className="mt-6 flex flex-wrap justify-center gap-2">
                        <Button onClick={() => setPublishError(null)} className="bg-brand text-brand-foreground hover:bg-brand/90">
                          Try Again
                        </Button>
                      </div>
                    </motion.div>
                  ) : published ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-12 text-center">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
                        className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-emerald-500">
                        <PartyPopper className="size-8 text-white" />
                      </motion.div>
                      <h3 className="text-xl font-bold text-emerald-700">Your product is now live!</h3>
                      <p className="mt-2 text-sm text-muted-foreground">Customers can now find and order this product.</p>
                      <div className="mt-6 flex flex-wrap justify-center gap-2">
                        <Button
                          onClick={() => {
                            // Use the slug returned from the API (savedProductSlug).
                            // Fall back to a slug derived from form.name ONLY if the API
                            // didn't return one (shouldn't happen with the fixed onSave).
                            const slug = savedProductSlug || form.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
                            if (slug) window.open(`/product/${slug}`, "_blank");
                          }}
                          variant="outline"
                          className="gap-1.5"
                          disabled={!savedProductSlug}
                        >
                          <Eye className="size-4" /> View Product
                        </Button>
                        <Button onClick={() => { setPublished(false); setSavedProductSlug(null); setStep(1); setForm({ ...form, name: "", description: "", images: [] }); }} variant="outline" className="gap-1.5">
                          <Plus className="size-4" /> Add Another
                        </Button>
                        <Button onClick={onClose} className="bg-brand text-brand-foreground hover:bg-brand/90">Go to Dashboard</Button>
                      </div>
                      {!savedProductSlug && (
                        <p className="mt-3 text-xs text-amber-600">Product saved, but the view link is unavailable. Refresh My Products to find it.</p>
                      )}
                    </motion.div>
                  ) : (
                    <>
                  <h3 className="text-lg font-bold">Preview & Publish</h3>

                  {/* Device Preview Toggle */}
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {[
                      { id: "desktop", icon: Monitor, label: "Desktop" },
                      { id: "tablet", icon: Tablet, label: "Tablet" },
                      { id: "mobile", icon: Smartphone, label: "Mobile" },
                    ].map(d => {
                      const Icon = d.icon;
                      return (
                        <button key={d.id} onClick={() => setPreviewDevice(d.id as "desktop" | "tablet" | "mobile")}
                          className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium",
                            previewDevice === d.id ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground")}>
                          <Icon className="size-3.5" /> {d.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Product Preview Card (responsive by device) */}
                  <div className={cn("mx-auto rounded-xl border border-border bg-card p-4 transition-all",
                    previewDevice === "desktop" ? "max-w-full" : previewDevice === "tablet" ? "max-w-md" : "max-w-xs")}>
                    <div className="flex gap-3">
                      <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {form.images?.[0] ? (
                          <img src={form.images[0]} alt={form.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center"><ImageIcon className="size-6 text-muted-foreground/30" /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-bold">{form.name || "Untitled Product"}</h4>
                        <p className="text-xs text-muted-foreground">{form.category}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{form.shortDescription || form.description}</p>
                        <p className="mt-1 text-sm font-bold text-brand">
                          {form.priceOnRequest ? "Price on request" : form.hidePrice ? "Price hidden" : `${symbol}${form.price || 0}`}
                        </p>
                      </div>
                    </div>
                    {form.featured && <Badge className="mt-2 bg-amber-100 text-amber-700">⭐ Featured</Badge>}
                  </div>

                  {/* Validation + Scores */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h4 className="mb-3 text-sm font-semibold">Publish Checklist</h4>
                    <div className="space-y-2">
                      {validation.checks.map(c => (
                        <div key={c.id} className="flex items-center gap-2 text-sm">
                          <div className={cn("grid size-5 place-items-center rounded-full", c.passed ? "bg-emerald-500" : "bg-muted")}>
                            {c.passed ? <Check className="size-3 text-white" /> : <AlertCircle className="size-3 text-muted-foreground" />}
                          </div>
                          <span className={cn(c.passed ? "text-foreground" : "text-muted-foreground")}>{c.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-4 border-t border-border pt-3">
                      <div>
                        <span className="text-xs font-medium">Quality Score</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className={cn("h-full rounded-full", qualityScore >= 80 ? "bg-emerald-500" : qualityScore >= 50 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${qualityScore}%` }} />
                          </div>
                          <span className="text-xs font-bold">{qualityScore}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-medium">SEO Score: {seoLabel}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className={cn("h-full rounded-full", seoScore >= 80 ? "bg-emerald-500" : seoScore >= 50 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${seoScore}%` }} />
                          </div>
                          <span className="text-xs font-bold">{seoScore}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!validation.allPassed && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                      <AlertCircle className="mb-1 inline size-4" /> Complete the missing items above before publishing.
                    </div>
                  )}
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border bg-card px-4 py-3">
        <div className="flex gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1">
              <ChevronLeft className="size-4" /> Back
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleSaveDraft} disabled={saving}>
            Save Draft
          </Button>
          {step < 8 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed} className="gap-1 bg-brand text-brand-foreground hover:bg-brand/90">
              Next <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={saving || !validation.allPassed || published} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Publish
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Small titled card used inside wizard steps. */
function WizardCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </h4>
      {children}
    </div>
  );
}
