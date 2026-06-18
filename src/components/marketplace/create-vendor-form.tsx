"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Loader2,
  Send,
  Store,
  CheckCircle2,
  Eye,
  Sparkles,
  MessageCircle,
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
import { useCreateVendor } from "@/lib/queries";
import { useMarketplace } from "@/lib/store";
import {
  CATEGORIES,
  COUNTRIES,
  CURRENCY_OPTIONS,
  CURRENCY_SYMBOLS,
  PRICE_RANGES,
  RESPONSE_TIME_OPTIONS,
  categoriesFor,
  subcategoriesFor,
} from "@/lib/constants";
import { countryCodeToFlag } from "@/lib/format";
import { ImageUpload } from "./image-upload";
import type { Ecosystem, Vendor } from "@/lib/types";

interface FormState {
  name: string;
  category: string;
  subcategory: string;
  tagline: string;
  description: string;
  countryCode: string;
  city: string;
  address: string;
  zipCode: string;
  currency: string;
  priceRange: string;
  basePrice: string;
  tags: string;
  responseTime: string;
  yearsActive: string;
  logoUrl: string;
  bannerUrl: string;
  instagram: string;
  website: string;
  whatsapp: string;
}

const EMPTY: FormState = {
  name: "",
  category: "",
  subcategory: "",
  tagline: "",
  description: "",
  countryCode: "",
  city: "",
  address: "",
  zipCode: "",
  currency: "",
  priceRange: "",
  basePrice: "",
  tags: "",
  responseTime: "under 2 hours",
  yearsActive: "1",
  logoUrl: "",
  bannerUrl: "",
  instagram: "",
  website: "",
  whatsapp: "",
};

export function CreateVendorForm({
  ecosystem,
  onCreated,
}: {
  ecosystem: Ecosystem;
  onCreated: (vendor: Vendor) => void;
}) {
  const createVendor = useCreateVendor();
  const [form, setForm] = React.useState<FormState>(EMPTY);

  const cats = categoriesFor(ecosystem);

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
    try {
      const res = await createVendor.mutateAsync({
        name: form.name.trim(),
        ecosystem,
        category: form.category,
        subcategory: form.subcategory || undefined,
        tagline: form.tagline.trim(),
        description: form.description.trim(),
        city: form.city.trim(),
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
      });
      toast.success("Your business is live!", {
        description: `${res.vendor.name} is now listed on the marketplace.`,
      });
      onCreated(res.vendor);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not list your business."
      );
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {cats.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Subcategory" hint="Optional — helps customers find you">
          <Select
            value={form.subcategory}
            onValueChange={(v) => set("subcategory", v)}
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
              {subcategoriesFor(form.category).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

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

      {/* Country + City */}
      <div className="grid gap-4 sm:grid-cols-2">
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
          <Input
            type="number"
            min={0}
            value={form.basePrice}
            onChange={(e) => set("basePrice", e.target.value)}
            placeholder="0"
            className="h-10"
          />
        </Field>
      </div>

      {/* Tags */}
      <Field label="Tags" hint="Comma-separated, up to 10. Helps customers find you.">
        <Input
          value={form.tags}
          onChange={(e) => set("tags", e.target.value)}
          placeholder="e.g. sourdough, weddings, gluten-friendly"
          className="h-10"
        />
      </Field>

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
        <div className="mt-4">
          <Field
            label="WhatsApp number"
            hint="Include country code, e.g. +44 7700 900123 — customers can message you instantly"
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
        </div>
      </div>

      <Button
        type="submit"
        disabled={createVendor.isPending || !valid}
        className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
      >
        {createVendor.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Publishing your listing…
          </>
        ) : (
          <>
            <Send className="size-4" />
            Publish my business
          </>
        )}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles className="size-3.5 text-brand" />
        Free to list · Visible worldwide instantly · No commission
      </p>
    </form>
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
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-border bg-brand-soft p-8 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-brand text-brand-foreground shadow-lg">
        <CheckCircle2 className="size-8" />
      </div>
      <h3 className="mt-4 text-xl font-bold">Your business is live! 🎉</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{vendor.name}</span> is
        now listed in {vendor.city}, {vendor.country} and visible to customers
        worldwide.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <span className="rounded-md bg-background px-2 py-1 text-xs font-medium">
          📍 {countryCodeToFlag(vendor.countryCode)} {vendor.continent}
        </span>
        <span className="rounded-md bg-background px-2 py-1 text-xs font-medium">
          {CATEGORIES.find((c) => c.id === vendor.category)?.label ?? vendor.category}
        </span>
        <span className="rounded-md bg-background px-2 py-1 text-xs font-medium">
          {vendor.priceRange} pricing
        </span>
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
    </div>
  );
}
