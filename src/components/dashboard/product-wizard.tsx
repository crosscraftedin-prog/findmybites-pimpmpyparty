"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ChevronLeft, ChevronRight, Loader2, Sparkles, Upload, X,
  Image as ImageIcon, Eye, Star, AlertCircle, Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Vendor } from "@/lib/types";

interface ProductWizardProps {
  vendor: Vendor;
  initialData?: any;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

const STEPS = [
  { id: 1, title: "Basic Info", icon: Star },
  { id: 2, title: "Photos", icon: ImageIcon },
  { id: 3, title: "Pricing", icon: Star },
  { id: 4, title: "Details", icon: Star },
  { id: 5, title: "SEO", icon: Star },
  { id: 6, title: "Preview", icon: Eye },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", GBP: "£", AED: "AED", AUD: "A$", CAD: "CA$", SGD: "S$", EUR: "€",
};

export function ProductWizard({ vendor, initialData, onSave, onClose, saving }: ProductWizardProps) {
  const [step, setStep] = React.useState(1);
  const [aiGenerating, setAiGenerating] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<string | null>(null);
  const [autoSaving, setAutoSaving] = React.useState(false);

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
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  // ── Auto-save draft (every 15s) ──
  const formRef = React.useRef(form);
  formRef.current = form;

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

  // ── AI Product Writer ──
  const generateWithAI = async () => {
    if (!form.name?.trim()) {
      toast.error("Enter a product name first");
      return;
    }
    setAiGenerating(true);
    try {
      const res = await fetch("/api/ai/product-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          ecosystem: vendor.ecosystem,
          city: vendor.city,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI generation failed");

      if (data.description) set("description", data.description);
      if (data.shortDescription) set("shortDescription", data.shortDescription);
      if (data.metaTitle) set("metaTitle", data.metaTitle);
      if (data.metaDescription) set("metaDescription", data.metaDescription);
      if (data.tags) set("tags", data.tags);
      toast.success("AI generated content — review and edit!");
    } catch (err: any) {
      toast.error(err.message || "AI generation failed");
    }
    setAiGenerating(false);
  };

  // ── Image upload ──
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newImages: string[] = [...(form.images || [])];
    for (const file of Array.from(files).slice(0, 10 - newImages.length)) {
      // Convert to base64 for now (production: upload to Supabase Storage)
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newImages.push(dataUrl);
    }
    set("images", newImages);
    autoSave(); // save after upload
    toast.success(`${files.length} image(s) added`);
  };

  const removeImage = (idx: number) => {
    set("images", form.images.filter((_: any, i: number) => i !== idx));
  };

  const moveImage = (idx: number, dir: "left" | "right") => {
    const imgs = [...form.images];
    const newIdx = dir === "left" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= imgs.length) return;
    [imgs[idx], imgs[newIdx]] = [imgs[newIdx], imgs[idx]];
    set("images", imgs);
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
      setStep(6); // go to preview/validation step
      return;
    }
    const payload = { ...form, price: form.price ? Number(form.price) : 0, status: "active" };
    // Clear draft
    localStorage.removeItem(`product-draft-${vendor.id}`);
    await onSave(payload);
  };

  const handleSaveDraft = async () => {
    const payload = { ...form, price: form.price ? Number(form.price) : 0, status: "draft" };
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
                    <Label>Product Images (up to 10)</Label>
                    <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 py-8 hover:bg-muted/50">
                      <Upload className="size-8 text-muted-foreground" />
                          <span className="mt-2 text-sm font-medium">Drag & drop or click to upload</span>
                          <span className="text-xs text-muted-foreground">PNG, JPG, WebP — max 10 images</span>
                          <input type="file" accept="image/*" multiple className="hidden"
                            onChange={e => handleImageUpload(e.target.files)} />
                    </label>
                  </div>
                  {/* Image grid */}
                  {form.images?.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {form.images.map((img: string, idx: number) => (
                        <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                          <img src={img} alt={`Product ${idx + 1}`} className="h-full w-full object-cover" />
                          {idx === 0 && <Badge className="absolute left-1 top-1 bg-brand text-white text-[8px]">Cover</Badge>}
                          <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <button onClick={() => moveImage(idx, "left")} disabled={idx === 0}
                              className="grid size-6 place-items-center rounded bg-white/80 text-xs disabled:opacity-30">←</button>
                            <button onClick={() => removeImage(idx)}
                              className="grid size-6 place-items-center rounded bg-red-500 text-white"><X className="size-3" /></button>
                            <button onClick={() => moveImage(idx, "right")} disabled={idx === form.images.length - 1}
                              className="grid size-6 place-items-center rounded bg-white/80 text-xs disabled:opacity-30">→</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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

              {/* Step 4: Details (dynamic by ecosystem) */}
              {step === 4 && (
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

              {/* Step 5: SEO */}
              {step === 5 && (
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

              {/* Step 6: Preview & Publish */}
              {step === 6 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Preview & Publish</h3>
                  {/* Validation Checklist */}
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
                    <div className="mt-3 border-t border-border pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Quality Score</span>
                        <span className="text-sm font-bold">{qualityScore}%</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                        <div className={cn("h-full rounded-full", qualityScore >= 80 ? "bg-emerald-500" : qualityScore >= 50 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${qualityScore}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Product Preview Card */}
                  <div className="rounded-xl border border-border bg-card p-4">
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
                  </div>

                  {!validation.allPassed && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                      <AlertCircle className="mb-1 inline size-4" /> Complete the missing items above before publishing.
                    </div>
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
          {step < 6 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed} className="gap-1 bg-brand text-brand-foreground hover:bg-brand/90">
              Next <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={saving || !validation.allPassed} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Publish
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
