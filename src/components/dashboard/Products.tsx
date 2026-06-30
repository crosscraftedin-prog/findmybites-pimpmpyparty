"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  X,
  Check,
  Loader2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useProducts, useCreateProduct, useDeleteProduct } from "@/lib/queries";
import { getCategoryMigrated, CURRENCY_SYMBOLS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Vendor, Product } from "@/lib/types";
import type { TemplateDef } from "@/lib/template-definitions";
import { TemplateForm } from "./TemplateForm";

interface ProductsProps {
  vendor: Vendor;
}

// ── Standard field keys that map to dedicated Product columns ──
// Everything else goes into the extraFields JSON column.
const STANDARD_FIELDS = new Set([
  "name",
  "description",
  "packageType",
  "price",
  "comparePrice",
  "currency",
  "capacity",
  "duration",
  "includes",
  "dietaryTags",
  "addOns",
  "leadTime",
  "allergens",
  "customAllergen",
  "cuisineType",
  "customisationAvailable",
  "customisationNotes",
  "shelfLife",
  "storageMethod",
  "storageInstructions",
  "recipePublic",
  "recipeText",
  "recipePdf",
  "offerType",
  "offerLabel",
  "offerExpiresAt",
  "freeItemDescription",
  "bundleDescription",
  "bundleDiscount",
  "isFlashDeal",
  "flashDealEndsAt",
  "minOrderForOffer",
  "exclusiveMemberOffer",
  "isAvailable",
  "isFeatured",
  "images",
  "productType",
]);

// Fields that should be stored as JSON arrays
const ARRAY_FIELDS = new Set([
  "dietaryTags",
  "allergens",
  "includes",
  "addOns",
  "occasion",
  "theme",
  "snackContents",
  "material",
  "personalization",
  "courses",
  "staffIncluded",
  "equipmentIncluded",
  "amenities",
  "languageSkills",
  "balloonColours",
  "colour",
  "cuisineType",
  "flavour",
  "decorTheme",
  "genre",
  "vehicleType",
  "rentalCategory",
  "giftCategory",
  "floralType",
  "flowerType",
  "printCategory",
  "printSize",
  "printTechnique",
  "serviceType",
  "productsUsed",
  "staffRole",
]);

// Fields that are boolean
const BOOLEAN_FIELDS = new Set([
  "deliveryAvailable",
  "pickupAvailable",
  "nationwideShipping",
  "customDesign",
  "photoCake",
  "themeCake",
  "nameOnCake",
  "giftBox",
  "customBranding",
  "recipePublic",
  "isAvailable",
  "isFeatured",
  "sameDay",
  "customOrder",
  "inStock",
  "printRelease",
  "onlineGallery",
  "customPlaylist",
  "songRequests",
  "trialAvailable",
  "homeService",
  "groupBooking",
  "uniformProvided",
  "trained",
  "freshnessGuarantee",
  "cleanupIncluded",
  "setupIncluded",
  "setupAvailable",
  "tastingAvailable",
  "designService",
  "sampleAvailable",
  "bulkDiscount",
  "depositRequired",
  "chauffeurIncluded",
  "decorIncluded",
  "driverBata",
  "fuelIncluded",
  "giftWrapping",
]);

export function Products({ vendor }: ProductsProps) {
  const router = useRouter();
  const { data: productsData, isLoading } = useProducts(vendor.id);
  const products = productsData?.products ?? [];
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();
  const [showModal, setShowModal] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [saving, setSaving] = React.useState(false);

  const cat = getCategoryMigrated(vendor.category);
  const symbol = CURRENCY_SYMBOLS[vendor.currency] ?? vendor.currency ?? "$";

  // ── Fetch resolved template for this vendor's category + subcategory ──
  const [template, setTemplate] = React.useState<TemplateDef | null>(null);
  const [filterOptions, setFilterOptions] = React.useState<Record<string, string[]>>({});
  const [templateLoading, setTemplateLoading] = React.useState(true);

  React.useEffect(() => {
    if (!vendor.category) {
      setTemplateLoading(false);
      return;
    }
    setTemplateLoading(true);
    const params = new URLSearchParams({ category: vendor.category });
    if (vendor.subcategory) params.set("subcategory", vendor.subcategory);
    fetch(`/api/templates/resolve?${params.toString()}&t=${Date.now()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.template) {
          setTemplate(data.template);
          setFilterOptions(data.filterOptions || {});
        }
        setTemplateLoading(false);
      })
      .catch(() => {
        setTemplateLoading(false);
      });
  }, [vendor.category, vendor.subcategory]);

  // ── Build the initial empty form based on the template ──
  const buildEmptyForm = React.useCallback((): Record<string, any> => {
    const form: Record<string, any> = {
      name: "",
      description: "",
      packageType: "standard",
      price: "",
      comparePrice: "",
      currency: vendor.currency || "USD",
      images: [],
      isAvailable: true,
      productType: "",
    };
    if (!template) return form;
    for (const field of template.fields) {
      if (field.key in form) continue; // don't override defaults
      if (BOOLEAN_FIELDS.has(field.key)) {
        form[field.key] = false;
      } else if (ARRAY_FIELDS.has(field.key) || field.type === "chips") {
        form[field.key] = [];
      } else if (field.type === "toggle" || field.type === "section_toggle") {
        form[field.key] = false;
      } else if (field.type === "toggle_group") {
        form[field.key] = "";
      } else if (field.type === "images") {
        form[field.key] = [];
      } else {
        form[field.key] = "";
      }
    }
    return form;
  }, [template, vendor.currency]);

  const [form, setForm] = React.useState<Record<string, any>>({});

  // Rebuild form when template changes
  React.useEffect(() => {
    setForm(buildEmptyForm());
  }, [buildEmptyForm]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const toggleArray = (key: string, value: string) => {
    const arr = Array.isArray(form[key]) ? form[key] : [];
    set(key, arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value]);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteProduct.mutateAsync({ id, vendorId: vendor.id });
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const openAdd = () => {
    setEditingProduct(null);
    setForm(buildEmptyForm());
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    const newForm = buildEmptyForm();
    // Load standard fields
    newForm.name = p.name || "";
    newForm.description = p.description || "";
    newForm.packageType = (p as any).packageType || "standard";
    newForm.price = String(p.price);
    newForm.comparePrice = (p as any).comparePrice ? String((p as any).comparePrice) : "";
    newForm.currency = (p as any).currency || vendor.currency || "USD";
    newForm.images = p.images || [];
    newForm.isAvailable = (p as any).isAvailable !== false;
    newForm.productType = (p as any).productType || p.productType || "";
    newForm.leadTime = (p as any).leadTime || "";
    newForm.capacity = (p as any).capacity ? String((p as any).capacity) : "";
    newForm.duration = (p as any).duration || "";

    // Load dietaryTags and allergens (JSON arrays)
    if ((p as any).dietaryTags) {
      try {
        newForm.dietaryTags = typeof (p as any).dietaryTags === "string"
          ? JSON.parse((p as any).dietaryTags)
          : (p as any).dietaryTags;
      } catch {}
    }
    if ((p as any).allergens) {
      try {
        newForm.allergens = typeof (p as any).allergens === "string"
          ? JSON.parse((p as any).allergens)
          : (p as any).allergens;
      } catch {}
    }

    // Load extra fields (JSON)
    if ((p as any).extraFields) {
      try {
        const extra = typeof (p as any).extraFields === "string"
          ? JSON.parse((p as any).extraFields)
          : (p as any).extraFields;
        Object.assign(newForm, extra);
      } catch {}
    }

    setForm(newForm);
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name?.trim() || !form.price) {
      toast.error("Name and price are required");
      return;
    }
    setSaving(true);
    try {
      // Build payload: standard fields + extraFields JSON
      const extraFieldsObj: Record<string, any> = {};
      for (const [key, value] of Object.entries(form)) {
        if (STANDARD_FIELDS.has(key)) continue;
        extraFieldsObj[key] = value;
      }

      const payload: any = {
        ...form,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
        capacity: form.capacity ? Number(form.capacity) : null,
        vendorId: vendor.id,
        // Array fields → JSON strings for dedicated columns
        dietaryTags: form.dietaryTags || [],
        allergens: form.allergens || [],
        // Template-specific fields → JSON
        extraFields: extraFieldsObj,
        // Template Engine v2: versioning
        templateSlug: template?.slug,
        templateVersion: template?.version ?? 1,
      };

      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Update failed");
        toast.success("Product updated!");
      } else {
        await createProduct.mutateAsync(payload as any);
        toast.success("Product created!");
      }
      setShowModal(false);
      setForm(buildEmptyForm());
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
    setSaving(false);
  };

  const isFood = vendor.ecosystem === "FINDMYBITES";

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Your Products & Packages
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add the services or dishes you offer so customers know exactly what to book
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-brand text-brand-foreground hover:bg-brand/90"
        >
          <Plus className="size-4" /> Add Product
        </Button>
      </div>

      {/* Products grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <Package className="mx-auto size-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-bold">No products yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first product to help customers understand what you offer
          </p>
          <Button
            onClick={openAdd}
            className="mt-4 bg-brand text-brand-foreground hover:bg-brand/90"
          >
            <Plus className="size-4" /> Add your first product
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {(p as any).isFeatured && (
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    )}
                    <h3 className="truncate font-bold">{p.name}</h3>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {p.description}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 border-0 capitalize">
                  {(p as any).packageType || "standard"}
                </Badge>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="font-bold text-brand">
                  {symbol}
                  {p.price.toLocaleString()}
                </span>
                {(p as any).capacity && (
                  <span className="text-muted-foreground">
                    Up to {(p as any).capacity} guests
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium",
                    (p as any).isAvailable !== false
                      ? "text-emerald-600"
                      : "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      (p as any).isAvailable !== false
                        ? "bg-emerald-500"
                        : "bg-muted-foreground/40"
                    )}
                  />
                  {(p as any).isAvailable !== false ? "Available" : "Unavailable"}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(p)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(p.id, p.name)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Smart Dynamic Product Form Modal (Template Engine powered) */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-2xl">
          <DialogTitle className="px-5 pt-5 text-lg font-bold">
            {editingProduct ? "Edit Product" : "Add Product"}
          </DialogTitle>
          <DialogDescription className="px-5 text-sm text-muted-foreground">
            {template
              ? `Using ${template.name} — fill in the details below`
              : isFood
                ? "Fill in the details — the form adapts to what you're selling"
                : "Add your product details"}
          </DialogDescription>
          <div className="space-y-3 p-5 pt-3">
            {templateLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : template ? (
              <TemplateForm
                template={template}
                filterOptions={filterOptions}
                form={form}
                set={set}
                toggleArray={toggleArray}
                currencySymbol={symbol}
              />
            ) : (
              // Fallback: basic form when no template is found
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold">Product name *</Label>
                  <Input
                    value={form.name || ""}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Custom Wedding Cake"
                    className="mt-1 h-10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Price * ({symbol})</Label>
                    <Input
                      type="number"
                      value={form.price || ""}
                      onChange={(e) => set("price", e.target.value)}
                      placeholder="0"
                      className="mt-1 h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Package type</Label>
                    <Input
                      value={form.packageType || "standard"}
                      onChange={(e) => set("packageType", e.target.value)}
                      className="mt-1 h-10"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Description</Label>
                  <textarea
                    value={form.description || ""}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Describe what's included..."
                    rows={2}
                    maxLength={300}
                    className="mt-1 w-full resize-none rounded-lg border border-black/15 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            {/* ── Save button ───────────────────────────────────── */}
            <div className="sticky bottom-0 flex gap-2 border-t border-border bg-card p-3">
              <Button
                onClick={save}
                disabled={saving}
                className="flex-1 bg-brand text-brand-foreground hover:bg-brand/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="size-4" />{" "}
                    {editingProduct ? "Update Product" : "Create Product"}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
