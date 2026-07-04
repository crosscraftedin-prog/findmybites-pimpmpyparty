"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Loader2,
  Send,
  Store,
  CheckCircle2,
  Clock,
  Eye,
  Sparkles,
  MessageCircle,
  Navigation,
  UtensilsCrossed,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateVendor, useUpdateVendor, useGeocode } from "@/lib/queries";
import { useMarketplace } from "@/lib/store";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import {
  COUNTRIES,
  CURRENCY_OPTIONS,
  CURRENCY_SYMBOLS,
  PRICE_RANGES,
  RESPONSE_TIME_OPTIONS,
  migrateCategory,
} from "@/lib/constants";
import { countryCodeToFlag } from "@/lib/format";
import { ImageUpload } from "./image-upload";
import { AiListingGenerator, type AiListingResult } from "./ai-listing-generator";
import type { AiListingResult as AiResult } from "@/lib/ai/listing-types";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { DynamicFilters } from "@/components/dashboard/DynamicFilters";
import type { Ecosystem, Vendor } from "@/lib/types";

interface FormState {
  name: string;
  category: string;
  subcategory: string;
  tagline: string;
  description: string;
  countryCode: string;
  city: string;
  state: string;
  address: string;
  zipCode: string;
  currency: string;
  priceRange: string;
  basePrice: string;
  tags: string;
  seoKeywords: string;
  responseTime: string;
  yearsActive: string;
  deliveryOptions: string;
  specialities: string;
  languages: string;
  customOrders: boolean;
  logoUrl: string;
  bannerUrl: string;
  instagram: string;
  website: string;
  whatsapp: string;
  facebook: string;
  youtube: string;
  tiktok: string;
  twitter: string;
  snapchat: string;
  fssaiNumber: string;
  serviceRadiusKm: string;
}

const EMPTY: FormState = {
  name: "",
  category: "",
  subcategory: "",
  tagline: "",
  description: "",
  countryCode: "",
  city: "",
  state: "",
  address: "",
  zipCode: "",
  currency: "",
  priceRange: "",
  basePrice: "",
  tags: "",
  seoKeywords: "",
  responseTime: "under 2 hours",
  yearsActive: "1",
  deliveryOptions: "",
  specialities: "",
  languages: "",
  customOrders: true,
  logoUrl: "",
  bannerUrl: "",
  instagram: "",
  website: "",
  whatsapp: "",
  facebook: "",
  youtube: "",
  tiktok: "",
  twitter: "",
  snapchat: "",
  fssaiNumber: "",
  serviceRadiusKm: "",
};

/** Build initial form state from an existing vendor (edit mode). */
function formStateFromVendor(v: Vendor): FormState {
  return {
    name: v.name ?? "",
    category: v.category ?? "",
    subcategory: v.subcategory ?? "",
    tagline: v.tagline ?? "",
    description: v.description ?? "",
    countryCode: v.countryCode ?? "",
    city: v.city ?? "",
    state: v.state ?? "",
    address: v.address ?? "",
    zipCode: v.zipCode ?? "",
    currency: v.currency ?? "",
    priceRange: v.priceRange ?? "",
    basePrice: v.basePrice ? String(v.basePrice) : "",
    tags: v.tags?.join(", ") ?? "",
    responseTime: v.responseTime ?? "under 2 hours",
    yearsActive: v.yearsActive ? String(v.yearsActive) : "1",
    logoUrl:
      v.avatarImage && v.avatarImage !== v.heroImage ? v.avatarImage : "",
    bannerUrl:
      v.heroImage &&
      (v.heroImage.startsWith("/uploads/") ||
        v.heroImage.includes("supabase.co/storage"))
        ? v.heroImage
        : "",
    instagram: v.instagram ?? "",
    website: v.website ?? "",
    whatsapp: v.whatsapp ?? "",
    facebook: (v as any).facebook ?? "",
    youtube: (v as any).youtube ?? "",
    tiktok: (v as any).tiktok ?? "",
    twitter: (v as any).twitter ?? "",
    snapchat: (v as any).snapchat ?? "",
    fssaiNumber: (v as any).fssaiNumber ?? "",
    serviceRadiusKm: v.serviceRadiusKm ? String(v.serviceRadiusKm) : "",
  };
}

export function CreateVendorForm({
  ecosystem,
  onCreated,
  editingVendor,
  onUpdated,
}: {
  ecosystem: Ecosystem;
  onCreated: (vendor: Vendor) => void;
  /** When provided, the form runs in "edit" mode — pre-fills fields and
   *  PATCHes the existing listing instead of POSTing a new one. */
  editingVendor?: Vendor | null;
  onUpdated?: (vendor: Vendor) => void;
}) {
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const { user } = useSupabaseSession();
  const isEditing = !!editingVendor;
  const [form, setForm] = React.useState<FormState>(
    editingVendor ? formStateFromVendor(editingVendor) : EMPTY
  );

  // Platform selection step — vendor picks FindMyBites OR PimpMyParty
  // (no "both" option). Skipped when editing (ecosystem already set).
  const [selectedPlatform, setSelectedPlatform] = React.useState<Ecosystem | null>(
    isEditing ? ecosystem : null
  );

  // If the editingVendor prop changes, re-seed the form + platform.
  React.useEffect(() => {
    if (editingVendor) {
      setForm(formStateFromVendor(editingVendor));
      setSelectedPlatform(editingVendor.ecosystem);
    }
  }, [editingVendor]);

  // Use the selected platform (or the editing vendor's ecosystem)
  const activeEcosystem: Ecosystem = selectedPlatform ?? ecosystem;

  // ── Dynamic categories from API (single source of truth: DB) ──
  const [dbCategories, setDbCategories] = React.useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = React.useState(true);

  React.useEffect(() => {
    if (!activeEcosystem) return;
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const res = await fetch(`/api/categories?ecosystem=${activeEcosystem}&t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setDbCategories(data.categories ?? []);
        } else {
          setDbCategories([]);
        }
      } catch {
        setDbCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, [activeEcosystem]);

  // ── Hybrid subcategory system: dropdown + "Other" free text ──
  const [showCustomSubcat, setShowCustomSubcat] = React.useState(false);
  const [customSubcat, setCustomSubcat] = React.useState("");
  const [apiSubcategories, setApiSubcategories] = React.useState<{ id: string; name: string }[]>([]);

  // Fetch subcategories from API when category changes
  React.useEffect(() => {
    if (!form.category) {
      setApiSubcategories([]);
      return;
    }
    const fetchSubs = async () => {
      try {
        const res = await fetch(`/api/categories/subcategories?category=${encodeURIComponent(form.category)}&t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          // If the API returns subcategories with {id, label} format,
          // normalize to {id, name} for the dropdown
          const normalized = data.map((s: any) => ({
            id: s.id || s.slug || s.name,
            name: s.name || s.label || s.slug,
          }));
          setApiSubcategories(normalized);

          // Check if current subcategory is custom (not in list)
          if (form.subcategory) {
            const isCustom = !normalized.find((s: any) => s.name.toLowerCase() === form.subcategory.toLowerCase());
            if (isCustom) {
              setShowCustomSubcat(true);
              setCustomSubcat(form.subcategory);
            }
          }
        } else {
          // API failed — fall back to hardcoded subcategories
          setApiSubcategories([]);
        }
      } catch {
        setApiSubcategories([]);
      }
    };
    fetchSubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.category]);

  // Reset custom state ONLY when category actually changes (not on initial mount)
  const prevCategoryRef = React.useRef(form.category);
  React.useEffect(() => {
    if (prevCategoryRef.current !== form.category) {
      prevCategoryRef.current = form.category;
      setShowCustomSubcat(false);
      setCustomSubcat("");
    }
  }, [form.category]);

  // SINGLE SOURCE OF TRUTH: categories from DB (via API).
  // While loading, cats is empty → the category selector shows a loading state.
  // No hardcoded fallback.
  const cats = dbCategories.map((c) => ({ id: c.id, label: c.label, ecosystem: c.ecosystem, icon: c.icon || "UtensilsCrossed", image: c.image || "", accent: c.accent || "from-amber-400 to-orange-500", description: c.description || "" }));

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // when the country changes, auto-suggest a currency
  const onCountryChange = (code: string) => {
    const c = COUNTRIES.find((x) => x.code === code);
    setForm((f) => ({
      ...f,
      countryCode: code,
      currency: c?.currency ?? f.currency,
    }));
  };

  const valid =
    form.name.trim().length >= 2 &&
    form.category &&
    form.tagline.trim().length >= 5 &&
    form.description.trim().length >= 20 &&
    form.countryCode &&
    form.city.trim().length >= 2 &&
    form.currency &&
    form.priceRange &&
    form.basePrice !== "" &&
    Number(form.basePrice) >= 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      category: form.category,
      subcategory: form.subcategory || undefined,
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      city: form.city.trim(),
      state: form.state.trim() || undefined,
      address: form.address.trim() || undefined,
      zipCode: form.zipCode.trim() || undefined,
      countryCode: form.countryCode,
      currency: form.currency,
      priceRange: form.priceRange,
      basePrice: Number(form.basePrice),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      responseTime: form.responseTime,
      yearsActive: Number(form.yearsActive) || 1,
      logoUrl: form.logoUrl || undefined,
      bannerUrl: form.bannerUrl || undefined,
      instagram: form.instagram.trim() || undefined,
      website: form.website.trim() || undefined,
      whatsapp: form.whatsapp.trim() || undefined,
      facebook: form.facebook.trim() || undefined,
      youtube: form.youtube.trim() || undefined,
      tiktok: form.tiktok.trim() || undefined,
      twitter: form.twitter.trim() || undefined,
      snapchat: form.snapchat.trim() || undefined,
      fssaiNumber: form.fssaiNumber.trim() || undefined,
      serviceRadiusKm: form.serviceRadiusKm
        ? Number(form.serviceRadiusKm)
        : undefined,
    };
    try {
      if (isEditing && editingVendor) {
        const res = await updateVendor.mutateAsync({
          slug: editingVendor.slug,
          input: payload,
        });
        toast.success("Listing updated!", {
          description: `${res.vendor.name} has been updated.`,
        });
        onUpdated?.(res.vendor);
      } else {
        const res = await createVendor.mutateAsync({ ...payload, ecosystem: activeEcosystem });
        toast.success("Listing submitted for approval!", {
          description: `${res.vendor.name} will appear publicly once an admin approves it.`,
        });
        onCreated(res.vendor);
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : isEditing
            ? "Could not update your listing."
            : "Could not list your business."
      );
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Platform selection — only for new listings (not editing) */}
      {!isEditing && !selectedPlatform && (
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-bold">Where would you like to list your business?</h3>
            <p className="text-xs text-muted-foreground">Choose one platform. You can't change this later.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {/* FindMyBites */}
            <button
              type="button"
              onClick={() => setSelectedPlatform("FINDMYBITES")}
              className="group flex flex-col items-start gap-2 rounded-2xl border-2 border-border bg-card p-4 text-left transition-all hover:border-amber-500 hover:shadow-md"
            >
              <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
                <UtensilsCrossed className="size-5" />
              </div>
              <div>
                <p className="font-bold">FindMyBites</p>
                <p className="text-xs text-muted-foreground">Food & bakery businesses</p>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">Cakes</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">Bakers</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">Caterers</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">Chefs</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">+6 more</span>
              </div>
            </button>
            {/* PimpMyParty */}
            <button
              type="button"
              onClick={() => setSelectedPlatform("PIMPMYPARTY")}
              className="group flex flex-col items-start gap-2 rounded-2xl border-2 border-border bg-card p-4 text-left transition-all hover:border-fuchsia-500 hover:shadow-md"
            >
              <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-sm">
                <PartyPopper className="size-5" />
              </div>
              <div>
                <p className="font-bold">PimpMyParty</p>
                <p className="text-xs text-muted-foreground">Event & party services</p>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">Planners</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">DJs</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">Venues</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">Photographers</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">+11 more</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Show the rest of the form only after platform is selected (or when editing) */}
      {(isEditing || selectedPlatform) && (
        <>
          {/* Selected platform badge */}
          {!isEditing && selectedPlatform && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm font-semibold">
                {selectedPlatform === "FINDMYBITES" ? (
                  <><UtensilsCrossed className="size-4 text-amber-500" /> FindMyBites</>
                ) : (
                  <><PartyPopper className="size-4 text-fuchsia-500" /> PimpMyParty</>
                )}
              </span>
              <button
                type="button"
                onClick={() => { setSelectedPlatform(null); setForm(EMPTY); }}
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                Change
              </button>
            </div>
          )}

      {/* Business name */}
      <Field label="Business name" required>
        <Input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Maison Levain"
          className="h-10"
          maxLength={80}
        />
      </Field>

      {/* Category + Subcategory */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" required>
          <Select
            value={form.category}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, category: v, subcategory: "" }))
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Choose a category"} />
            </SelectTrigger>
            <SelectContent>
              {categoriesLoading && cats.length === 0 ? (
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" /> Loading categories...
                </div>
              ) : cats.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">No categories available.</div>
              ) : (
                cats.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Subcategory" hint="Optional — helps customers find you">
          {showCustomSubcat ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={customSubcat}
                  onChange={(e) => {
                    setCustomSubcat(e.target.value);
                    set("subcategory", e.target.value);
                  }}
                  placeholder="e.g. Bento Cakes, Pull-apart Cakes..."
                  className="h-10 flex-1"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 shrink-0"
                  onClick={() => {
                    setShowCustomSubcat(false);
                    set("subcategory", "");
                    setCustomSubcat("");
                  }}
                >
                  ← Back
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                💡 Don&apos;t see yours? Type it and we&apos;ll add it to our directory after review.
              </p>
            </div>
          ) : (
            <Select
              value={form.subcategory}
              onValueChange={(v) => {
                if (v === "__other__") {
                  setShowCustomSubcat(true);
                  set("subcategory", "");
                } else {
                  set("subcategory", v);
                }
              }}
              disabled={!form.category}
            >
              <SelectTrigger className="h-10">
                <SelectValue
                  placeholder={
                    form.category ? "Choose a subcategory" : "Pick a category first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {/* If the saved subcategory isn't in the list, show it as the first option */}
                {form.subcategory &&
                  !apiSubcategories.some((s) => s.name === form.subcategory) && (
                    <SelectItem key="__saved" value={form.subcategory}>
                      {form.subcategory} ✓
                    </SelectItem>
                  )}
                {apiSubcategories.length > 0 ? (
                  apiSubcategories.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No subcategories available for this category.
                  </div>
                )}
                <SelectItem value="__other__">
                  ✏️ Other — type your own
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </Field>
      </div>

      {/* Dynamic category-specific filters (edit mode only — needs vendor ID) */}
      {isEditing && editingVendor && form.category && (
        <DynamicFilters vendorId={editingVendor.id} category={form.category} />
      )}

      {/* Branding uploads — banner + logo */}
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <ImageUpload
          label="Banner photo"
          aspect="banner"
          value={form.bannerUrl}
          onChange={(url) => set("bannerUrl", url)}
          hint="Shown on your card & profile header. 16:9 looks best."
        />
        <ImageUpload
          label="Logo"
          aspect="square"
          value={form.logoUrl}
          onChange={(url) => set("logoUrl", url)}
          hint="Square logo or headshot."
          className="sm:w-40"
        />
      </div>

      {/* Tagline */}
      <Field label="Tagline" required hint="One punchy line shown on your card">
        <Input
          value={form.tagline}
          onChange={(e) => set("tagline", e.target.value)}
          placeholder="e.g. Parisian sourdough & viennoiserie, baked fresh daily"
          className="h-10"
          maxLength={120}
        />
      </Field>

      {/* AI Business Description Generator */}
      <AiListingGenerator
        context={{
          businessName: form.name,
          marketplace: activeEcosystem,
          category: form.category,
          subcategory: form.subcategory,
          city: form.city,
          country: form.countryCode,
          yearsExperience: form.yearsActive,
          priceRange: form.priceRange,
          tags: form.tags,
          deliveryOptions: form.deliveryOptions,
        }}
        onApply={(result: AiListingResult) => {
          set("description", result.description);
          if (result.tagline) set("tagline", result.tagline);
          if (result.businessTags.length) set("tags", result.businessTags.join(", "));
          if (result.keywords.length) set("seoKeywords", result.keywords.join(", "));
        }}
      />

      {/* Description */}
      <Field label="Description" required hint="At least 20 characters">
        <Textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Tell customers about your business, your style, and what makes you special…"
          rows={4}
          className="resize-none"
          maxLength={800}
        />
        <p className="mt-1 text-right text-[11px] text-muted-foreground">
          {form.description.length}/800
        </p>
      </Field>

      {/* Country + City + State */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Country" required>
          <Select
            value={form.countryCode}
            onValueChange={onCountryChange}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  <span className="mr-1.5">{countryCodeToFlag(c.code)}</span>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="City" required>
          <Input
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="e.g. Paris"
            className="h-10"
            maxLength={60}
          />
        </Field>
        <Field label="State / Province / Region" hint="Optional">
          <Input
            value={form.state}
            onChange={(e) => set("state", e.target.value)}
            placeholder="e.g. Île-de-France"
            className="h-10"
            maxLength={80}
          />
        </Field>
      </div>

      {/* Full address + zip/postcode */}
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <Field label="Full address" hint="Street, area, landmarks — helps customers find you">
          <Input
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="e.g. 24 Rue du Faubourg Saint-Honoré, 8th arr."
            className="h-10"
            maxLength={200}
          />
        </Field>
        <Field label="ZIP / Postcode">
          <Input
            value={form.zipCode}
            onChange={(e) => set("zipCode", e.target.value)}
            placeholder="e.g. 75008"
            className="h-10"
            maxLength={20}
          />
        </Field>
      </div>

      {/* Currency + Price range + Base price */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Currency" required>
          <Select
            value={form.currency}
            onValueChange={(v) => set("currency", v)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {CURRENCY_SYMBOLS[c] ?? c} · {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Price range" required>
          <Select
            value={form.priceRange}
            onValueChange={(v) => set("priceRange", v)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent>
              {PRICE_RANGES.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Starting price" required hint={`In ${form.currency || "your currency"}`}>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-muted-foreground">
              {CURRENCY_SYMBOLS[form.currency as string] ?? form.currency ?? ""}
            </span>
            <Input
              type="number"
              min={0}
              value={form.basePrice}
              onChange={(e) => set("basePrice", e.target.value)}
              placeholder="0"
              className="h-10"
            />
          </div>
        </Field>
      </div>

      {/* Tags */}
      <Field label="Tags" hint="Comma-separated, up to 10. Helps customers find you. AI can auto-suggest these.">
        <Input
          value={form.tags}
          onChange={(e) => set("tags", e.target.value)}
          placeholder="e.g. sourdough, weddings, gluten-friendly"
          className="h-10"
        />
      </Field>

      {/* SEO Keywords (auto-generated by AI) */}
      <Field label="SEO Keywords" hint="Auto-generated by AI — used for Google ranking. Comma-separated.">
        <Input
          value={form.seoKeywords}
          onChange={(e) => set("seoKeywords", e.target.value)}
          placeholder="Click 'Generate with AI' above to auto-fill"
          className="h-10"
        />
      </Field>

      {/* Specialities */}
      <Field label="Specialities" hint="What you're famous for (e.g. Custom wedding cakes, South Indian catering)">
        <Input
          value={form.specialities}
          onChange={(e) => set("specialities", e.target.value)}
          placeholder="e.g. Custom wedding cakes, sugar-free desserts"
          className="h-10"
        />
      </Field>

      {/* Delivery + Languages + Custom Orders */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Delivery Options">
          <Select
            value={form.deliveryOptions}
            onValueChange={(v) => set("deliveryOptions", v)}
          >
            <SelectTrigger className="h-10"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Delivery">Delivery</SelectItem>
              <SelectItem value="Pickup">Pickup</SelectItem>
              <SelectItem value="Both">Both</SelectItem>
              <SelectItem value="None">None</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Languages" hint="e.g. English, Hindi, French">
          <Input
            value={form.languages}
            onChange={(e) => set("languages", e.target.value)}
            placeholder="English, Hindi"
            className="h-10"
          />
        </Field>
        <Field label="Custom Orders">
          <Select
            value={form.customOrders ? "yes" : "no"}
            onValueChange={(v) => set("customOrders", v === "yes")}
          >
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes, accepted</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* Response time + Years active */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Typical response time">
          <Select
            value={form.responseTime}
            onValueChange={(v) => set("responseTime", v)}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESPONSE_TIME_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Years active">
          <Input
            type="number"
            min={0}
            value={form.yearsActive}
            onChange={(e) => set("yearsActive", e.target.value)}
            className="h-10"
          />
        </Field>
      </div>

      {/* Contact & socials — optional but powerful for discovery */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <MessageCircle className="size-3.5" />
          Contact &amp; socials
          <span className="ml-auto font-normal normal-case tracking-normal text-muted-foreground/70">
            optional
          </span>
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Instagram" hint="@handle or full link">
            <Input
              value={form.instagram}
              onChange={(e) => set("instagram", e.target.value)}
              placeholder="@yourbusiness"
              className="h-10"
              maxLength={60}
            />
          </Field>
          <Field label="Website" hint="Your site or menu page">
            <Input
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="yourbusiness.com"
              className="h-10"
              maxLength={200}
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="WhatsApp number"
            hint="Include country code — customers message you instantly"
          >
            <Input
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="+44 7700 900123"
              className="h-10"
              maxLength={25}
              inputMode="tel"
            />
          </Field>
          <Field
            label="Service radius (km)"
            hint="How far you'll travel to customers. Blank = they come to you."
          >
            <Input
              type="number"
              min={1}
              value={form.serviceRadiusKm}
              onChange={(e) => set("serviceRadiusKm", e.target.value)}
              placeholder="e.g. 25"
              className="h-10"
              maxLength={5}
              inputMode="numeric"
            />
          </Field>
        </div>
        <GeoPreview
          address={form.address}
          city={form.city}
          state={form.state}
          zipCode={form.zipCode}
          country={
            COUNTRIES.find((c) => c.code === form.countryCode)?.name ?? ""
          }
        />
      </div>

      <Button
        type="submit"
        disabled={createVendor.isPending || updateVendor.isPending || !valid}
        className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
      >
        {createVendor.isPending || updateVendor.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {isEditing ? "Saving changes…" : "Publishing your listing…"}
          </>
        ) : (
          <>
            <Send className="size-4" />
            {isEditing ? "Save changes" : "Publish my business"}
          </>
        )}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles className="size-3.5 text-brand" />
        Free to list · Visible worldwide instantly · No commission
      </p>
        </>
      )}
    </form>
  );
}

/** Live geocoding preview: as the vendor types their address, we geocode it
 *  and show the resolved coordinates + a tiny confirmation. This makes the
 *  lat/lng capture transparent and lets the vendor fix a bad address before
 *  submitting. The actual save happens server-side in POST/PATCH. */
function GeoPreview({
  address,
  city,
  state,
  zipCode,
  country,
}: {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}) {
  const query = [address, city, state, zipCode, country]
    .filter((p) => p.trim())
    .join(", ");
  // Only attempt geocoding when we have at least city + country
  const hasEnough = city.trim().length >= 2 && country.trim().length >= 2;
  const { data, isLoading } = useGeocode(query, hasEnough && query.length > 5);

  // Don't render anything if there's not enough address info
  if (!hasEnough) return null;

  // Only show the preview box when we have a result or are loading
  if (!isLoading && !data) return null;

  return (
    <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs">
      <Navigation className="size-3.5 shrink-0 text-brand" />
      {isLoading ? (
        <span className="text-muted-foreground">Detecting coordinates…</span>
      ) : data ? (
        <span className="text-muted-foreground">
          Pinned at{" "}
          <span className="font-medium text-foreground">
            {data.lat.toFixed(4)}, {data.lng.toFixed(4)}
          </span>{" "}
          — visible in “Near Me” search
        </span>
      ) : null}
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ── Success state ────────────────────────────────────────────────────────

export function CreateVendorSuccess({
  vendor,
  onView,
  onAgain,
}: {
  vendor: Vendor;
  onView: () => void;
  onAgain: () => void;
}) {
  const [showUpgrade, setShowUpgrade] = React.useState(false);
  const brand = vendor.ecosystem === "FINDMYBITES" ? "food" : "party";

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-border bg-brand-soft p-8 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-amber-500 text-white shadow-lg">
        <Clock className="size-8" />
      </div>
      <h3 className="mt-4 text-xl font-bold">Submitted for approval! ⏳</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{vendor.name}</span> has
        been submitted and is pending admin approval. Once approved, it will
        appear publicly on the marketplace.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <span className="rounded-md bg-background px-2 py-1 text-xs font-medium">
          📍 {countryCodeToFlag(vendor.countryCode)} {vendor.continent}
        </span>
        <span className="rounded-md bg-background px-2 py-1 text-xs font-medium">
          {dbCategories.find((c) => c.id === vendor.category)?.label ?? vendor.category}
        </span>
        <span className="rounded-md bg-background px-2 py-1 text-xs font-medium">
          {vendor.priceRange} pricing
        </span>
      </div>

      {/* Upgrade suggestion */}
      <div className="mt-5 w-full rounded-xl border border-brand-border bg-background p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-brand" />
          <p className="text-sm font-bold">Grow faster with a paid plan</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Get verified badge, analytics, more gallery photos, and priority search placement.
        </p>
        <Button
          size="sm"
          onClick={() => setShowUpgrade(true)}
          className="mt-3 gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90"
        >
          <Sparkles className="size-3.5" />
          View Plans
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={onView}
          className="bg-brand text-brand-foreground hover:bg-brand/90"
        >
          <Eye className="size-4" />
          View my listing
        </Button>
        <Button variant="outline" onClick={onAgain}>
          <Store className="size-4" />
          Add another business
        </Button>
      </div>

      {/* Subscription modal */}
      <SubscriptionModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        vendorCountry={vendor.countryCode || "US"}
        vendorBrand={brand as "food" | "party"}
        currentPlan={"free"}
        vendorId={vendor.id}
        vendorEmail={vendor.userEmail || undefined}
        vendorName={vendor.name}
        onSelectPlan={(plan, billing) => {
          setShowUpgrade(false);
        }}
      />
    </div>
  );
}
