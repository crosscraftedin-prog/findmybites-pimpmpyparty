"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Check, ChevronRight, Loader2, Sparkles, X,
  Image as ImageIcon, Eye, Star, AlertCircle, Wand2, Plus, PartyPopper,
  Boxes, Clock, CalendarDays, Bell, Tags, CheckCircle2,
  DollarSign, Package, Info, Search, Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Vendor } from "@/lib/types";
import { GalleryUpload } from "./image-upload";
import { AttributeSelector } from "./attribute-selector";
import { ProductInfoForm } from "./product-info-form";
import type { ProductInfo } from "@/lib/products/product-info";
import { ProductDetailView, type ProductViewData } from "@/components/product/ProductDetailView";

// ── Wizard step types (inlined from deleted dynamic-wizard-renderer.tsx) ──
type StepType =
  | "basic" | "photos" | "pricing" | "fields" | "seo" | "inventory"
  | "details" | "options" | "delivery" | "marketing" | "success" | "recipeCost";

interface WizardRenderProps {
  form: Record<string, unknown>;
  set: (key: string, value: unknown) => void;
  vendor: any;
  isFood: boolean;
  symbol: string;
  productInfo: any;
  setProductInfo: (info: any) => void;
  productAttributeIds: string[];
  setProductAttributeIds: (ids: string[]) => void;
  productSubcategories: { id: string; name: string }[];
  autoSave: () => void;
  generateWithAI: () => void;
  generateSEO: () => void;
  aiGenerating: boolean;
  saving: boolean;
  published: boolean;
  publishError: string | null;
  savedProductSlug: string | null;
  onClose: () => void;
  onContinueEditing?: () => void;
  completenessPercent?: number;
  showPreview?: boolean;
  setShowPreview?: (v: boolean) => void;
  [key: string]: unknown;
}

type StepRenderer = (props: WizardRenderProps) => React.ReactNode;

interface ProductWizardProps {
  vendor: Vendor;
  initialData?: any;
  /** Returns the saved product (with slug) on success, or null/throws on failure. */
  onSave: (data: any) => Promise<{ slug?: string; id?: string } | null | void>;
  onClose: () => void;
  saving: boolean;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", GBP: "£", AED: "AED", AUD: "A$", CAD: "CA$", SGD: "S$", EUR: "€",
};

export function ProductWizard({ vendor, initialData, onSave, onClose, saving }: ProductWizardProps) {
  const [aiGenerating, setAiGenerating] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<string | null>(null);
  const [autoSaving, setAutoSaving] = React.useState(false);
  const [publishError, setPublishError] = React.useState<string | null>(null);
  const [savedProductSlug, setSavedProductSlug] = React.useState<string | null>(null);
  const [published, setPublished] = React.useState(false);
  // Forces a specific card to open (e.g., on validation error)
  const [forceOpenCardId, setForceOpenCardId] = React.useState<string | null>(null);
  // Global Attribute System — product attribute IDs
  const [productAttributeIds, setProductAttributeIds] = React.useState<string[]>([]);
  const [productInfo, setProductInfo] = React.useState<ProductInfo>({});
  const [productSubcategories, setProductSubcategories] = React.useState<{id: string; name: string}[]>([]);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [completenessPercent, setCompletenessPercent] = React.useState(0);
  const [showPreview, setShowPreview] = React.useState(false);

  const symbol = CURRENCY_SYMBOLS[vendor.currency] ?? vendor.currency ?? "$";
  const isFood = vendor.ecosystem === "FINDMYBITES";

  // Form state
  const [form, setForm] = React.useState<any>({
    name: initialData?.name || "",
    category: initialData?.category || vendor.category || "",
    subCategory: initialData?.subCategory || "",
    shortDescription: initialData?.shortDescription || "",
    description: initialData?.description || "",
    images: (() => {
      const imgs = initialData?.images;
      if (Array.isArray(imgs)) return imgs;
      if (typeof imgs === "string" && imgs.trim()) { try { return JSON.parse(imgs); } catch { return []; } }
      return [];
    })(),
    videoUrl: initialData?.videoUrl || "",
    price: initialData?.price != null ? String(initialData.price) : "",
    offerPrice: initialData?.offerPrice != null ? String(initialData.offerPrice) : "",
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
    tags: Array.isArray(initialData?.tags) ? (initialData.tags as string[]).join(", ") : (initialData?.tags as string) || "",
    // Variants & Inventory — variants may be stored as JSON string or array
    variants: (() => {
      const v = initialData?.variants;
      if (Array.isArray(v)) return v;
      if (typeof v === "string" && v.trim()) { try { return JSON.parse(v); } catch { return []; } }
      return [];
    })(),
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
  // Only auto-save when creating a NEW product (no initialData) AND the user
  // has entered at least a name. This prevents restoring drafts when editing
  // existing products or after publish/delete.
  const formRef = React.useRef(form);
  React.useEffect(() => {
    formRef.current = form;
  }, [form]);

  // ── Notify floating widgets (AI assistant) to hide while wizard is open ──
  React.useEffect(() => {
    window.dispatchEvent(new Event("fullscreen-overlay-open"));
    return () => {
      window.dispatchEvent(new Event("fullscreen-overlay-close"));
    };
  }, []);

  // Load subcategories when product category changes (same API as vendor profile)
  React.useEffect(() => {
    if (!form.category) {
      setProductSubcategories([]);
      return;
    }
    fetch(`/api/categories/subcategories?category=${encodeURIComponent(form.category)}&ecosystem=${vendor.ecosystem}`)
      .then((r) => r.json())
      .then((data) => {
        const subs = (data.subcategories || []).map((s: any) => ({ id: s.id, name: s.name || s.label }));
        setProductSubcategories(subs);
      })
      .catch(() => setProductSubcategories([]));
  }, [form.category, vendor.ecosystem]);

  const autoSave = React.useCallback(async () => {
    // Don't auto-save if editing an existing product or if the wizard is done
    if (initialData || published || publishError) return;
    if (!formRef.current.name?.trim()) return; // don't save empty
    setAutoSaving(true);
    try {
      const draftKey = `product-draft-${vendor.id}`;
      localStorage.setItem(draftKey, JSON.stringify({ ...formRef.current, _savedAt: Date.now() }));
      setLastSaved(new Date().toLocaleTimeString());
    } catch {}
    setAutoSaving(false);
  }, [vendor.id, initialData, published, publishError]);

  React.useEffect(() => {
    const interval = setInterval(autoSave, 15000);
    const handleBeforeUnload = () => autoSave();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [autoSave]);

  // ── Josh AI auto-generation ──
  // Automatically generates description, SEO, tags, etc. when the product
  // name changes. No "Generate" button — runs silently 1.5s after the user
  // stops typing. Only runs once per name change, and never overwrites
  // fields the vendor has manually edited.
  const aiTriggeredRef = React.useRef<string>("");
  const hasEditedDescription = React.useRef(false);
  const hasEditedSeoTitle = React.useRef(false);
  const hasEditedSeoDesc = React.useRef(false);
  const hasEditedTags = React.useRef(false);

  React.useEffect(() => {
    const name = form.name?.trim();
    if (!name || name.length < 3) return;
    // Don't re-trigger for the same name
    if (aiTriggeredRef.current === name) return;
    // Don't auto-generate in edit mode if the product already has a description
    if (initialData?.description && aiTriggeredRef.current === "") {
      aiTriggeredRef.current = name;
      return;
    }

    const timer = setTimeout(async () => {
      aiTriggeredRef.current = name;
      setAiGenerating(true);
      try {
        const res = await fetch("/api/ai/product-writer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, category: form.category, ecosystem: vendor.ecosystem, city: vendor.city }),
        });
        if (!res.ok) return;
        const data = await res.json();
        // Only set fields the vendor hasn't manually edited
        if (data.description && !hasEditedDescription.current && !form.description) {
          set("description", data.description);
        }
        // shortDescription is deliberately NOT set — the spec calls for ONE description only.
        if (data.metaTitle && !hasEditedSeoTitle.current && !form.metaTitle) {
          set("metaTitle", data.metaTitle);
        }
        if (data.metaDescription && !hasEditedSeoDesc.current && !form.metaDescription) {
          set("metaDescription", data.metaDescription);
        }
        if (data.tags && !hasEditedTags.current && !form.tags) {
          set("tags", data.tags);
        }
      } catch {
        // Silent fail — vendor can still use the manual Generate button
      } finally {
        setAiGenerating(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [form.name]);

  // Restore draft on mount — ONLY for new products (no initialData)
  // and ONLY if a genuine draft exists (has a name and was saved recently)
  React.useEffect(() => {
    if (initialData) return; // Skip for Edit mode — load from DB only
    const draftKey = `product-draft-${vendor.id}`;
    const draft = localStorage.getItem(draftKey);
    if (!draft) return;
    try {
      const parsed = JSON.parse(draft);
      // Only prompt if the draft has meaningful content (name + at least one other field)
      const hasContent = parsed.name?.trim() && (
        parsed.description?.trim() || parsed.price || parsed.category ||
        (parsed.images?.length > 0) || parsed.shortDescription?.trim()
      );
      // Check if draft is recent (within 24 hours)
      const isRecent = parsed._savedAt && (Date.now() - parsed._savedAt < 24 * 60 * 60 * 1000);
      if (hasContent && isRecent && confirm("Found an unsaved draft. Restore it?")) {
        // Remove the internal _savedAt field before setting form state
        const { _savedAt, ...formData } = parsed;
        setForm(formData);
        toast.success("Draft restored");
      } else {
        // Draft is stale or empty — remove it
        localStorage.removeItem(draftKey);
      }
    } catch {
      // Corrupted draft — remove it
      localStorage.removeItem(draftKey);
    }
  }, [vendor.id, initialData]);

  // ── Load existing product attributes when editing ──
  React.useEffect(() => {
    if (!initialData?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/products/${initialData.id}/attributes`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setProductAttributeIds((data.attributes ?? []).map((a: any) => a.id));
      } catch { /* non-fatal */ }
    })();
    return () => { cancelled = true; };
  }, [initialData?.id]);

  // ── Validation ──
  const validation = React.useMemo(() => {
    const checks = [
      { id: "name", label: "Product Name", passed: !!form.name?.trim() },
      { id: "category", label: "Category", passed: !!form.category },
      { id: "images", label: "At least 1 Image", passed: (form.images?.length ?? 0) > 0 },
      { id: "description", label: "Description (20+ chars)", passed: typeof form.description === "string" && form.description.trim().length > 20 },
      { id: "price", label: "Price or Price on Request", passed: !!form.price || form.priceOnRequest },
      { id: "offerPrice", label: "Offer Price (optional)", passed: !!form.offerPrice, optional: true },
      { id: "seoTitle", label: "SEO Title", passed: typeof form.metaTitle === "string" && form.metaTitle.trim().length > 0 },
      { id: "seoDesc", label: "SEO Description", passed: typeof form.metaDescription === "string" && form.metaDescription.trim().length > 0 },
      { id: "availability", label: "Availability Set", passed: form.isAvailable !== undefined },
      { id: "variants", label: "Variants (optional)", passed: (form.variants?.length ?? 0) > 0, optional: true },
    ];
    const requiredChecks = checks.filter(c => !c.optional);
    const passedCount = requiredChecks.filter(c => c.passed).length;
    return { checks, passedCount, total: requiredChecks.length, allPassed: passedCount === requiredChecks.length };
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
    if (typeof form.tags === "string" && form.tags.trim()) score += 5;
    return Math.min(score, 100);
  }, [form]);

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
    // shortDescription deliberately NOT set — ONE description only.
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
      // Find the first failing required check and expand its card
      const firstFailing = validation.checks.find(c => !c.optional && !c.passed);
      if (firstFailing) {
        // Map validation check ID to card ID
        const cardMap: Record<string, string> = {
          name: "basic",
          category: "basic",
          images: "basic",
          description: "basic",
          price: "basic",
          seoTitle: "marketing",
          seoDesc: "marketing",
          availability: "delivery",
        };
        const cardId = cardMap[firstFailing.id] || "basic";
        setForceOpenCardId(cardId);
        // Scroll to the card
        setTimeout(() => {
          document.getElementById(`card-content-${cardId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      }
      toast.error("Please complete all required fields before publishing");
      return;
    }
    // ── Pre-publish validation warnings ──
    const warnings: string[] = [];
    if (!form.images || form.images.length === 0) warnings.push("No images uploaded");
    if (typeof form.description !== "string" || form.description.length < 30) warnings.push("Description is too short");
    if (!form.price && !form.priceOnRequest) warnings.push("No price set");
    if (!form.metaTitle) warnings.push("No SEO title");
    if (!form.metaDescription) warnings.push("No SEO description");
    if (!form.category) warnings.push("No category selected");
    if (form.offerPrice && form.price && Number(form.offerPrice) >= Number(form.price)) warnings.push("Offer price should be less than regular price");
    if (warnings.length > 0) {
      toast.warning(`Publishing with ${warnings.length} warning(s): ${warnings.join(", ")}`);
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
      // Product Information System (stored in extraFields JSON)
      productInfo: Object.keys(productInfo).length > 0 ? productInfo : undefined,
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
      // ── Save product attributes (Global Attribute System) ──
      // Best-effort: don't fail the publish if attributes fail to save.
      if (result && typeof result === "object" && (result.id || result.slug)) {
        const prodId = result.id || result.slug;
        try {
          await fetch(`/api/products/${prodId}/attributes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ attributeIds: productAttributeIds }),
          });
        } catch { /* non-fatal — attributes can be saved later */ }
      }
      setPublished(true);
      // V3.1: Show the success screen with a completeness progress bar.
      // The user can continue editing or go to the dashboard.
      setCompletenessPercent(qualityScore);
      setShowSuccess(true);
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
      // Product Information System (stored in extraFields JSON)
      productInfo: Object.keys(productInfo).length > 0 ? productInfo : undefined,
    };
    localStorage.removeItem(`product-draft-${vendor.id}`);
    await onSave(payload);
  };

  // canProceed is kept for validation messaging (used by handlePublish checks).
  // Touch swipe navigation was removed — the collapsible card layout doesn't
  // need swipe since all cards are visible on one page.


  // ── Dynamic Wizard Step Renderers ──────────────────────────────────────────
  // V3: Step content is rendered by the renderers below. The wizard shell
  // now uses CollapsibleCard (one-page layout) instead of a stepper.
  // current step's stepType and calls the matching render function below.
  // No more `step === N` conditionals — the wizard is fully template-driven.
  // Render functions close over wizard state (form, set, vendor, etc.).
  const sharedProps: WizardRenderProps = {
    form,
    set,
    vendor,
    isFood,
    symbol,
    productInfo,
    setProductInfo,
    productAttributeIds,
    setProductAttributeIds,
    productSubcategories,
    autoSave,
    generateWithAI,
    generateSEO,
    aiGenerating,
    saving,
    published,
    publishError,
    savedProductSlug,
    onClose,
    onContinueEditing: () => { setShowSuccess(false); },
    completenessPercent,
    showPreview,
    setShowPreview,
  };

  // ── V3.1: Internal render helpers (composed by the new step renderers) ──
  // Old "basic" renderer content (Product Name, Category, Subcategory, Short
  // Description, AI Writer). Composed into the new `basic` step (Step 1).
  const renderBasicFields: StepRenderer = () => (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Basic Information</h3>
                  <div>
                    <Label htmlFor="p-name">{isFood ? "Product" : "Package"} Name *</Label>
                    <Input id="p-name" value={form.name} onChange={e => set("name", e.target.value)}
                      placeholder={isFood ? "e.g. Chocolate Truffle Cake" : "e.g. Premium Wedding Photography"} className="mt-1" />
                    {aiGenerating && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-purple-600">
                        <Loader2 className="size-3 animate-spin" /> Josh AI is generating description, SEO & tags…
                      </p>
                    )}
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
                      <Select value={form.subCategory || ""} onValueChange={(v) => set("subCategory", v)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose a subcategory" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {productSubcategories.map((s) => (
                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* V3 ARCHITECTURE: Quick Tags, Dietary chips, and Allergen chips
                      have been REMOVED from Card 1.

                      - Quick Tags → replaced by "Suitable For" FilterGroup (DB-driven,
                        shown in Step 4: Search Filters)
                      - Dietary chips → replaced by Template Fields (Eggless, Vegan, etc.
                        are TemplateField values in the product's template)
                      - Allergen chips → replaced by ALLERGENS_SECTION in the Template Engine
                        (already exists as a template section, shown in Step 3: Product Details)

                      These were duplicates of data already collected via the Template Engine
                      and the FilterGroup system. Removing them eliminates 3 parallel systems. */}
                </div>
  );

  // Variant cards only — extracted from the old `variants` renderer.
  // Used by both `variants` (backward-compat stepType) and the new `options` step (Step 3).
  // The inventory/scheduling/featured cards that used to live in `variants` are
  // NOT included here — they are rendered by the new `delivery` and `marketing`
  // composed renderers to avoid duplication in the 5-step flow.
  const renderVariantCards: StepRenderer = () => (
                <div className="space-y-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold">
                      <Package className="size-5 text-amber-600" />
                      Product Variants (Optional)
                    </h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Create different sizes, flavours, packages or options. Each variant can have its own price.
                    </p>
                  </div>

                  {/* Conditional notice: no variants yet */}
                  {(!form.variants || form.variants.length === 0) && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                      <Info className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        This product uses the Default Price. Add a variant below if you offer different sizes, flavours, or packages.
                      </p>
                    </div>
                  )}

                  {/* Conditional success: variants exist */}
                  {form.variants && form.variants.length > 0 && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-xs text-emerald-800 dark:text-emerald-300">
                        This product now uses variant pricing. Customers will choose a variant before ordering. The Default Price is kept as a fallback.
                      </p>
                    </div>
                  )}

                  {/* Helper examples */}
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">Examples</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">By Size / Weight</p>
                        <p className="mt-0.5">✓ 500g — {symbol}399</p>
                        <p>✓ 1kg — {symbol}699</p>
                        <p>✓ 2kg — {symbol}1299</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">By Flavour / Package</p>
                        <p className="mt-0.5">✓ Chocolate</p>
                        <p>✓ Vanilla</p>
                        <p>✓ Birthday Package</p>
                      </div>
                    </div>
                  </div>

                  {/* Variant cards */}
                  {form.variants && form.variants.length > 0 && (
                    <div className="space-y-3">
                      {form.variants.map((v: any, idx: number) => (
                        <div key={idx} className="rounded-xl border border-border p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Variant {idx + 1}</span>
                            <button onClick={() => set("variants", form.variants.filter((_: any, i: number) => i !== idx))}
                              className="grid size-8 place-items-center rounded-lg text-red-600 hover:bg-red-50" aria-label="Remove variant">
                              <X className="size-4" />
                            </button>
                          </div>

                          {/* Variant Type + Value */}
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <Label className="text-xs">Variant Type</Label>
                              <select
                                value={v.type || ""}
                                onChange={(e) => {
                                  const variants = [...form.variants];
                                  variants[idx] = { ...v, type: e.target.value };
                                  set("variants", variants);
                                }}
                                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                              >
                                <option value="">Select type…</option>
                                <option value="Size">Size</option>
                                <option value="Weight">Weight</option>
                                <option value="Flavour">Flavour</option>
                                <option value="Package">Package</option>
                                <option value="Shape">Shape</option>
                                <option value="Portion">Portion</option>
                                <option value="Custom">Custom</option>
                              </select>
                            </div>
                            <div>
                              <Label className="text-xs">Variant Value</Label>
                              <Input
                                value={v.name}
                                onChange={(e) => {
                                  const variants = [...form.variants];
                                  variants[idx] = { ...v, name: e.target.value };
                                  set("variants", variants);
                                }}
                                placeholder="e.g. 500g, Chocolate, Premium Package"
                                className="mt-1 h-9 text-sm"
                              />
                            </div>
                          </div>

                          {/* Prices */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Regular Price ({symbol})</Label>
                              <Input
                                value={v.price ?? ""}
                                onChange={(e) => {
                                  const variants = [...form.variants];
                                  variants[idx] = { ...v, price: e.target.value };
                                  set("variants", variants);
                                }}
                                placeholder="0"
                                type="number"
                                className="mt-1 h-9 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Offer Price ({symbol})</Label>
                              <Input
                                value={v.offerPrice ?? ""}
                                onChange={(e) => {
                                  const variants = [...form.variants];
                                  variants[idx] = { ...v, offerPrice: e.target.value };
                                  set("variants", variants);
                                }}
                                placeholder="0"
                                type="number"
                                className="mt-1 h-9 text-sm"
                              />
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <Label className="text-xs">Description (optional)</Label>
                            <Input
                              value={v.description ?? ""}
                              onChange={(e) => {
                                const variants = [...form.variants];
                                variants[idx] = { ...v, description: e.target.value };
                                set("variants", variants);
                              }}
                              placeholder="Short description of this variant"
                              className="mt-1 h-9 text-sm"
                            />
                          </div>

                          {/* Availability */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const variants = [...form.variants];
                                variants[idx] = { ...v, available: !v.available };
                                set("variants", variants);
                              }}
                              className={cn("rounded-lg border px-3 py-1 text-xs font-medium",
                                v.available !== false ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700")}
                            >
                              {v.available !== false ? "✓ Available" : "✗ Unavailable"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Variant button */}
                  <Button variant="outline" size="sm" onClick={() => {
                    set("variants", [...(form.variants || []), { type: "", name: "", price: "", offerPrice: "", description: "", available: true }]);
                  }} className="gap-1.5">
                    <Plus className="size-3.5" /> Add Variant
                  </Button>
                </div>
  );

  const STEP_RENDERERS: Record<StepType, StepRenderer> = {
    // V3.1: Composed `basic` step (Step 1) — merges basic fields + photos +
    // pricing + description, then a Publish Product button that creates the
    // product immediately. The user can continue editing after publish.
    basic: (props) => (
      <>
        {renderBasicFields(props)}
        {STEP_RENDERERS.photos(props)}
        {STEP_RENDERERS.pricing(props)}
        {/* Description — the ONE description (no short/full/product description duplicates) */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Description</h3>
          <div>
            <Label htmlFor="p-desc">Description *</Label>
            <Textarea id="p-desc" value={form.description}
              onChange={e => { hasEditedDescription.current = true; set("description", e.target.value); }}
              placeholder="Describe your product in detail… Josh AI will generate this automatically after you enter the name." className="mt-1 min-h-[100px]" />
            {aiGenerating && !form.description && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-purple-600">
                <Loader2 className="size-3 animate-spin" /> Generating…
              </p>
            )}
          </div>
        </div>
        {/* Publish error (if any) — shown inline so the user can retry */}
        {props.publishError && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="mb-1 inline size-4" /> {props.publishError}
          </div>
        )}
        {/* No inline Publish button — the sticky action bar at the bottom
            has Preview / Save Draft / Publish. This reduces duplicate CTAs. */}
      </>
    ),
    photos: () => (
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
    ),
    pricing: () => (
                <div className="space-y-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold">
                      <DollarSign className="size-5 text-amber-600" />
                      Default Price
                    </h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      This price will be used when your product has no variants.
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
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
                    <div className="mt-3 space-y-2">
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

                  {/* Info box */}
                  <div className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
                    <Info className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      If you later add variants such as different sizes, flavours or packages, each variant can have its own price.
                    </p>
                  </div>
                </div>
    ),
    fields: (props) => {
      const stepSections = (props.stepSections as string[] | undefined) ?? [];
      // Step with sections filter (e.g. Customisation step) — render ONLY those sections
      if (stepSections.length > 0) {
        return (
                <div className="space-y-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold">
                      <Star className="size-5 text-amber-600" />
                      Customisation
                    </h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Let customers know what they can personalise about this product.
                    </p>
                  </div>
                  <ProductInfoForm
                    productInfo={productInfo}
                    onChange={setProductInfo}
                    category={form.category || vendor.category}
                    sectionFilter={stepSections}
                  />
                </div>
        );
      }
      // No sections → full Product Info step (with Recipe Cost Calculator)
      return (
                <div className="space-y-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold">
                      <Info className="size-5 text-amber-600" />
                      Product Information
                    </h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Structured details shown on your product page. Improves SEO, customer trust,
                      and reduces questions. All fields are optional.
                    </p>
                  </div>
                  <ProductInfoForm
                    productInfo={productInfo}
                    onChange={setProductInfo}
                    category={form.category || vendor.category}
                    productName={form.name}
                    productDescription={form.description}
                    // Exclude sections that duplicate other cards:
                    // "basic-information" → duplicates Card 1 (name + description)
                    // "preparation-&-delivery" → duplicates Card 4 (delivery/pickup)
                    // "logistics" → code-fallback that also has delivery/pickup
                    // "recipeCost" → rendered in its own Card (Recipe Cost Calculator)
                    sectionExclusion={["basic-information", "preparation-&-delivery", "logistics", "recipeCost"]}
                  />
                </div>
      );
    },
    seo: () => (
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
                  {/* Tags are managed via Quick Tags chips in Card 1 (Quick Publish).
                      Do NOT render a duplicate tags input here. */}
                </div>
    ),
    inventory: () => (
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
    ),
    // ── V3.2: 6-card layout ──────────────────────────────────────────────────
    // Card 2 — Product Details: Template Engine fields + Product Attributes.
    // Excludes "basic-information", "preparation-&-delivery", "logistics", "recipeCost"
    // (those are in Card 1, Card 4, and Card 6 respectively).
    details: (props) => (
      <>
        {STEP_RENDERERS.fields({ ...props, stepSections: undefined })}
        {/* Product Attributes — service & feature badges */}
        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Tags className="size-4 text-brand" />
            <Label className="text-sm font-semibold">Product Attributes</Label>
          </div>
          <p className="mb-2 text-xs text-muted-foreground">
            Select service &amp; feature badges. These appear on the product card and power attribute filtering.
          </p>
          <AttributeSelector
            selectedIds={productAttributeIds}
            onChange={setProductAttributeIds}
            ecosystem={vendor.ecosystem}
            groups={["product_feature"]}
          />
        </div>
      </>
    ),
    // Card 4 — Recipe Cost Calculator (vendor-only, never public)
    recipeCost: (props) => (
      <div className="rounded-xl border border-muted bg-muted/30 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-lg">🧮</span>
          <h4 className="text-sm font-bold">Recipe Cost Calculator</h4>
          <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            Vendor Only — Never shown publicly
          </span>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Track your production costs and calculate profit margins. This data is private and never displayed to customers.
        </p>
        <ProductInfoForm
          productInfo={productInfo}
          onChange={setProductInfo}
          category={form.category || vendor.category}
          showVendorOnly
          sectionFilter={["recipeCost"]}
        />
      </div>
    ),
    options: (props) => (
      <>
        {renderVariantCards(props)}
        {STEP_RENDERERS.fields({ ...props, stepSections: ["customisation"] })}
      </>
    ),
    // Card 3 — Delivery: delivery/pickup checkboxes + preparation time + booking
    // notice + availability. Inventory (stock, max orders) is now a separate card.
    delivery: (props) => (
      <>
        {/* V3 ARCHITECTURE: Delivery/Pickup checkboxes REMOVED from product wizard.
            These are vendor-level Business Features (inherited by all products).
            The vendor sets them once in MyListing (Vendor Profile) via the
            "Business Features" FilterGroup. They are no longer asked per-product.

            The legacy form.deliveryAvailable / form.pickupAvailable fields are
            still sent to the API for backward compatibility (default: false),
            but the vendor no longer sees checkboxes for them here. */}
        {/* Preparation time + booking notice + service area (from inventory renderer, minus stock) */}
        {STEP_RENDERERS.inventory(props)}
      </>
    ),
    // Step 5 — Marketing: SEO fields (from the `seo` renderer) + featured
    // toggle (from the old `variants` renderer).
    marketing: (props) => (
      <>
        {STEP_RENDERERS.seo(props)}
        {/* Featured card — from the old `variants` renderer */}
        <div className="flex items-center gap-2 rounded-xl border border-border p-4">
          <input type="checkbox" id="p-featured" checked={form.featured} onChange={e => set("featured", e.target.checked)}
            className="size-4 rounded border-border" />
          <Label htmlFor="p-featured" className="text-sm cursor-pointer">
            Feature this product <span className="text-xs text-muted-foreground">(appears first on your profile — Free plan: max 2)</span>
          </Label>
        </div>
      </>
    ),
    // Post-publish success screen — shown after the user clicks "Publish Product"
    // on Step 1. Displays a completeness progress bar and a "Continue Editing"
    // button that dismisses the success screen.
    success: (props) => (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-12 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
          className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-emerald-500">
          <PartyPopper className="size-8 text-white" />
        </motion.div>
        <h3 className="text-xl font-bold text-emerald-700">🎉 Product Published Successfully</h3>
        <p className="mt-2 text-sm text-muted-foreground">Complete your listing to improve ranking.</p>
        {/* Completeness progress bar */}
        <div className="mx-auto mt-6 max-w-sm">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium">Listing Completeness</span>
            <span className="font-bold">{props.completenessPercent ?? 0}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${props.completenessPercent ?? 0}%` }} />
          </div>
        </div>
        {/* Continue Editing + secondary actions */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={props.onContinueEditing} className="gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90">
            Continue Editing <ChevronRight className="size-4" />
          </Button>
          {props.savedProductSlug && (
            <Button onClick={() => window.open(`/product/${props.savedProductSlug}`, "_blank")} variant="outline" className="gap-1.5">
              <Eye className="size-4" /> View Live Product
            </Button>
          )}
          <Button onClick={props.onClose} variant="outline" className="gap-1.5">
            Go to Dashboard
          </Button>
        </div>
      </motion.div>
    ),
  };
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header — permanently visible (shrink-0) */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40" aria-label="Close wizard">
            <X className="size-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold">{initialData ? "Edit" : "New"} {isFood ? "Product" : "Package"}</h2>
            <p className="text-[10px] text-muted-foreground">
              {autoSaving ? "Saving…" : lastSaved ? `Last saved ${lastSaved}` : "Auto-save enabled"}
            </p>
          </div>
        </div>
        {/* Checklist progress (replaces percentage) */}
        <div className="hidden items-center gap-2 md:flex">
          <div className="flex items-center gap-1.5">
            {validation.checks.filter(c => !c.optional).map(c => (
              <div key={c.id} className="flex items-center gap-0.5 text-[10px]" title={c.label}>
                {c.passed ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <div className="grid size-3.5 place-items-center rounded-full border border-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
          <span className="text-xs font-bold">{validation.passedCount}/{validation.total}</span>
        </div>
      </div>

      {/* ── Collapsible Card Layout (replaces the wizard stepper) ──
          Card 1 (Quick Publish) is always expanded by default.
          Cards 2-5 are collapsed; click the header to expand.
          No Next/Back, no progress circles, no wizard pages. */}

      {/* Card content — scrollable */}
      <div className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {showSuccess ? (
            // Post-publish success screen
            STEP_RENDERERS.success(sharedProps)
          ) : (
            <>
              {/* ── CARD 1: Basic Information (always expanded) ── */}
              <CollapsibleCard
                cardId="basic"
                icon={<Star className="size-5 text-emerald-500" />}
                title="Basic Information"
                subtitle="Everything customers see first."
                badge={validation.passedCount === validation.total ? "✓ Complete" : undefined}
                defaultOpen
                forceOpen={forceOpenCardId === "basic"}
              >
                {STEP_RENDERERS.basic(sharedProps)}
              </CollapsibleCard>

              {/* ── CARD 2: Product Details (expanded by default) ── */}
              <CollapsibleCard
                cardId="details"
                icon={<Info className="size-5 text-blue-500" />}
                title="Product Details"
                subtitle="Information shown on your product page."
                defaultOpen
                forceOpen={forceOpenCardId === "details"}
              >
                {STEP_RENDERERS.details(sharedProps)}
              </CollapsibleCard>

              {/* ── CARD 3: Variants & Customisation ── */}
              <CollapsibleCard
                cardId="variants"
                icon={<Package className="size-5 text-amber-500" />}
                title="Variants & Customisation"
                subtitle="Sizes, flavours, packages, add-ons."
                forceOpen={forceOpenCardId === "variants"}
              >
                {STEP_RENDERERS.options(sharedProps)}
              </CollapsibleCard>

              {/* ── CARD 4: Delivery & Availability ── */}
              <CollapsibleCard
                cardId="delivery"
                icon={<Truck className="size-5 text-purple-500" />}
                title="Delivery & Availability"
                subtitle="How and when customers receive this product."
                forceOpen={forceOpenCardId === "delivery"}
              >
                {STEP_RENDERERS.delivery(sharedProps)}
              </CollapsibleCard>

              {/* ── CARD 5: Marketing & SEO ── */}
              <CollapsibleCard
                cardId="marketing"
                icon={<Search className="size-5 text-pink-500" />}
                title="Marketing & SEO"
                subtitle="Improve visibility in Google Search."
                forceOpen={forceOpenCardId === "marketing"}
              >
                {STEP_RENDERERS.marketing(sharedProps)}
              </CollapsibleCard>

              {/* ── CARD 6: Recipe Cost Calculator (vendor-only) ── */}
              <CollapsibleCard
                cardId="recipeCost"
                icon={<DollarSign className="size-5 text-emerald-600" />}
                title="Recipe Cost Calculator"
                subtitle="Private production costs and profit tracking."
                forceOpen={forceOpenCardId === "recipeCost"}
              >
                {STEP_RENDERERS.recipeCost(sharedProps)}
              </CollapsibleCard>
            </>
          )}
        </div>
      </div>

      {/* ── Sticky Action Bar — always visible (Preview / Save Draft / Publish) ── */}
      {!showSuccess && (
        <div className="shrink-0 border-t border-border bg-card px-4 py-3 [padding-bottom:calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
            {/* Save status */}
            <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              {saving ? (
                <><Loader2 className="size-3.5 animate-spin" /> Saving…</>
              ) : lastSaved ? (
                <><Check className="size-3.5 text-emerald-500" /> Draft saved · {lastSaved}</>
              ) : (
                <><Check className="size-3.5 text-muted-foreground/50" /> Auto-save enabled</>
              )}
            </div>
            {/* Actions */}
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="ghost" onClick={() => setShowPreview(true)} size="sm" className="gap-1.5">
                <Eye className="size-4" /> Preview
              </Button>
              <Button variant="outline" onClick={handleSaveDraft} disabled={saving} size="sm" className="gap-1.5">
                Save Draft
              </Button>
              <Button onClick={handlePublish} disabled={saving || published} size="sm"
                className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Publish
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal — reuses ProductDetailView */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-background p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="grid size-8 place-items-center rounded-full hover:bg-muted"
                aria-label="Close preview"
              >
                <X className="size-5" />
              </button>
            </div>
            <ProductDetailView
              mode="preview"
              product={{
                id: "preview",
                name: form.name || "Untitled Product",
                description: form.description || null,
                shortDescription: form.shortDescription || null,
                price: Number(form.price) || 0,
                offerPrice: form.offerPrice ? Number(form.offerPrice) : null,
                currency: form.currency || "INR",
                currencySymbol: symbol,
                image: form.images?.[0] || null,
                images: form.images || [],
                isFeatured: form.featured || false,
                isAvailable: form.isAvailable ?? true,
                variants: form.variants || [],
                deliveryAvailable: form.deliveryAvailable || false,
                pickupAvailable: form.pickupAvailable || false,
                vegetarian: form.vegetarian || false,
                vegan: form.vegan || false,
                eggless: form.eggless || false,
                category: form.category || null,
              } as ProductViewData}
              vendor={{
                id: vendor.id,
                name: vendor.name,
                slug: vendor.slug,
                city: vendor.city || "",
                avatarImage: vendor.avatarImage || null,
                verified: vendor.verified,
                rating: vendor.rating,
                reviewCount: vendor.reviewCount,
                whatsapp: vendor.whatsapp || null,
              }}
              selectedVariant={0}
              onVariantSelect={() => { /* preview only */ }}
            />
          </div>
        </div>
      )}

      {/* No footer — Publish is in the sticky action bar. */}
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

/**
 * CollapsibleCard — a single-page card that can be expanded/collapsed.
 * Replaces the wizard stepper. Card 1 (Basic Information) is always open by default.
 *
 * Features:
 * - Session-persisted open state (remembers which cards were expanded)
 * - Lazy rendering (only mounts children when expanded, for performance)
 * - Accessibility: aria-expanded, aria-controls, keyboard focus
 * - Smooth height animation via framer-motion
 * - Auto-expand via `forceOpen` prop (for validation error scrolling)
 */
function CollapsibleCard({
  icon, title, subtitle, badge, defaultOpen = false, cardId, forceOpen, children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  defaultOpen?: boolean;
  /** Unique ID for session-persistence of open state. */
  cardId: string;
  /** When true, forces the card open (e.g., on validation error). */
  forceOpen?: boolean;
  children: React.ReactNode;
}) {
  const storageKey = `wizard-card-${cardId}`;
  const [open, setOpen] = React.useState(() => {
    if (typeof window === "undefined") return defaultOpen;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved !== null) return saved === "true";
    } catch {}
    return defaultOpen;
  });

  // Sync open state to sessionStorage + respond to forceOpen
  React.useEffect(() => {
    if (forceOpen && !open) {
      setOpen(true);
      return;
    }
    try {
      sessionStorage.setItem(storageKey, String(open));
    } catch {}
  }, [open, storageKey, forceOpen]);

  const contentId = `card-content-${cardId}`;

  return (
    <div className={cn(
      "overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow",
      open ? "border-border" : "border-border/60 hover:shadow-md",
      forceOpen && "ring-2 ring-red-400/50",
    )}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <div className="shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold leading-tight">{title}</h3>
            {badge && (
              <Badge variant="secondary" className="text-[10px]">{badge}</Badge>
            )}
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <ChevronRight className={cn("size-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <motion.div
          id={contentId}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="border-t border-border p-4"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}
