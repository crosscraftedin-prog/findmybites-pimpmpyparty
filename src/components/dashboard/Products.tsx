"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Package, X, Check, Loader2, Lightbulb, Star, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
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

// ── Dynamic filter values (fetched from Universal Filter Engine) ──
interface FilterValue { id: string; value: string; }
interface FilterGroup { id: string; name: string; type: string; unit: string | null; values: FilterValue[]; }

interface ProductsProps { vendor: Vendor; }

// ── Collapsible Section helper ──────────────────────────────────
function Section({ title, children, defaultOpen = true, icon: Icon }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean; icon?: React.ComponentType<{ className?: string }>;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="rounded-lg border border-border">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-3 text-left">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {Icon && <Icon className="size-3.5" />}{title}
        </span>
        {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>
      {open && <div className="space-y-3 p-3 pt-0">{children}</div>}
    </div>
  );
}

// ── Toggle Chip ─────────────────────────────────────────────────
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors", active ? "bg-brand text-white" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
      {active && <Check className="mr-0.5 inline size-2.5" />}{label}
    </button>
  );
}

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

  // ── Fetch dynamic filters for this vendor's category ──────────
  const [categoryFilters, setCategoryFilters] = React.useState<FilterGroup[]>([]);
  React.useEffect(() => {
    if (!vendor.category) return;
    fetch(`/api/filters/category?category=${encodeURIComponent(vendor.category)}&t=${Date.now()}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCategoryFilters(data); })
      .catch(() => {});
  }, [vendor.category]);

  // Helper: get filter values by group name
  const getFilterValues = (name: string): string[] => {
    const group = categoryFilters.find(f => f.name === name);
    return group?.values.map(v => v.value) ?? [];
  };

  // ── Determine product type options based on category ──────────
  const productTypes = getFilterValues("Bakery Product Type").length > 0
    ? getFilterValues("Bakery Product Type")
    : getFilterValues("Party Product Type").length > 0
      ? getFilterValues("Party Product Type")
      : [];

  const dietaryOptions = getFilterValues("Dietary Options").length > 0
    ? getFilterValues("Dietary Options")
    : ["Eggless", "Vegan", "Vegetarian", "Gluten-free", "Nut-free", "Dairy-free", "Halal", "Jain"];

  const allergenOptions = ["Nuts", "Peanuts", "Dairy", "Eggs", "Gluten", "Wheat", "Shellfish", "Fish", "Soy", "Sesame", "Sulphites", "Celery"];

  const flavourOptions = getFilterValues("Flavour").length > 0
    ? getFilterValues("Flavour")
    : ["Chocolate", "Vanilla", "Red Velvet", "Black Forest", "Butterscotch", "Strawberry", "Coffee", "Fruit", "Lemon", "Caramel"];

  const cakeTypeOptions = getFilterValues("Cake Type").length > 0
    ? getFilterValues("Cake Type")
    : ["Fondant", "Buttercream", "Fresh Cream", "Photo Cake", "Tier Cake", "Cupcakes", "Bento Cake", "Cheesecake"];

  const occasionOptions = getFilterValues("Occasion").length > 0
    ? getFilterValues("Occasion")
    : ["Birthday", "Wedding", "Anniversary", "Baby Shower", "Engagement", "Corporate", "Festival"];

  const themeOptions = getFilterValues("Party Theme").length > 0
    ? getFilterValues("Party Theme")
    : ["Princess", "Superhero", "Unicorn", "Dinosaur", "Jungle", "Space", "Floral", "Sports", "Cartoon", "Custom Theme"];

  // ── Determine which sections to show based on category ────────
  const isBakery = vendor.category?.includes("baker") || vendor.category?.includes("home-baker") || vendor.category?.includes("home-bakery");
  const isChocolatier = vendor.category?.includes("chocolat");
  const isDessert = vendor.category?.includes("dessert");
  const isCaterer = vendor.category?.includes("cater");
  const isPartySupplies = vendor.category?.includes("party-supplies") || vendor.category?.includes("party-suppl");
  const isFoodCategory = isFood;

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteProduct.mutateAsync({ id, vendorId: vendor.id });
      toast.success("Product deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const emptyForm = {
    name: "", description: "", packageType: "standard", price: "", comparePrice: "",
    currency: vendor.currency || "USD", capacity: "", duration: "", includes: [] as string[],
    dietaryTags: [] as string[], images: [] as string[], isAvailable: true, leadTime: "", addOns: [],
    allergens: [] as string[], cuisineType: "", customisationAvailable: true,
    customisationNotes: "", shelfLife: "", storageMethod: "", storageInstructions: "",
    recipePublic: false, recipeText: "", recipePdf: "",
    offerType: "none", offerLabel: "", offerExpiresAt: "", freeItemDescription: "",
    bundleDescription: "", bundleDiscount: "", isFlashDeal: false, flashDealEndsAt: "",
    minOrderForOffer: "", exclusiveMemberOffer: false,
    // Smart dynamic fields
    productType: "", cakeShape: "", cakeSize: "", serves: "", layers: "", cakeFlavour: "",
    filling: "", frosting: "", cakeFinish: "", cakeType: "", occasion: [] as string[],
    theme: [] as string[], customDesign: false, photoCake: false, themeCake: false,
    nameOnCake: false, nameOnCakeText: "", nameOnCakeMaxChars: "20",
    pieces: "", boxSize: "", weight: "", netWeight: "", cocoaPercentage: "",
    chocolateType: "", giftBox: false, personalisedMessage: "", ribbonColour: "",
    snackBoxType: "", snackContents: [] as string[], numSnacks: "", ageGroup: "",
    customBranding: false, nutritionPer: "", calories: "", protein: "", carbs: "", fat: "",
    minOrder: "", maxOrder: "", deliveryAvailable: false, pickupAvailable: false, nationwideShipping: false,
    material: [] as string[], personalization: [] as string[],
  };
  const [form, setForm] = React.useState(emptyForm);
  const [includeInput, setIncludeInput] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [selectedProductType, setSelectedProductType] = React.useState("");

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const toggleArray = (key: string, value: string) => {
    const arr = (form as any)[key] as string[];
    set(key, arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  };

  const openAdd = () => { setEditingProduct(null); setForm(emptyForm); setSelectedProductType(""); setShowModal(true); };
  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      ...emptyForm,
      name: p.name, description: p.description || "", packageType: (p as any).packageType || "standard",
      price: String(p.price), comparePrice: (p as any).comparePrice ? String((p as any).comparePrice) : "",
      currency: (p as any).currency || vendor.currency || "USD",
      capacity: (p as any).capacity ? String((p as any).capacity) : "",
      duration: (p as any).duration || "", includes: [], dietaryTags: [], images: p.images || [],
      isAvailable: (p as any).isAvailable !== false, leadTime: (p as any).leadTime || "",
      productType: (p as any).productType || "", cakeFlavour: (p as any).flavours || "",
      serves: (p as any).servings || "", weight: (p as any).weight || "",
    });
    setSelectedProductType((p as any).productType || "");
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.price) { toast.error("Name and price are required"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
        capacity: form.capacity ? Number(form.capacity) : null,
        vendorId: vendor.id,
        allergens: JSON.stringify(form.allergens || []),
        occasion: JSON.stringify(form.occasion || []),
        theme: JSON.stringify(form.theme || []),
        snackContents: JSON.stringify(form.snackContents || []),
        material: JSON.stringify(form.material || []),
        personalization: JSON.stringify(form.personalization || []),
        extraFields: JSON.stringify({
          productType: form.productType, cakeShape: form.cakeShape, cakeSize: form.cakeSize,
          serves: form.serves, layers: form.layers, cakeFlavour: form.cakeFlavour,
          filling: form.filling, frosting: form.frosting, cakeFinish: form.cakeFinish,
          cakeType: form.cakeType, customDesign: form.customDesign, photoCake: form.photoCake,
          themeCake: form.themeCake, nameOnCake: form.nameOnCake, nameOnCakeText: form.nameOnCakeText,
          nameOnCakeMaxChars: form.nameOnCakeMaxChars, pieces: form.pieces, boxSize: form.boxSize,
          weight: form.weight, netWeight: form.netWeight, cocoaPercentage: form.cocoaPercentage,
          chocolateType: form.chocolateType, giftBox: form.giftBox, personalisedMessage: form.personalisedMessage,
          ribbonColour: form.ribbonColour, snackBoxType: form.snackBoxType, numSnacks: form.numSnacks,
          ageGroup: form.ageGroup, customBranding: form.customBranding, nutritionPer: form.nutritionPer,
          calories: form.calories, protein: form.protein, carbs: form.carbs, fat: form.fat,
          minOrder: form.minOrder, maxOrder: form.maxOrder,
        }),
      };
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
    } catch (e: any) { toast.error(e.message || "Failed to save"); }
    setSaving(false);
  };

  // ── Determine which sections to show based on selected product type ──
  const isCake = selectedProductType === "Cakes" || (!selectedProductType && isBakery);
  const isCupcake = selectedProductType === "Cupcakes";
  const isBrownie = selectedProductType === "Brownies";
  const isCookie = selectedProductType === "Cookies";
  const isDessertBox = selectedProductType === "Dessert Boxes";
  const isSnackBox = selectedProductType === "Snack Boxes";
  const isChocolate = isChocolatier || selectedProductType === "Chocolates";
  const isBread = selectedProductType === "Breads" || (!selectedProductType && vendor.category?.includes("bakery"));
  const isBalloons = selectedProductType === "Balloons" || selectedProductType === "Helium Balloons";
  const showNutrition = isFoodCategory && !isPartySupplies;
  const showCakeFields = isCake;
  const showCupcakeFields = isCupcake;
  const showBrownieFields = isBrownie;
  const showCookieFields = isCookie;
  const showDessertBoxFields = isDessertBox;
  const showSnackBoxFields = isSnackBox;
  const showChocolateFields = isChocolate;
  const showBreadFields = isBread;
  const showPartySupplyFields = isPartySupplies;

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

      {/* Smart Dynamic Product Form Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-2xl">
          <DialogTitle className="px-5 pt-5 text-lg font-bold">{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription className="px-5 text-sm text-muted-foreground">
            {isFood ? "Fill in the details — the form adapts to what you're selling" : "Add your product details"}
          </DialogDescription>
          <div className="space-y-3 p-5 pt-3">

            {/* ── Section 1: Basic Info ─────────────────────────── */}
            <Section title="Basic Information" icon={Package}>
              <div>
                <Label className="text-xs font-semibold">Product name *</Label>
                <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Custom Wedding Cake" className="h-10 mt-1" />
              </div>

              {/* Product Type selector (from Universal Filter Engine) */}
              {productTypes.length > 0 && (
                <div>
                  <Label className="text-xs font-semibold">Product Type</Label>
                  <Select value={selectedProductType} onValueChange={(v) => { setSelectedProductType(v); set("productType", v); }}>
                    <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select product type" /></SelectTrigger>
                    <SelectContent>
                      {productTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-[10px] text-muted-foreground">Selecting a type shows relevant fields below</p>
                </div>
              )}

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
                <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe what's included..." rows={2} className="resize-none mt-1" maxLength={300} />
              </div>
              {/* Photos */}
              <div>
                <Label className="text-xs font-semibold">Product Photos (up to 10)</Label>
                <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                      <img src={img} alt={`Product ${i+1}`} className="h-full w-full object-cover" />
                      <button type="button" onClick={() => set("images", form.images.filter((_, j) => j !== i))} className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/60 text-white"><X className="size-3" /></button>
                    </div>
                  ))}
                  {form.images.length < 10 && (
                    <div className="aspect-square">
                      <ImageUpload label="" aspect="square" value="" onChange={(url) => url && set("images", [...form.images, url])} hint="" />
                    </div>
                  )}
                </div>
              </div>
            </Section>

            {/* ── Section 2: Product-Specific Details ──────────── */}
            {(showCakeFields || showCupcakeFields || showBrownieFields || showCookieFields || showDessertBoxFields || showSnackBoxFields || showChocolateFields || showBreadFields || showPartySupplyFields) && (
              <Section title="Product Details" icon={Sparkles}>
                {/* Cake fields */}
                {showCakeFields && <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs font-semibold">Cake Shape</Label>
                      <Select value={form.cakeShape} onValueChange={v => set("cakeShape", v)}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Shape" /></SelectTrigger><SelectContent><SelectItem value="round">Round</SelectItem><SelectItem value="square">Square</SelectItem><SelectItem value="rectangle">Rectangle</SelectItem><SelectItem value="heart">Heart</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent></Select>
                    </div>
                    <div><Label className="text-xs font-semibold">Cake Size (kg)</Label><Input type="number" value={form.cakeSize} onChange={e => set("cakeSize", e.target.value)} placeholder="1" className="h-10 mt-1" /></div>
                    <div><Label className="text-xs font-semibold">Serves (portions)</Label><Input type="number" value={form.serves} onChange={e => set("serves", e.target.value)} placeholder="20" className="h-10 mt-1" /></div>
                    <div><Label className="text-xs font-semibold">Number of Layers</Label><Input type="number" value={form.layers} onChange={e => set("layers", e.target.value)} placeholder="1" className="h-10 mt-1" /></div>
                  </div>
                  <div><Label className="text-xs font-semibold">Flavour</Label>
                    <Select value={form.cakeFlavour} onValueChange={v => set("cakeFlavour", v)}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select flavour" /></SelectTrigger><SelectContent>{flavourOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs font-semibold">Filling</Label><Input value={form.filling} onChange={e => set("filling", e.target.value)} placeholder="e.g. Chocolate ganache" className="h-10 mt-1" /></div>
                    <div><Label className="text-xs font-semibold">Frosting</Label><Input value={form.frosting} onChange={e => set("frosting", e.target.value)} placeholder="e.g. Buttercream" className="h-10 mt-1" /></div>
                  </div>
                  <div><Label className="text-xs font-semibold">Cake Finish / Type</Label>
                    <div className="flex flex-wrap gap-1.5 mt-1">{cakeTypeOptions.map(t => <Chip key={t} label={t} active={form.cakeType === t} onClick={() => set("cakeType", form.cakeType === t ? "" : t)} />)}</div>
                  </div>
                  {/* Name on Cake toggle */}
                  <div className="rounded-lg border border-border p-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.nameOnCake} onChange={e => set("nameOnCake", e.target.checked)} className="size-4 rounded" />
                      <span className="text-xs font-semibold">Allow name on cake</span>
                    </label>
                    {form.nameOnCake && (
                      <div className="mt-2 space-y-2">
                        <div><Label className="text-[10px] text-muted-foreground">Field label (shown to customer)</Label><Input value={form.nameOnCakeText || "Name to be written"} onChange={e => set("nameOnCakeText", e.target.value)} placeholder="Name to be written" className="h-9 mt-1" /></div>
                        <div><Label className="text-[10px] text-muted-foreground">Max characters</Label><Input type="number" value={form.nameOnCakeMaxChars} onChange={e => set("nameOnCakeMaxChars", e.target.value)} className="h-9 mt-1 w-24" /></div>
                        <p className="text-[10px] text-muted-foreground">Example: "Happy Birthday Emma"</p>
                      </div>
                    )}
                  </div>
                </>}

                {/* Cupcake fields */}
                {showCupcakeFields && <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs font-semibold">Number of Pieces</Label><Input type="number" value={form.pieces} onChange={e => set("pieces", e.target.value)} placeholder="12" className="h-10 mt-1" /></div>
                    <div><Label className="text-xs font-semibold">Box Size</Label><Input value={form.boxSize} onChange={e => set("boxSize", e.target.value)} placeholder="e.g. Box of 12" className="h-10 mt-1" /></div>
                    <div><Label className="text-xs font-semibold">Serves</Label><Input type="number" value={form.serves} onChange={e => set("serves", e.target.value)} placeholder="12" className="h-10 mt-1" /></div>
                    <div><Label className="text-xs font-semibold">Custom Colours</Label><Input value={form.filling} onChange={e => set("filling", e.target.value)} placeholder="e.g. Pink, Blue" className="h-10 mt-1" /></div>
                  </div>
                  <div><Label className="text-xs font-semibold">Flavour</Label>
                    <Select value={form.cakeFlavour} onValueChange={v => set("cakeFlavour", v)}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select flavour" /></SelectTrigger><SelectContent>{flavourOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select>
                  </div>
                </>}

                {/* Brownie fields */}
                {showBrownieFields && <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs font-semibold">Pieces Per Box</Label><Input type="number" value={form.pieces} onChange={e => set("pieces", e.target.value)} placeholder="9" className="h-10 mt-1" /></div>
                    <div><Label className="text-xs font-semibold">Box Size</Label><Input value={form.boxSize} onChange={e => set("boxSize", e.target.value)} placeholder="e.g. Box of 9" className="h-10 mt-1" /></div>
                    <div><Label className="text-xs font-semibold">Weight (g)</Label><Input type="number" value={form.weight} onChange={e => set("weight", e.target.value)} placeholder="500" className="h-10 mt-1" /></div>
                    <div><Label className="text-xs font-semibold">Serves</Label><Input type="number" value={form.serves} onChange={e => set("serves", e.target.value)} placeholder="9" className="h-10 mt-1" /></div>
                  </div>
                  <div><Label className="text-xs font-semibold">Flavour</Label>
                    <Select value={form.cakeFlavour} onValueChange={v => set("cakeFlavour", v)}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select flavour" /></SelectTrigger><SelectContent>{flavourOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select>
                  </div>
                </>}

                {/* Cookie fields */}
                {showCookieFields && <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs font-semibold">Pieces</Label><Input type="number" value={form.pieces} onChange={e => set("pieces", e.target.value)} placeholder="12" className="h-10 mt-1" /></div>
                    <div><Label className="text-xs font-semibold">Cookie Size</Label><Input value={form.cakeSize} onChange={e => set("cakeSize", e.target.value)} placeholder="e.g. 3 inch" className="h-10 mt-1" /></div>
                  </div>
                  <div><Label className="text-xs font-semibold">Flavour</Label>
                    <Select value={form.cakeFlavour} onValueChange={v => set("cakeFlavour", v)}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select flavour" /></SelectTrigger><SelectContent>{flavourOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div><Label className="text-xs font-semibold">Gift Box</Label>
                    <div className="flex gap-2 mt-1"><Chip label="Yes" active={form.giftBox} onClick={() => set("giftBox", !form.giftBox)} /><Chip label="No" active={!form.giftBox} onClick={() => set("giftBox", false)} /></div>
                  </div>
                </>}

                {/* Dessert Box fields */}
                {showDessertBoxFields && <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs font-semibold">Number of Items</Label><Input type="number" value={form.pieces} onChange={e => set("pieces", e.target.value)} placeholder="6" className="h-10 mt-1" /></div>
                    <div><Label className="text-xs font-semibold">Box Size</Label><Input value={form.boxSize} onChange={e => set("boxSize", e.target.value)} placeholder="e.g. Medium" className="h-10 mt-1" /></div>
                    <div><Label className="text-xs font-semibold">Weight (g)</Label><Input type="number" value={form.weight} onChange={e => set("weight", e.target.value)} placeholder="750" className="h-10 mt-1" /></div>
                    <div><Label className="text-xs font-semibold">Serves</Label><Input type="number" value={form.serves} onChange={e => set("serves", e.target.value)} placeholder="4" className="h-10 mt-1" /></div>
                  </div>
                </>}

                {/* Snack Box fields */}
                {showSnackBoxFields && <>
                  <div><Label className="text-xs font-semibold">Snack Box Type</Label>
                    <Select value={form.snackBoxType} onValueChange={v => set("snackBoxType", v)}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent><SelectItem value="Kids Party Snack Box">Kids Party</SelectItem><SelectItem value="Birthday Snack Box">Birthday</SelectItem><SelectItem value="School Snack Box">School</SelectItem><SelectItem value="Corporate Snack Box">Corporate</SelectItem><SelectItem value="Breakfast Box">Breakfast</SelectItem><SelectItem value="Lunch Box">Lunch</SelectItem><SelectItem value="Picnic Box">Picnic</SelectItem></SelectContent></Select>
                  </div>
                  <div><Label className="text-xs font-semibold">Contents</Label>
                    <div className="flex flex-wrap gap-1.5 mt-1">{["Sweet", "Savoury", "Mixed"].map(s => <Chip key={s} label={s} active={form.snackContents.includes(s)} onClick={() => toggleArray("snackContents", s)} />)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs font-semibold">Number of Snacks</Label><Input type="number" value={form.numSnacks} onChange={e => set("numSnacks", e.target.value)} placeholder="10" className="h-10 mt-1" /></div>
                    <div><Label className="text-xs font-semibold">Age Group</Label>
                      <Select value={form.ageGroup} onValueChange={v => set("ageGroup", v)}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Kids">Kids</SelectItem><SelectItem value="Adults">Adults</SelectItem><SelectItem value="Mixed">Mixed</SelectItem></SelectContent></Select>
                    </div>
                  </div>
                  <div><Label className="text-xs font-semibold">Custom Branding</Label>
                    <div className="flex gap-2 mt-1"><Chip label="Available" active={form.customBranding} onClick={() => set("customBranding", !form.customBranding)} /><Chip label="Not Available" active={!form.customBranding} onClick={() => set("customBranding", false)} /></div>
                  </div>
                </>}

                {/* Chocolate fields */}
                {showChocolateFields && <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs font-semibold">Chocolate Type</Label><Input value={form.chocolateType} onChange={e => set("chocolateType", e.target.value)} placeholder="e.g. Dark, Milk, White" className="h-10 mt-1" /></div>
                    <div><Label className="text-xs font-semibold">Pieces Per Box</Label><Input type="number" value={form.pieces} onChange={e => set("pieces", e.target.value)} placeholder="16" className="h-10 mt-1" /></div>
                    <div><Label className="text-xs font-semibold">Net Weight (g)</Label><Input type="number" value={form.netWeight} onChange={e => set("netWeight", e.target.value)} placeholder="250" className="h-10 mt-1" /></div>
                    <div><Label className="text-xs font-semibold">Cocoa %</Label><Input type="number" value={form.cocoaPercentage} onChange={e => set("cocoaPercentage", e.target.value)} placeholder="70" className="h-10 mt-1" /></div>
                  </div>
                  <div><Label className="text-xs font-semibold">Gift Box</Label>
                    <div className="flex gap-2 mt-1"><Chip label="Yes" active={form.giftBox} onClick={() => set("giftBox", !form.giftBox)} /><Chip label="No" active={!form.giftBox} onClick={() => set("giftBox", false)} /></div>
                  </div>
                  <div><Label className="text-xs font-semibold">Personalised Message</Label><Input value={form.personalisedMessage} onChange={e => set("personalisedMessage", e.target.value)} placeholder="e.g. Happy Birthday!" className="h-10 mt-1" /></div>
                  <div><Label className="text-xs font-semibold">Ribbon Colour</Label><Input value={form.ribbonColour} onChange={e => set("ribbonColour", e.target.value)} placeholder="e.g. Red" className="h-10 mt-1" /></div>
                </>}

                {/* Bread/Bakery fields */}
                {showBreadFields && !showCakeFields && <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs font-semibold">Weight (g)</Label><Input type="number" value={form.weight} onChange={e => set("weight", e.target.value)} placeholder="500" className="h-10 mt-1" /></div>
                    <div><Label className="text-xs font-semibold">Pack Size</Label><Input value={form.boxSize} onChange={e => set("boxSize", e.target.value)} placeholder="e.g. Pack of 4" className="h-10 mt-1" /></div>
                    <div><Label className="text-xs font-semibold">Pieces</Label><Input type="number" value={form.pieces} onChange={e => set("pieces", e.target.value)} placeholder="4" className="h-10 mt-1" /></div>
                    <div><Label className="text-xs font-semibold">Shelf Life</Label>
                      <Select value={form.shelfLife} onValueChange={v => set("shelfLife", v)}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Same day">Same day</SelectItem><SelectItem value="1-2 days">1-2 days</SelectItem><SelectItem value="3-5 days">3-5 days</SelectItem><SelectItem value="Up to 1 week">Up to 1 week</SelectItem></SelectContent></Select>
                    </div>
                  </div>
                  <div><Label className="text-xs font-semibold">Storage Method</Label>
                    <Select value={form.storageMethod} onValueChange={v => set("storageMethod", v)}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Room temperature">Room temperature</SelectItem><SelectItem value="Refrigerate">Refrigerate</SelectItem><SelectItem value="Freeze">Freeze</SelectItem><SelectItem value="Cool dry place">Cool dry place</SelectItem></SelectContent></Select>
                  </div>
                </>}

                {/* Party Supply fields */}
                {showPartySupplyFields && <>
                  <div><Label className="text-xs font-semibold">Theme</Label>
                    <div className="flex flex-wrap gap-1.5 mt-1">{themeOptions.map(t => <Chip key={t} label={t} active={form.theme.includes(t)} onClick={() => toggleArray("theme", t)} />)}</div>
                  </div>
                  <div><Label className="text-xs font-semibold">Material</Label>
                    <div className="flex flex-wrap gap-1.5 mt-1">{["Paper", "Plastic", "Foil", "Latex", "Wood", "Eco-Friendly"].map(m => <Chip key={m} label={m} active={form.material.includes(m)} onClick={() => toggleArray("material", m)} />)}</div>
                  </div>
                  <div><Label className="text-xs font-semibold">Personalization Available</Label>
                    <div className="flex flex-wrap gap-1.5 mt-1">{["Custom Name", "Photo Printing", "Logo Printing"].map(p => <Chip key={p} label={p} active={form.personalization.includes(p)} onClick={() => toggleArray("personalization", p)} />)}</div>
                  </div>
                </>}

                {/* Occasion (all food + party) */}
                {(isFoodCategory || isPartySupplies) && (
                  <div><Label className="text-xs font-semibold">Occasion</Label>
                    <div className="flex flex-wrap gap-1.5 mt-1">{occasionOptions.map(o => <Chip key={o} label={o} active={form.occasion.includes(o)} onClick={() => toggleArray("occasion", o)} />)}</div>
                  </div>
                )}
              </Section>
            )}

            {/* ── Section 3: Dietary & Allergens (food only) ───── */}
            {isFoodCategory && !isPartySupplies && (
              <Section title="Dietary & Allergens" icon={Check} defaultOpen={false}>
                <div><Label className="text-xs font-semibold">Dietary Tags</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">{dietaryOptions.map(d => <Chip key={d} label={d} active={form.dietaryTags.includes(d)} onClick={() => toggleArray("dietaryTags", d)} />)}</div>
                </div>
                <div><Label className="text-xs font-semibold">Allergens</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">{allergenOptions.map(a => <Chip key={a} label={a} active={form.allergens.includes(a)} onClick={() => toggleArray("allergens", a)} />)}</div>
                </div>
              </Section>
            )}

            {/* ── Section 4: Nutrition (food only) ─────────────── */}
            {showNutrition && (
              <Section title="Nutrition Information" icon={Sparkles} defaultOpen={false}>
                <div><Label className="text-xs font-semibold">Per</Label>
                  <Select value={form.nutritionPer} onValueChange={v => set("nutritionPer", v)}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="100g">Per 100g</SelectItem><SelectItem value="serving">Per Serving</SelectItem><SelectItem value="product">Per Entire Product</SelectItem></SelectContent></Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs font-semibold">Calories</Label><Input type="number" value={form.calories} onChange={e => set("calories", e.target.value)} placeholder="0" className="h-10 mt-1" /></div>
                  <div><Label className="text-xs font-semibold">Protein (g)</Label><Input type="number" value={form.protein} onChange={e => set("protein", e.target.value)} placeholder="0" className="h-10 mt-1" /></div>
                  <div><Label className="text-xs font-semibold">Carbs (g)</Label><Input type="number" value={form.carbs} onChange={e => set("carbs", e.target.value)} placeholder="0" className="h-10 mt-1" /></div>
                  <div><Label className="text-xs font-semibold">Fat (g)</Label><Input type="number" value={form.fat} onChange={e => set("fat", e.target.value)} placeholder="0" className="h-10 mt-1" /></div>
                </div>
              </Section>
            )}

            {/* ── Section 5: Preparation & Delivery ─────────────── */}
            <Section title="Preparation & Delivery" icon={Package} defaultOpen={false}>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs font-semibold">Lead Time (days)</Label><Input type="number" value={form.leadTime} onChange={e => set("leadTime", e.target.value)} placeholder="3" className="h-10 mt-1" /></div>
                <div><Label className="text-xs font-semibold">Min Order</Label><Input type="number" value={form.minOrder} onChange={e => set("minOrder", e.target.value)} placeholder="1" className="h-10 mt-1" /></div>
              </div>
              <div><Label className="text-xs font-semibold">Delivery Options</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Chip label="Delivery Available" active={form.deliveryAvailable} onClick={() => set("deliveryAvailable", !form.deliveryAvailable)} />
                  <Chip label="Pickup Available" active={form.pickupAvailable} onClick={() => set("pickupAvailable", !form.pickupAvailable)} />
                  <Chip label="Nationwide Shipping" active={form.nationwideShipping} onClick={() => set("nationwideShipping", !form.nationwideShipping)} />
                </div>
              </div>
            </Section>

            {/* ── Save button ───────────────────────────────────── */}
            <div className="sticky bottom-0 flex gap-2 border-t border-border bg-card p-3">
              <Button onClick={save} disabled={saving} className="flex-1 bg-brand text-brand-foreground hover:bg-brand/90">
                {saving ? <><Loader2 className="size-4 animate-spin" /> Saving...</> : <><Check className="size-4" /> {editingProduct ? "Update Product" : "Create Product"}</>}
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
