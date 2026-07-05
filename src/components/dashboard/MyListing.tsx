"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Eye, Save, Loader2, Store, MapPin, Phone, Clock, Truck, Image as ImageIcon,
  Search, Check, Plus, X, Star, Sparkles, Rocket, Navigation, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Vendor } from "@/lib/types";
import { CreateVendorForm } from "@/components/marketplace/create-vendor-form";
import { useVendor } from "@/lib/queries";
import { ImageUpload, GalleryUpload } from "./image-upload";
import { AddressAutocomplete } from "./address-autocomplete";
import {
  BusinessScoreCard, MissingFieldsCard, QualityCheckCard, PublishCard,
  SuccessScreen, AutoSaveIndicator, IntegratedAIPanel,
  computeBusinessScore, detectMissingFields, runQualityChecks,
  type AiBusinessProfile,
} from "./listing-ai-tools";

interface MyListingProps {
  vendor: Vendor;
}

const COUNTRIES = [
  "India", "United Arab Emirates", "United States", "United Kingdom", "Australia",
  "Canada", "Singapore", "South Africa", "Nigeria", "Kenya", "Saudi Arabia",
  "Qatar", "Kuwait", "Oman", "Bahrain", "Germany", "France", "Netherlands",
  "Spain", "Italy", "Portugal", "Switzerland", "Sweden", "Norway", "Denmark",
  "Japan", "South Korea", "Thailand", "Malaysia", "Indonesia", "Philippines",
  "Brazil", "Mexico", "Argentina", "Chile", "Colombia", "Peru",
];

// Smart default business hours per category
const DEFAULT_HOURS_BY_CATEGORY: Record<string, string> = {
  "bakers-bakery": "Mon-Sat: 9AM-8PM, Sun: 10AM-4PM",
  "caterers": "Mon-Sun: 8AM-10PM",
  "photographers": "Mon-Sun: 9AM-9PM (by appointment)",
  "decorators": "Mon-Sun: 9AM-8PM",
  "djs": "Mon-Sun: 5PM-2AM (events only)",
  "event-planners": "Mon-Sat: 10AM-7PM, Sun: by appointment",
  "venues": "Mon-Sun: 10AM-11PM",
  "florists": "Mon-Sat: 8AM-8PM, Sun: 9AM-2PM",
  "food-trucks": "Mon-Sun: 11AM-11PM",
  "chef-staff": "Mon-Sun: by appointment",
};

// Guided wizard steps
const WIZARD_STEPS = [
  { id: "business", label: "Business", icon: Store, tab: "business" },
  { id: "location", label: "Location", icon: MapPin, tab: "location" },
  { id: "contact", label: "Contact", icon: Phone, tab: "contact" },
  { id: "hours", label: "Hours", icon: Clock, tab: "hours" },
  { id: "delivery", label: "Service Area", icon: Truck, tab: "delivery" },
  { id: "media", label: "Gallery", icon: ImageIcon, tab: "media" },
  { id: "seo", label: "SEO", icon: Search, tab: "seo" },
  { id: "publish", label: "Publish", icon: Rocket, tab: "publish" },
];

const SERVICE_RADIUS_OPTIONS = [
  { value: "5", label: "5 km" },
  { value: "10", label: "10 km" },
  { value: "20", label: "20 km" },
  { value: "50", label: "50 km" },
  { value: "100", label: "Entire City" },
  { value: "500", label: "Entire State" },
  { value: "99999", label: "Nationwide" },
];

export function MyListing({ vendor }: MyListingProps) {
  const router = useRouter();
  const { data: fullVendor, isLoading } = useVendor(vendor.slug);
  const [saving, setSaving] = React.useState(false);
  const [aiSeoLoading, setAiSeoLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("business");
  const [autoSaveStatus, setAutoSaveStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = React.useState<number | undefined>(undefined);
  const [productCount, setProductCount] = React.useState(0);
  const [publishing, setPublishing] = React.useState(false);
  const [published, setPublished] = React.useState(false);
  const formRef = React.useRef<any>({});
  const galleryRef = React.useRef<string[]>([]);
  const autoSaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Categories & Subcategories (from DB) ──
  const [categories, setCategories] = React.useState<{ id: string; label: string }[]>([]);
  const [subcategories, setSubcategories] = React.useState<{ id: string; name: string }[]>([]);
  const [catSearch, setCatSearch] = React.useState("");
  const [subcatSearch, setSubcatSearch] = React.useState("");
  const [showCatDropdown, setShowCatDropdown] = React.useState(false);
  const [showSubcatDropdown, setShowSubcatDropdown] = React.useState(false);

  // ── GST/Reg conditional visibility ──
  const [hasGst, setHasGst] = React.useState(false);
  const [hasReg, setHasReg] = React.useState(false);

  // ── Geolocation ──
  const [locating, setLocating] = React.useState(false);

  // ── DB-driven business types ──
  const [businessTypes, setBusinessTypes] = React.useState<{ value: string; label: string }[]>([]);
  const [businessTypesLoading, setBusinessTypesLoading] = React.useState(false);
  const [businessTypesError, setBusinessTypesError] = React.useState(false);

  // ── Wizard step (0-indexed) ──
  const [wizardStep, setWizardStep] = React.useState(0);

  // ── AI one-sentence assistant ──
  const [aiSentence, setAiSentence] = React.useState("");
  const [aiSentenceLoading, setAiSentenceLoading] = React.useState(false);

  // Form state
  const [form, setForm] = React.useState<any>({});
  const [gallery, setGallery] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (fullVendor) {
      setForm({
        name: fullVendor.name || "",
        tagline: fullVendor.tagline || "",
        description: fullVendor.description || "",
        category: fullVendor.category || "",
        subcategory: (fullVendor as any).subcategory || "",
        businessType: (fullVendor as any).businessType || "",
        yearStarted: (fullVendor as any).yearStarted || "",
        businessRegNumber: (fullVendor as any).businessRegNumber || "",
        gstVatNumber: (fullVendor as any).gstVatNumber || "",
        languagesSpoken: (fullVendor as any).languagesSpoken || "",
        // Location
        country: fullVendor.country || "",
        state: (fullVendor as any).state || "",
        city: fullVendor.city || "",
        address: (fullVendor as any).address || "",
        zipCode: (fullVendor as any).zipCode || "",
        latitude: (fullVendor as any).latitude || "",
        longitude: (fullVendor as any).longitude || "",
        serviceRadiusKm: (fullVendor as any).serviceRadiusKm || "",
        hideAddress: (fullVendor as any).hideAddress || false,
        // Contact
        whatsapp: (fullVendor as any).whatsapp || "",
        phone: (fullVendor as any).phone || "",
        email: (fullVendor as any).userEmail || "",
        website: (fullVendor as any).website || "",
        instagram: (fullVendor as any).instagram || "",
        facebook: (fullVendor as any).facebook || "",
        youtube: (fullVendor as any).youtube || "",
        tiktok: (fullVendor as any).tiktok || "",
        pinterest: (fullVendor as any).pinterest || "",
        linkedin: (fullVendor as any).linkedin || "",
        telegram: (fullVendor as any).telegram || "",
        // Hours
        openHours: (fullVendor as any).openHours || "",
        holidayMode: (fullVendor as any).holidayMode || false,
        vacationMode: (fullVendor as any).vacationMode || false,
        emergencyClosure: (fullVendor as any).emergencyClosure || false,
        // Delivery
        deliveryAvailable: (fullVendor as any).deliveryAvailable || false,
        pickupAvailable: (fullVendor as any).pickupAvailable || false,
        homeService: (fullVendor as any).homeService || false,
        onlineConsultation: (fullVendor as any).onlineConsultation || false,
        minOrder: (fullVendor as any).minOrder || "",
        maxOrder: (fullVendor as any).maxOrder || "",
        prepTime: (fullVendor as any).prepTime || "",
        bookingNotice: (fullVendor as any).bookingNotice || "",
        // SEO
        metaTitle: (fullVendor as any).metaTitle || "",
        metaDescription: (fullVendor as any).metaDescription || "",
        // Media
        heroImage: fullVendor.heroImage || "",
        avatarImage: fullVendor.avatarImage || "",
      });
      try {
        setGallery(typeof (fullVendor as any).gallery === "string"
          ? JSON.parse((fullVendor as any).gallery) : ((fullVendor as any).gallery || []));
      } catch { setGallery([]); }

      // Set GST/Reg visibility based on existing values
      setHasGst(!!(fullVendor as any).gstVatNumber);
      setHasReg(!!(fullVendor as any).businessRegNumber);
    }
  }, [fullVendor]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  // ── Load categories from DB ──
  React.useEffect(() => {
    const eco = vendor.ecosystem || "FINDMYBITES";
    fetch(`/api/categories?ecosystem=${eco}&t=${Date.now()}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.categories) {
          setCategories(d.categories.map((c: any) => ({ id: c.id, label: c.label || c.id })));
        }
      })
      .catch(() => {});
  }, [vendor.ecosystem]);

  // ── Cascading: Category → Subcategory + Business Type ──
  // When category changes: clear subcategory + business type, reload both
  React.useEffect(() => {
    if (!form.category) {
      setSubcategories([]);
      setBusinessTypes([]);
      return;
    }

    // Clear dependent fields when category changes (but not on initial load)
    // We detect "change" vs "initial load" by checking if subcategories are already loaded
    // for this category — if the effect fires, it's a change or initial load.
    // The clearing is handled by the category dropdown's onChange handler.

    // Load subcategories
    fetch(`/api/categories/subcategories?category=${encodeURIComponent(form.category)}&t=${Date.now()}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.subcategories) {
          setSubcategories(d.subcategories.map((s: any) => ({ id: s.id, name: s.name || s.label || s.id })));
        } else {
          setSubcategories([]);
        }
      })
      .catch(() => setSubcategories([]));

    // Load DB-driven business types
    setBusinessTypesLoading(true);
    setBusinessTypesError(false);
    fetch(`/api/business-types?category=${encodeURIComponent(form.category)}&t=${Date.now()}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load business types");
        return r.json();
      })
      .then((d) => {
        setBusinessTypes((d?.businessTypes || []).map((t: any) => ({ value: t.value, label: t.label })));
        setBusinessTypesError(false);
      })
      .catch(() => {
        setBusinessTypes([]);
        setBusinessTypesError(true);
      })
      .finally(() => setBusinessTypesLoading(false));

    // Suggest default business hours if empty
    if (!form.openHours && DEFAULT_HOURS_BY_CATEGORY[form.category]) {
      set("openHours", DEFAULT_HOURS_BY_CATEGORY[form.category]);
    }
  }, [form.category]);

  // ── AI One-Sentence Listing Assistant ──
  const generateFromSentence = async () => {
    if (!aiSentence.trim()) { toast.error("Describe your business in one sentence"); return; }
    setAiSentenceLoading(true);
    try {
      const res = await fetch("/api/vendor/ai/setup-assistant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_profile", style: "professional",
          businessName: form.name || aiSentence.split(" ").slice(0, 3).join(" "),
          marketplace: vendor.ecosystem || "FINDMYBITES",
          category: form.category || "",
          city: form.city || "",
          specialities: aiSentence,
        }),
      });
      const data = await res.json();
      if (res.ok && data.description) {
        if (data.description) set("description", data.description);
        if (data.tagline) set("tagline", data.tagline);
        if (data.seoTitle) set("metaTitle", data.seoTitle);
        if (data.metaDescription) set("metaDescription", data.metaDescription);
        if (data.tags?.length) set("tags", data.tags.join(", "));
        toast.success("AI generated your listing from your description!");
      } else {
        toast.error(data.error || "AI generation failed");
      }
    } catch { toast.error("Failed"); } finally { setAiSentenceLoading(false); }
  };

  // ── Draft recovery (localStorage) ──
  React.useEffect(() => {
    if (!vendor.id) return;
    const draftKey = `mylisting-draft-${vendor.id}`;
    // Save draft on form change (debounced via auto-save)
    const saveDraft = () => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ form, gallery, savedAt: Date.now() }));
      } catch {}
    };
    saveDraft();
  }, [form, gallery, vendor.id]);

  // Check for existing draft on mount
  React.useEffect(() => {
    if (!vendor.id) return;
    const draftKey = `mylisting-draft-${vendor.id}`;
    try {
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.savedAt && Date.now() - parsed.savedAt < 24 * 60 * 60 * 1000) {
          // Draft is less than 24h old
          // Don't auto-restore — just note it exists
        }
      }
    } catch {}
  }, [vendor.id]);

  // ── Geolocation helper (graceful error handling) ──
  const useMyLocation = () => {
    // Check if geolocation is available
    if (!("geolocation" in navigator)) {
      toast.error("GPS not available", { description: "Your device doesn't support geolocation. Please search your address manually." });
      return;
    }
    // Check HTTPS (geolocation requires HTTPS on most browsers)
    if (typeof window !== "undefined" && window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
      toast.error("HTTPS required", { description: "Location detection needs HTTPS. Please search your address manually." });
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        set("latitude", latitude);
        set("longitude", longitude);
        // Reverse geocode using OpenStreetMap Nominatim (free, no API key)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`, {
            headers: { "Accept-Language": "en" },
          });
          if (!res.ok) throw new Error("Geocoding service unavailable");
          const data = await res.json();
          if (data?.address) {
            const addr = data.address;
            if (addr.country) set("country", addr.country);
            if (addr.state || addr.region) set("state", addr.state || addr.region);
            const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
            if (city) set("city", city);
            const area = addr.suburb || addr.neighbourhood || addr.road || addr.residential || "";
            if (area) set("address", area);
            if (addr.postcode) set("zipCode", addr.postcode);
          }
          toast.success("Location detected!", { description: "Address fields filled automatically." });
        } catch (err) {
          // Coordinates saved but address lookup failed — still useful
          toast.success("Coordinates saved", { description: "We got your location but couldn't look up the address. Please fill the address fields manually." });
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        // Graceful error handling for all failure modes
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Location permission denied", {
            description: "Please allow location access in your browser settings, or search your address manually above.",
            duration: 6000,
          });
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          toast.error("GPS unavailable", {
            description: "Your device couldn't determine its position. Please search your address manually.",
            duration: 6000,
          });
        } else if (err.code === err.TIMEOUT) {
          toast.error("Location timeout", {
            description: "GPS took too long. Try again or search your address manually.",
            duration: 6000,
          });
        } else {
          toast.error("Location failed", { description: "Please search your address manually." });
        }
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 60000 }
    );
  };

  // ── Geocode address when address fields change (debounced) ──
  const geocodeAddress = React.useCallback(async (addr: { country?: string; state?: string; city?: string; zipCode?: string; address?: string }) => {
    const parts = [addr.address, addr.city, addr.state, addr.country, addr.zipCode].filter(Boolean);
    if (parts.length < 2) return;
    try {
      const q = encodeURIComponent(parts.join(", "));
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`);
      const data = await res.json();
      if (data?.[0]) {
        set("latitude", parseFloat(data[0].lat));
        set("longitude", parseFloat(data[0].lon));
      }
    } catch {}
  }, []);

  // Debounced geocoding when address fields change
  React.useEffect(() => {
    if (!form.city || !form.country) return;
    const timer = setTimeout(() => {
      geocodeAddress({ country: form.country, state: form.state, city: form.city, zipCode: form.zipCode, address: form.address });
    }, 1500);
    return () => clearTimeout(timer);
  }, [form.country, form.state, form.city, form.zipCode, form.address, geocodeAddress]);

  // ── Fetch product count for Business Score ──
  React.useEffect(() => {
    fetch("/api/vendor/products?limit=1")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.total !== undefined) setProductCount(d.total); })
      .catch(() => {});
  }, []);

  // ── Auto-save (debounced 2s after last change) ──
  formRef.current = form;
  galleryRef.current = gallery;

  React.useEffect(() => {
    if (!form.name) return; // don't auto-save until basic info exists
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setAutoSaveStatus("saving");
    autoSaveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/vendor/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formRef.current, gallery: galleryRef.current }),
        });
        if (res.ok) { setAutoSaveStatus("saved"); setLastSavedAt(Date.now()); setTimeout(() => setAutoSaveStatus("idle"), 3000); }
        else { setAutoSaveStatus("error"); setTimeout(() => setAutoSaveStatus("idle"), 5000); }
      } catch { setAutoSaveStatus("idle"); }
    }, 2000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [form, gallery]);

  // ── One-click AI SEO generation ──
  // Calls the existing /api/vendor/marketing/ai/seo endpoint which uses GLM
  // to generate an SEO title + description based on the vendor's business
  // name, category, city, and tagline. Fills the form fields (vendor still
  // needs to click Save to persist).
  const generateSeoWithAI = async () => {
    setAiSeoLoading(true);
    try {
      const res = await fetch("/api/vendor/marketing/ai/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.seo) {
        set("metaTitle", data.seo.metaTitle || "");
        set("metaDescription", data.seo.metaDescription || "");
        if (data.seo.keywords?.length) {
          set("tags", JSON.stringify(data.seo.keywords));
        }
        toast.success("AI generated SEO title & description!");
      } else {
        toast.error(data.error || "AI generation failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate SEO");
    } finally {
      setAiSeoLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, gallery }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast.success("Profile saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
    setSaving(false);
  };

  // Profile completeness (legacy — kept for the header bar)
  const completeness = React.useMemo(() => {
    if (!form.name) return 0;
    const checks = [
      !!form.name, !!form.tagline, !!form.description, !!form.avatarImage,
      !!form.heroImage, !!form.address, !!form.whatsapp, gallery.length > 0,
      !!form.openHours, !!form.website, !!form.latitude, !!form.metaTitle,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form, gallery]);

  // ── Business Score (8 sections, 0-100) ──
  const businessScore = React.useMemo(() => computeBusinessScore(form, gallery, productCount), [form, gallery, productCount]);

  // ── Smart Missing Field Detection ──
  const missingFields = React.useMemo(() => detectMissingFields(form, gallery), [form, gallery]);

  // ── AI Quality Check ──
  const qualityChecks = React.useMemo(() => runQualityChecks(form), [form]);

  // ── AI profile apply handler ──
  const handleAiApply = (profile: AiBusinessProfile) => {
    if (profile.description) set("description", profile.description);
    if (profile.tagline) set("tagline", profile.tagline);
    if (profile.seoTitle) set("metaTitle", profile.seoTitle);
    if (profile.metaDescription) set("metaDescription", profile.metaDescription);
    if (profile.tags?.length) set("tags", profile.tags.join(", "));
  };

  // ── Publish handler ──
  const handlePublish = async () => {
    setPublishing(true);
    try {
      // Save first, then mark as published
      await save();
      setPublished(true);
      toast.success("🎉 Your business profile is now live!");
    } catch {
      toast.error("Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const handleSuccessAction = (action: string) => {
    if (action === "products") setActiveTab("products");
    else if (action === "gallery") setActiveTab("media");
    else if (action === "share") router.push(`/vendor/${vendor.slug}`);
    else if (action === "upgrade") router.push("/dashboard");
    setPublished(false);
  };

  if (isLoading || !fullVendor) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      {/* Success Screen */}
      {published && (
        <SuccessScreen vendorName={form.name || vendor.name} onAction={handleSuccessAction} />
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Editing</p>
            <p className="text-base font-bold">{vendor.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full", businessScore.overall >= 80 ? "bg-emerald-500" : businessScore.overall >= 50 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${businessScore.overall}%` }} />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">Score: {businessScore.overall}/100</span>
              <span className="ml-2"><AutoSaveIndicator status={autoSaveStatus} lastSavedAt={lastSavedAt} /></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/vendor/${vendor.slug}`)}>
              <Eye className="size-4" /> Preview
            </Button>
            <Button size="sm" onClick={save} disabled={saving} className="bg-brand text-brand-foreground hover:bg-brand/90">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* 2-column layout: form + sidebar */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: guided wizard + form */}
        <div>
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); const idx = WIZARD_STEPS.findIndex(s => s.tab === v); if (idx >= 0) setWizardStep(idx); }}>
        {/* Guided wizard progress bar */}
        <div className="mb-4 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max pb-1">
            {WIZARD_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeTab === step.tab;
              const isCompleted = idx < wizardStep;
              const isPublish = step.id === "publish";
              return (
                <React.Fragment key={step.id}>
                  {idx > 0 && <div className={cn("h-px w-4 shrink-0", isCompleted ? "bg-primary" : "bg-border")} />}
                  <button
                    onClick={() => { setActiveTab(step.tab); setWizardStep(idx); }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition whitespace-nowrap",
                      isActive ? "border-primary bg-primary text-primary-foreground" :
                      isCompleted ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300" :
                      isPublish ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/20" :
                      "border-border bg-card hover:bg-accent"
                    )}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <span className={cn("flex size-4 items-center justify-center rounded-full text-[9px] font-bold",
                      isActive ? "bg-primary-foreground text-primary" :
                      isCompleted ? "bg-emerald-500 text-white" :
                      "bg-muted text-muted-foreground")}>
                      {isCompleted ? <Check className="size-2.5" /> : idx + 1}
                    </span>
                    <Icon className="size-3.5" />
                    {step.label}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
          {/* Completion percentage + estimated time */}
          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>Step {wizardStep + 1} of {WIZARD_STEPS.length}</span>
            <span>·</span>
            <span>{Math.round(((wizardStep + 1) / WIZARD_STEPS.length) * 100)}% complete</span>
            <span>·</span>
            <span>⏱ ~{Math.max(1, (WIZARD_STEPS.length - wizardStep - 1) * 2)} min remaining</span>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            if (wizardStep > 0) { const prev = wizardStep - 1; setWizardStep(prev); setActiveTab(WIZARD_STEPS[prev].tab); }
          }} disabled={wizardStep === 0}>
            ← Back
          </Button>
          {wizardStep < WIZARD_STEPS.length - 2 ? (
            <Button size="sm" onClick={() => {
              const next = wizardStep + 1; setWizardStep(next); setActiveTab(WIZARD_STEPS[next].tab);
            }}>
              Next →
            </Button>
          ) : wizardStep === WIZARD_STEPS.length - 2 ? (
            <Button size="sm" onClick={() => {
              const next = wizardStep + 1; setWizardStep(next); setActiveTab("business"); // Stay on form for publish
            }} className="bg-emerald-600 text-white hover:bg-emerald-700">
              Ready to Publish →
            </Button>
          ) : null}
        </div>

        {/* Business Info */}
        <TabsContent value="business" className="space-y-4">
          {/* AI One-Sentence Listing Assistant */}
          <div className="rounded-xl border border-brand-border bg-gradient-to-br from-brand-soft/40 to-transparent p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
                <Sparkles className="size-4" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">Describe your business in one sentence</p>
                <p className="text-[11px] text-muted-foreground">AI generates your description, SEO, tags & more instantly</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                value={aiSentence}
                onChange={(e) => setAiSentence(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generateFromSentence(); } }}
                placeholder="e.g. I bake custom birthday cakes in Hyderabad"
                className="text-sm"
              />
              <Button onClick={generateFromSentence} disabled={aiSentenceLoading} size="sm" className="shrink-0">
                {aiSentenceLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              </Button>
            </div>
          </div>

          {/* Integrated AI Business Profile Generator */}
          <IntegratedAIPanel form={form} onApply={handleAiApply} onNavigate={setActiveTab} />

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Business Name *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} className="mt-1" /></div>
            <div><Label>Short Tagline</Label><Input value={form.tagline} onChange={e => set("tagline", e.target.value)} placeholder="Custom cakes since 2015" className="mt-1" /></div>
          </div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => set("description", e.target.value)} className="mt-1 min-h-[100px]" /></div>

          {/* Category — searchable dropdown from DB */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Label>Category *</Label>
              <div className="relative mt-1">
                <Input
                  value={catSearch || form.category || ""}
                  onChange={(e) => { setCatSearch(e.target.value); setShowCatDropdown(true); }}
                  onFocus={() => { setCatSearch(form.category || ""); setShowCatDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowCatDropdown(false), 200)}
                  placeholder="Search categories…"
                  className="pr-8"
                />
                <ChevronDown className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              {showCatDropdown && (
                <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-popover shadow-lg">
                  {categories
                    .filter((c) => !catSearch || c.label.toLowerCase().includes(catSearch.toLowerCase()))
                    .map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={() => {
                          // Cascading: clear subcategory + business type when category changes
                          set("category", c.id);
                          set("subcategory", "");
                          set("businessType", "");
                          setCatSearch(c.label);
                          setShowCatDropdown(false);
                          setSubcatSearch("");
                          // Subcategories + business types will auto-load via the useEffect
                        }}
                        className={cn("flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent", form.category === c.id && "bg-accent")}
                      >
                        {form.category === c.id && <Check className="size-3.5 text-primary" />}
                        {c.label}
                      </button>
                    ))}
                  {categories.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">Loading categories…</div>}
                </div>
              )}
            </div>

            {/* Subcategory — searchable dropdown, filtered by category */}
            <div className="relative">
              <Label>Subcategory</Label>
              <div className="relative mt-1">
                <Input
                  value={subcatSearch || form.subcategory || ""}
                  onChange={(e) => { setSubcatSearch(e.target.value); setShowSubcatDropdown(true); }}
                  onFocus={() => { setSubcatSearch(form.subcategory || ""); setShowSubcatDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowSubcatDropdown(false), 200)}
                  placeholder={form.category ? "Search subcategories…" : "Select category first"}
                  disabled={!form.category}
                  className="pr-8"
                />
                <ChevronDown className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              {showSubcatDropdown && form.category && (
                <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-popover shadow-lg">
                  {subcategories
                    .filter((s) => !subcatSearch || s.name.toLowerCase().includes(subcatSearch.toLowerCase()))
                    .map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onMouseDown={() => { set("subcategory", s.name); setSubcatSearch(s.name); setShowSubcatDropdown(false); }}
                        className={cn("flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent", form.subcategory === s.name && "bg-accent")}
                      >
                        {form.subcategory === s.name && <Check className="size-3.5 text-primary" />}
                        {s.name}
                      </button>
                    ))}
                  {subcategories.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">No subcategories</div>}
                </div>
              )}
            </div>
          </div>

          {/* Business Type — DB-driven, cascading from category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Business Type</Label>
              {businessTypesLoading ? (
                <div className="mt-1 flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> Loading…
                </div>
              ) : businessTypesError ? (
                <div className="mt-1 flex h-10 items-center gap-2 rounded-md border border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/20 px-3 text-xs text-red-600 dark:text-red-400">
                  Failed to load. <button type="button" onClick={() => { setBusinessTypesError(false); setBusinessTypesLoading(true); fetch(`/api/business-types?category=${encodeURIComponent(form.category)}&t=${Date.now()}`).then(r => r.ok ? r.json() : null).then(d => setBusinessTypes((d?.businessTypes || []).map((t: any) => ({ value: t.value, label: t.label })))).catch(() => setBusinessTypesError(true)).finally(() => setBusinessTypesLoading(false)); }} className="underline font-medium">Retry</button>
                </div>
              ) : businessTypes.length === 0 && form.category ? (
                <div className="mt-1 flex h-10 items-center rounded-md border border-input bg-muted/30 px-3 text-sm text-muted-foreground">
                  No business types found.
                </div>
              ) : (
                <select
                  value={form.businessType}
                  onChange={e => set("businessType", e.target.value)}
                  disabled={!form.category}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                >
                  <option value="">{form.category ? "Select…" : "Select category first"}</option>
                  {businessTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              )}
            </div>
            <div><Label>Year Started</Label><Input type="number" value={form.yearStarted} onChange={e => set("yearStarted", e.target.value)} placeholder="2015" className="mt-1" /></div>
          </div>

          {/* GST & Registration — conditional */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Do you have a Business Registration?</Label>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setHasReg(true); if (!form.businessRegNumber) set("businessRegNumber", ""); }} className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium", hasReg ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent")}>Yes</button>
                <button type="button" onClick={() => { setHasReg(false); set("businessRegNumber", ""); }} className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium", !hasReg ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent")}>No</button>
              </div>
              {hasReg && <Input value={form.businessRegNumber} onChange={e => set("businessRegNumber", e.target.value)} placeholder="Reg. number" className="mt-1" />}
            </div>
            <div className="space-y-1.5">
              <Label>Do you have GST/VAT?</Label>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setHasGst(true); if (!form.gstVatNumber) set("gstVatNumber", ""); }} className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium", hasGst ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent")}>Yes</button>
                <button type="button" onClick={() => { setHasGst(false); set("gstVatNumber", ""); }} className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium", !hasGst ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent")}>No</button>
              </div>
              {hasGst && <Input value={form.gstVatNumber} onChange={e => set("gstVatNumber", e.target.value)} placeholder="GST number" className="mt-1" />}
            </div>
          </div>
          <div><Label>Languages Spoken</Label><Input value={form.languagesSpoken} onChange={e => set("languagesSpoken", e.target.value)} placeholder="English, Hindi, Arabic" className="mt-1" /></div>
        </TabsContent>

        {/* Location — address autocomplete + GPS + service radius */}
        <TabsContent value="location" className="space-y-4">
          <AddressAutocomplete
            value={{
              country: form.country || "",
              state: form.state || "",
              city: form.city || "",
              address: form.address || "",
              zipCode: form.zipCode || "",
              latitude: form.latitude || "",
              longitude: form.longitude || "",
            }}
            onChange={(field, val) => set(field, val)}
            onUseLocation={useMyLocation}
            locating={locating}
          />

          {/* Service Radius — friendly radio options + custom */}
          <div>
            <Label>How far do you serve customers?</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SERVICE_RADIUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("serviceRadiusKm", opt.value)}
                  className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    String(form.serviceRadiusKm) === opt.value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {/* Custom radius */}
            {String(form.serviceRadiusKm) === "custom" || (form.serviceRadiusKm && !SERVICE_RADIUS_OPTIONS.find(o => o.value === String(form.serviceRadiusKm))) ? (
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="number"
                  value={form.serviceRadiusKm}
                  onChange={e => set("serviceRadiusKm", e.target.value)}
                  className="w-32"
                  placeholder="km"
                />
                <span className="text-xs text-muted-foreground">km</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => set("serviceRadiusKm", "custom")}
                className={cn("mt-2 rounded-full border px-3 py-1.5 text-xs font-medium transition hover:bg-accent")}
              >
                Custom Radius
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.hideAddress} onChange={e => set("hideAddress", e.target.checked)} className="size-4 rounded border-border" />
              Hide exact address (show "Serving {form.city || "your city"}" instead)
            </label>
          </div>
        </TabsContent>

        {/* Contact */}
        <TabsContent value="contact" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} placeholder="+91 98765 43210" className="mt-1" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><Input value={form.email} onChange={e => set("email", e.target.value)} className="mt-1" /></div>
            <div><Label>Website</Label><Input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://…" className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Instagram</Label><Input value={form.instagram} onChange={e => set("instagram", e.target.value)} className="mt-1" /></div>
            <div><Label>Facebook</Label><Input value={form.facebook} onChange={e => set("facebook", e.target.value)} className="mt-1" /></div>
            <div><Label>YouTube</Label><Input value={form.youtube} onChange={e => set("youtube", e.target.value)} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>TikTok</Label><Input value={form.tiktok} onChange={e => set("tiktok", e.target.value)} className="mt-1" /></div>
            <div><Label>Pinterest</Label><Input value={form.pinterest} onChange={e => set("pinterest", e.target.value)} className="mt-1" /></div>
            <div><Label>LinkedIn</Label><Input value={form.linkedin} onChange={e => set("linkedin", e.target.value)} className="mt-1" /></div>
          </div>
          <div><Label>Telegram</Label><Input value={form.telegram} onChange={e => set("telegram", e.target.value)} className="mt-1" /></div>
        </TabsContent>

        {/* Hours */}
        <TabsContent value="hours" className="space-y-4">
          <div>
            <Label>Opening Hours</Label>
            <Textarea value={form.openHours} onChange={e => set("openHours", e.target.value)}
              placeholder={"Mon-Sat: 9:00 AM - 9:00 PM\nSun: Closed"} className="mt-1 min-h-[80px]" />
            <p className="mt-1 text-xs text-muted-foreground">Enter your weekly schedule. Customers see this on your profile.</p>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.holidayMode} onChange={e => set("holidayMode", e.target.checked)} className="size-4 rounded border-border" />
              Holiday Mode (temporarily pause new enquiries)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.vacationMode} onChange={e => set("vacationMode", e.target.checked)} className="size-4 rounded border-border" />
              Vacation Mode (show "Away" banner on profile)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.emergencyClosure} onChange={e => set("emergencyClosure", e.target.checked)} className="size-4 rounded border-border" />
              Emergency Closure (show "Temporarily Closed" on profile)
            </label>
          </div>
        </TabsContent>

        {/* Delivery & Service */}
        <TabsContent value="delivery" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.deliveryAvailable} onChange={e => set("deliveryAvailable", e.target.checked)} className="size-4 rounded border-border" /> Delivery Available</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.pickupAvailable} onChange={e => set("pickupAvailable", e.target.checked)} className="size-4 rounded border-border" /> Pickup Available</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.homeService} onChange={e => set("homeService", e.target.checked)} className="size-4 rounded border-border" /> Home Service</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.onlineConsultation} onChange={e => set("onlineConsultation", e.target.checked)} className="size-4 rounded border-border" /> Online Consultation</label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Minimum Order</Label><Input type="number" value={form.minOrder} onChange={e => set("minOrder", e.target.value)} className="mt-1" /></div>
            <div><Label>Maximum Order</Label><Input type="number" value={form.maxOrder} onChange={e => set("maxOrder", e.target.value)} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Preparation Time</Label><Input value={form.prepTime} onChange={e => set("prepTime", e.target.value)} placeholder="24 hours" className="mt-1" /></div>
            <div><Label>Booking Notice</Label><Input value={form.bookingNotice} onChange={e => set("bookingNotice", e.target.value)} placeholder="2 days advance" className="mt-1" /></div>
          </div>
        </TabsContent>

        {/* Media Gallery */}
        <TabsContent value="media" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Business Logo</Label>
              <p className="mb-2 text-xs text-muted-foreground">Square image, min 200×200px</p>
              <ImageUpload
                value={form.avatarImage}
                onChange={(url) => set("avatarImage", url)}
                folder="logo"
                label="Upload Logo"
                aspect="square"
                camera
                vendorId={vendor.id}
                autoSave
                field="avatarImage"
              />
            </div>
            <div>
              <Label>Cover Banner</Label>
              <p className="mb-2 text-xs text-muted-foreground">Wide image, 16:9 ratio recommended</p>
              <ImageUpload
                value={form.heroImage}
                onChange={(url) => set("heroImage", url)}
                folder="cover"
                label="Upload Cover Banner"
                aspect="wide"
                vendorId={vendor.id}
                autoSave
                field="heroImage"
              />
            </div>
          </div>
          <div>
            <Label>Gallery Images</Label>
            <p className="mb-2 text-xs text-muted-foreground">Upload up to 10 images. First image is the cover.</p>
            <GalleryUpload
              images={gallery}
              onChange={setGallery}
              maxImages={10}
              vendorId={vendor.id}
            />
          </div>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo" className="space-y-4">
          {/* One-click AI generation */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-border bg-brand-soft/50 p-3">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
                <Sparkles className="size-4" />
              </span>
              <div>
                <p className="text-xs font-semibold">Generate SEO with AI</p>
                <p className="text-[10px] text-muted-foreground">One click — AI writes your title & description from your listing.</p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={generateSeoWithAI}
              disabled={aiSeoLoading}
              className="shrink-0"
            >
              {aiSeoLoading ? (
                <><Loader2 className="mr-1.5 size-3.5 animate-spin" /> Generating…</>
              ) : (
                <><Sparkles className="mr-1.5 size-3.5" /> Generate with AI</>
              )}
            </Button>
          </div>

          <div>
            <Label>SEO Title</Label>
            <Input value={form.metaTitle} onChange={e => set("metaTitle", e.target.value)} maxLength={60} className="mt-1" />
            <p className="mt-1 text-[10px] text-muted-foreground">{(form.metaTitle || "").length}/60</p>
          </div>
          <div>
            <Label>SEO Description</Label>
            <Textarea value={form.metaDescription} onChange={e => set("metaDescription", e.target.value)} maxLength={160} className="mt-1 min-h-[60px]" />
            <p className="mt-1 text-[10px] text-muted-foreground">{(form.metaDescription || "").length}/160</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
            <p className="font-semibold">SEO Tips:</p>
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              <li>Keep title under 60 characters</li>
              <li>Keep description between 120-160 characters</li>
              <li>Include your city and main service</li>
              <li>Structured data is auto-generated</li>
              <li>Click "Generate with AI" for an instant optimized title & description</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
        </div>

        {/* Right sidebar: Business Score + Missing Fields + Quality Check + Publish */}
        <div className="space-y-4">
          <BusinessScoreCard data={businessScore} />
          <MissingFieldsCard missing={missingFields} onNavigate={setActiveTab} />
          <QualityCheckCard checks={qualityChecks} onFix={(action) => {
            if (action === "generate_description" || action === "generate_seo") setActiveTab("seo");
            else if (action === "add_tags") setActiveTab("business");
            else if (action === "add_whatsapp" || action === "add_social") setActiveTab("contact");
            else if (action === "select_category" || action === "add_city") setActiveTab("business");
            else if (action === "add_city") setActiveTab("location");
          }} />
          <PublishCard score={businessScore.overall} canPublish={businessScore.overall >= 80} onPublish={handlePublish} publishing={publishing} />
        </div>
      </div>
    </div>
  );
}
