"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Package, X, Check, Loader2, Lightbulb, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/marketplace/image-upload";
import { useProducts, useCreateProduct, useDeleteProduct } from "@/lib/queries";
import { getTemplates, type ProductTemplate } from "@/lib/product-templates";
import { getCategoryMigrated, CURRENCY_SYMBOLS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Vendor, Product } from "@/lib/types";

const DIETARY_TAGS = ["Halal", "Vegan", "Vegetarian", "Gluten-free", "Nut-free", "Dairy-free"];
const ALLERGENS = ["Nuts", "Peanuts", "Dairy", "Eggs", "Gluten", "Wheat", "Shellfish", "Fish", "Soy", "Sesame", "Sulphites", "Celery"];
const CUISINE_OPTIONS = ["Arabic & Levantine","Indian & South Asian","West African","East African","Japanese","Korean","Chinese","Thai","Vietnamese","Mediterranean","Italian","French","Mexican & Latin American","Caribbean","Turkish & Ottoman","Persian & Iranian","Greek","British","American","Australian","Fusion","Middle Eastern","Pakistani","Sri Lankan","Nepali","Ethiopian","Nigerian","Ghanaian","Kenyan","Filipino","Indonesian","Malaysian","Other"];
const SHELF_LIFE_OPTIONS = ["Same day (eat fresh)","1-2 days","3-5 days","Up to 1 week","Up to 2 weeks","Up to 1 month","Frozen (up to 3 months)","See storage instructions"];
const STORAGE_OPTIONS = ["Room temperature","Refrigerate","Freeze","Cool dry place","See instructions below"];
const DURATION_OPTIONS = ["1 hour", "2 hours", "3 hours", "4 hours", "Half day", "Full day", "Weekend", "Custom"];

interface ProductsProps { vendor: Vendor; }

export function Products({ vendor }: ProductsProps) {
  const router = useRouter();
  const { data: productsData, isLoading } = useProducts(vendor.id);
  const products = productsData?.products ?? [];
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();
  const [showModal, setShowModal] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [showTemplates, setShowTemplates] = React.useState(true);

  const cat = getCategoryMigrated(vendor.category);
  const isFood = vendor.ecosystem === "FINDMYBITES";
  const symbol = CURRENCY_SYMBOLS[vendor.currency] ?? vendor.currency ?? "$";
  const templates = getTemplates(vendor.ecosystem as any, vendor.category);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteProduct.mutateAsync({ id, vendorId: vendor.id });
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const applyTemplate = (template: ProductTemplate) => {
    setEditingProduct(null);
    setFormFromTemplate(template);
    setShowModal(true);
  };

  const setFormFromTemplate = (t: ProductTemplate) => {
    setForm({
      name: t.name, description: t.description, packageType: t.packageType,
      price: String(t.suggestedPrice), comparePrice: "", currency: vendor.currency || "USD",
      capacity: t.capacity ? String(t.capacity) : "", duration: t.duration || "",
      includes: t.includes, dietaryTags: t.dietaryTags || [], images: [],
      isAvailable: true, leadTime: "", addOns: [],
    });
  };

  const emptyForm = {
    name: "", description: "", packageType: "standard", price: "", comparePrice: "",
    currency: vendor.currency || "USD", capacity: "", duration: "", includes: [] as string[],
    dietaryTags: [] as string[], images: [] as string[], isAvailable: true, leadTime: "", addOns: [] as string[],
    // Enhanced food fields
    allergens: [] as string[], customAllergen: "", cuisineType: "", customisationAvailable: true,
    customisationNotes: "", shelfLife: "", storageMethod: "", storageInstructions: "",
    recipePublic: false, recipeText: "", recipePdf: "",
  };
  const [form, setForm] = React.useState(emptyForm);
  const [includeInput, setIncludeInput] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const addInclude = () => {
    if (includeInput.trim()) { set("includes", [...form.includes, includeInput.trim()]); setIncludeInput(""); }
  };
  const toggleDietary = (tag: string) => {
    set("dietaryTags", form.dietaryTags.includes(tag) ? form.dietaryTags.filter(t => t !== tag) : [...form.dietaryTags, tag]);
  };
  const toggleAllergen = (allergen: string) => {
    set("allergens", (form.allergens || []).includes(allergen) ? (form.allergens || []).filter((a: string) => a !== allergen) : [...(form.allergens || []), allergen]);
  };

  const openAdd = () => { setEditingProduct(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name, description: p.description || "", packageType: (p as any).packageType || "standard",
      price: String(p.price), comparePrice: (p as any).comparePrice ? String((p as any).comparePrice) : "",
      currency: (p as any).currency || vendor.currency || "USD",
      capacity: (p as any).capacity ? String((p as any).capacity) : "",
      duration: (p as any).duration || "", includes: [], dietaryTags: [], images: p.images || [],
      isAvailable: (p as any).isAvailable !== false, leadTime: (p as any).leadTime || "", addOns: [],
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.price) { toast.error("Name and price are required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), comparePrice: form.comparePrice ? Number(form.comparePrice) : null, capacity: form.capacity ? Number(form.capacity) : null, vendorId: vendor.id, allergens: JSON.stringify(form.allergens || []) };
      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error("Update failed");
        toast.success("Product updated!");
      } else {
        await createProduct.mutateAsync(payload as any);
        toast.success("Product created!");
      }
      setShowModal(false);
      setForm(emptyForm);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Your Products & Packages</h1>
          <p className="mt-1 text-sm text-muted-foreground">Add the services or dishes you offer so customers know exactly what to book</p>
        </div>
        <Button onClick={openAdd} className="bg-brand text-brand-foreground hover:bg-brand/90">
          <Plus className="size-4" /> Add Product
        </Button>
      </div>

      {/* Template suggestions */}
      {showTemplates && templates.length > 0 && products.length === 0 && (
        <div className="mb-6 rounded-xl border border-brand-border/40 bg-brand-soft/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold text-brand-soft-foreground">
              <Lightbulb className="size-4 text-brand" /> Based on your category ({cat?.label}), here are suggested packages:
            </p>
            <button onClick={() => setShowTemplates(false)} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {templates.map((t, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-3">
                <Badge className={cn("mb-2 border-0", t.packageType === "premium" ? "bg-amber-100 text-amber-700" : t.packageType === "standard" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground")}>{t.packageType}</Badge>
                <p className="text-sm font-bold">{t.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                <p className="mt-1 text-sm font-bold text-brand">{symbol}{t.suggestedPrice}</p>
                <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => applyTemplate(t)}>Use This Template</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products grid */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <Package className="mx-auto size-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-bold">No products yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Add your first product to help customers understand what you offer</p>
          <Button onClick={openAdd} className="mt-4 bg-brand text-brand-foreground hover:bg-brand/90"><Plus className="size-4" /> Add your first product</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {(p as any).isFeatured && <Star className="size-3.5 text-amber-400 fill-amber-400" />}
                    <h3 className="truncate font-bold">{p.name}</h3>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                </div>
                <Badge variant="secondary" className="shrink-0 border-0 capitalize">{(p as any).packageType || "standard"}</Badge>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="font-bold text-brand">{symbol}{p.price.toLocaleString()}</span>
                {(p as any).capacity && <span className="text-muted-foreground">Up to {(p as any).capacity} guests</span>}
                {(p as any).duration && <span className="text-muted-foreground">{(p as any).duration}</span>}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className={cn("inline-flex items-center gap-1 text-xs font-medium", (p as any).isAvailable !== false ? "text-emerald-600" : "text-muted-foreground")}>
                  <span className={cn("size-2 rounded-full", (p as any).isAvailable !== false ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                  {(p as any).isAvailable !== false ? "Available" : "Unavailable"}
                </span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="size-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id, p.name)} className="text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-lg">
          <DialogTitle className="px-5 pt-5 text-lg font-bold">{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription className="px-5 text-sm text-muted-foreground">Fill in the details of your product or package</DialogDescription>
          <div className="space-y-4 p-5 pt-3">
            {/* Section A: Basic Info */}
            <div>
              <Label className="text-xs font-semibold">Product name *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Custom Wedding Cake" className="h-10 mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Package type</Label>
                <Select value={form.packageType} onValueChange={v => set("packageType", v)}>
                  <SelectTrigger className="h-10 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="basic">Basic</SelectItem><SelectItem value="standard">Standard</SelectItem><SelectItem value="premium">Premium</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Price * ({symbol})</Label>
                <Input type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="0" className="h-10 mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Description</Label>
              <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe what's included..." rows={2} className="resize-none mt-1" maxLength={200} />
              <p className="mt-0.5 text-right text-[10px] text-muted-foreground">{form.description.length}/200</p>
            </div>

            {/* Section B: Details */}
            {isFood ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Feeds up to</Label>
                  <Input type="number" value={form.capacity} onChange={e => set("capacity", e.target.value)} placeholder="50" className="h-10 mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Lead time</Label>
                  <Input value={form.leadTime} onChange={e => set("leadTime", e.target.value)} placeholder="3 days" className="h-10 mt-1" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Duration</Label>
                  <Select value={form.duration} onValueChange={v => set("duration", v)}>
                    <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{DURATION_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Max capacity</Label>
                  <Input type="number" value={form.capacity} onChange={e => set("capacity", e.target.value)} placeholder="100" className="h-10 mt-1" />
                </div>
              </div>
            )}

            {/* Dietary tags (food only) */}
            {isFood && (
              <div>
                <Label className="text-xs font-semibold">Dietary tags</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {DIETARY_TAGS.map(tag => (
                    <button key={tag} type="button" onClick={() => toggleDietary(tag)} className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors", form.dietaryTags.includes(tag) ? "border-brand bg-brand-soft text-brand-soft-foreground" : "border-border text-muted-foreground hover:bg-accent")}>
                      {form.dietaryTags.includes(tag) && <Check className="mr-0.5 inline size-3" />}{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Section C: Includes */}
            <div>
              <Label className="text-xs font-semibold">What's included</Label>
              <div className="mt-1 flex gap-2">
                <Input value={includeInput} onChange={e => setIncludeInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addInclude(); } }} placeholder="e.g. 3-tier cake" className="h-10" />
                <Button type="button" variant="outline" size="sm" onClick={addInclude} className="h-10 shrink-0"><Plus className="size-4" /></Button>
              </div>
              {form.includes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.includes.map((item, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 border-0 bg-brand-soft text-brand-soft-foreground">✓ {item}<button onClick={() => set("includes", form.includes.filter((_, idx) => idx !== i))}><X className="size-3" /></button></Badge>
                  ))}
                </div>
              )}
            </div>

            {/* ── ALLERGEN INFORMATION (food only) ── */}
            {isFood && (
              <div>
                <Label className="text-xs font-semibold">⚠️ Allergen Information</Label>
                <p className="text-[11px] text-muted-foreground">Help customers with allergies make safe choices</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {ALLERGENS.map(a => (
                    <button key={a} type="button" onClick={() => toggleAllergen(a)} className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors", (form.allergens || []).includes(a) ? "border-red-400 bg-red-50 text-red-700" : "border-border text-muted-foreground hover:bg-accent")}>
                      ⚠️ {a}
                    </button>
                  ))}
                </div>
                <Input value={form.customAllergen} onChange={e => set("customAllergen", e.target.value)} placeholder="Any other allergens? e.g. Mustard, Lupin..." className="h-10 mt-2" />
              </div>
            )}

            {/* ── CUISINE TYPE (food only) ── */}
            {isFood && (
              <div>
                <Label className="text-xs font-semibold">Cuisine Type</Label>
                <p className="text-[11px] text-muted-foreground">Help customers find your style of cooking</p>
                <Select value={form.cuisineType} onValueChange={v => set("cuisineType", v)}>
                  <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select cuisine" /></SelectTrigger>
                  <SelectContent>{CUISINE_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                {form.cuisineType === "Other" && (
                  <Input value={form.cuisineType === "Other" ? "" : form.cuisineType} onChange={e => set("cuisineType", e.target.value)} placeholder="Type your cuisine..." className="h-10 mt-2" />
                )}
              </div>
            )}

            {/* ── CUSTOMISATION (food only) ── */}
            {isFood && (
              <div className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold">Customisation Available</Label>
                    <p className="text-[11px] text-muted-foreground">Can customers customise this product?</p>
                  </div>
                  <button type="button" onClick={() => set("customisationAvailable", !form.customisationAvailable)} className={cn("relative h-6 w-11 rounded-full transition-colors", form.customisationAvailable ? "bg-brand" : "bg-muted-foreground/30")}>
                    <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform", form.customisationAvailable ? "translate-x-5" : "translate-x-0.5")} />
                  </button>
                </div>
                {form.customisationAvailable && (
                  <div className="mt-3">
                    <Label className="text-xs font-semibold">What can be customised?</Label>
                    <Textarea value={form.customisationNotes} onChange={e => set("customisationNotes", e.target.value)} placeholder="e.g. Flavours, colours, text on cake, dietary requirements..." rows={2} className="resize-none mt-1" maxLength={200} />
                    <p className="mt-0.5 text-right text-[10px] text-muted-foreground">{(form.customisationNotes || "").length}/200</p>
                  </div>
                )}
              </div>
            )}

            {/* ── SHELF LIFE & STORAGE (food only) ── */}
            {isFood && (
              <div>
                <Label className="text-xs font-semibold">Shelf Life & Storage</Label>
                <div className="mt-1 grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Shelf life</Label>
                    <Select value={form.shelfLife} onValueChange={v => set("shelfLife", v)}>
                      <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{SHELF_LIFE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Storage method</Label>
                    <Select value={form.storageMethod} onValueChange={v => set("storageMethod", v)}>
                      <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{STORAGE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <Textarea value={form.storageInstructions} onChange={e => set("storageInstructions", e.target.value)} placeholder="Storage instructions (optional)" rows={2} className="resize-none mt-2" maxLength={300} />
                <p className="mt-0.5 text-right text-[10px] text-muted-foreground">{(form.storageInstructions || "").length}/300</p>
              </div>
            )}

            {/* ── RECIPE (food only, optional) ── */}
            {isFood && (
              <div className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold">📖 Share Your Recipe (Optional)</Label>
                    <p className="text-[11px] text-muted-foreground">Sharing builds trust. Keep it private anytime.</p>
                  </div>
                  <button type="button" onClick={() => set("recipePublic", !form.recipePublic)} className={cn("relative h-6 w-11 rounded-full transition-colors", form.recipePublic ? "bg-brand" : "bg-muted-foreground/30")}>
                    <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform", form.recipePublic ? "translate-x-5" : "translate-x-0.5")} />
                  </button>
                </div>
                {form.recipePublic ? (
                  <div className="mt-3 space-y-3">
                    <div>
                      <Label className="text-xs font-semibold">Write your recipe</Label>
                      <Textarea value={form.recipeText} onChange={e => set("recipeText", e.target.value)} placeholder={"Ingredients:\n- 250g flour\n- 2 eggs\n\nMethod:\n1. Mix..."} rows={4} className="resize-none mt-1" />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">or upload a PDF recipe card</Label>
                      <Input type="text" value={form.recipePdf} onChange={e => set("recipePdf", e.target.value)} placeholder="PDF URL (upload first, paste URL)" className="h-10 mt-1" />
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-muted-foreground/60">🔒 Your recipe stays private. Only you can see it.</p>
                )}
              </div>
            )}

            {/* Section D: Photos */}
            <div>
              <Label className="text-xs font-semibold">Photos (up to 5)</Label>
              <div className="mt-1">
                {form.images.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative size-16 overflow-hidden rounded-lg border border-border">
                        <img src={img} alt="" className="h-full w-full object-cover" />
                        <button type="button" onClick={() => set("images", form.images.filter((_, idx) => idx !== i))} className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-black/60 text-white"><X className="size-2.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
                {form.images.length < 5 && <ImageUpload label="Add photo" aspect="square" value="" onChange={url => set("images", [...form.images, url])} hint={`${5 - form.images.length} slots left`} />}
              </div>
            </div>

            {/* Section E: Availability */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="text-xs font-semibold">Available for booking</Label>
              <button type="button" onClick={() => set("isAvailable", !form.isAvailable)} className={cn("relative h-6 w-11 rounded-full transition-colors", form.isAvailable ? "bg-brand" : "bg-muted-foreground/30")}>
                <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform", form.isAvailable ? "translate-x-5" : "translate-x-0.5")} />
              </button>
            </div>

            {/* Save buttons */}
            <div className="flex gap-2 pt-2">
              <Button onClick={save} disabled={saving} className="flex-1 bg-brand text-brand-foreground hover:bg-brand/90">{saving ? <Loader2 className="size-4 animate-spin" /> : "Save Product"}</Button>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
