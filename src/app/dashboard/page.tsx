"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useClaimAuth } from "@/hooks/use-claim-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Store, Package, Plus, Trash2, Star, ArrowRight } from "lucide-react";
import { CATEGORIES, CURRENCY_SYMBOLS } from "@/lib/constants";
import { getCategoryFields } from "@/lib/category-fields";

interface VendorData {
  id: string;
  name: string;
  slug: string;
  ecosystem: string;
  category: string;
  tagline: string;
  description: string;
  city: string;
  state: string | null;
  country: string;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  heroImage: string;
  avatarImage: string;
  rating: number;
  reviewCount: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  productType: string | null;
  image: string | null;
}

export default function VendorDashboardPage() {
  const router = useRouter();
  const { user, profile, role, loading: authLoading } = useClaimAuth();
  const [vendor, setVendor] = React.useState<VendorData | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [showProductForm, setShowProductForm] = React.useState(false);

  // Form state
  const [form, setForm] = React.useState<Record<string, string>>({});
  const [productForm, setProductForm] = React.useState({
    name: "",
    price: "",
    description: "",
    productType: "",
    image: "",
  });

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?returnTo=/dashboard");
      return;
    }
    loadVendor();
  }, [user, authLoading, router]);

  const loadVendor = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabaseBrowser
        .from("Vendor")
        .select("*")
        .eq("owner_user_id", user.id)
        .eq("ownership_status", "claimed")
        .order("createdAt", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const v = data[0];
        setVendor(v);
        setForm({
          name: v.name || "",
          tagline: v.tagline || "",
          description: v.description || "",
          city: v.city || "",
          state: v.state || "",
          country: v.country || "",
          whatsapp: v.whatsapp || "",
          instagram: v.instagram || "",
          website: v.website || "",
          heroImage: v.heroImage || "",
          avatarImage: v.avatarImage || "",
        });

        // Load products via API (bypasses RLS)
        const prodsRes = await fetch(`/api/vendor/products?vendorId=${v.id}`);
        if (prodsRes.ok) {
          const prodsData = await prodsRes.json();
          setProducts(prodsData.products || []);
        }
      }
    } catch (err) {
      console.error("Failed to load vendor:", err);
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    if (!vendor) return;
    setSaving(true);
    try {
      const patch: Record<string, string> = {};
      ["name", "tagline", "description", "city", "state", "country", "whatsapp", "instagram", "website", "heroImage", "avatarImage"].forEach((k) => {
        if (form[k] !== undefined) patch[k] = String(form[k]);
      });

      const { error } = await supabaseBrowser.rpc("update_vendor_profile", {
        p_vendor_id: vendor.id,
        p_patch: patch,
      });

      if (error) throw error;
      toast.success("Business details saved!");
      setVendor({ ...vendor, ...patch });
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
    setSaving(false);
  };

  const addProduct = async () => {
    if (!vendor || !productForm.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/vendor/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: vendor.id,
          name: productForm.name.trim(),
          price: Number(productForm.price) || 0,
          description: productForm.description.trim() || null,
          productType: productForm.productType || null,
          image: productForm.image.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to add product");
        setSaving(false);
        return;
      }

      setProducts([data.product, ...products]);
      setProductForm({ name: "", price: "", description: "", productType: "", image: "" });
      setShowProductForm(false);
      toast.success("Product added!");
    } catch (err: any) {
      toast.error(err.message || "Failed to add product");
    }
    setSaving(false);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      const res = await fetch(`/api/vendor/products?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setProducts(products.filter((p) => p.id !== id));
      toast.success("Product deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  if (authLoading || loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );

  if (!vendor)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <Store className="size-12 text-muted-foreground/40" />
        <h1 className="text-2xl font-bold">No verified business yet</h1>
        <p className="max-w-md text-muted-foreground">
          Once an admin approves your claim, your business will appear here and
          you can start listing products.
        </p>
        <Button onClick={() => router.push("/claim-status")}>
          Check Claim Status
        </Button>
      </div>
    );

  const catConfig = getCategoryFields(vendor.category);
  const ecoColor = vendor.ecosystem === "FINDMYBITES" ? "#D85A30" : "#7F77DD";
  const symbol = "₹";

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      {/* Header */}
      <header className="border-b border-black/10 bg-white px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Vendor Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">
            Welcome, {profile?.full_name || user?.email?.split("@")[0]}!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Managing <span className="font-semibold text-foreground">{vendor.name}</span>
            <span className="ml-2 text-xs uppercase tracking-wide" style={{ color: ecoColor }}>
              · {vendor.ecosystem === "FINDMYBITES" ? "FindMyBites" : "PimpMyParty"}
            </span>
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          <div className="rounded-lg p-4" style={{ background: "#F1EFE8" }}>
            <Package className="size-5 text-muted-foreground" />
            <p className="mt-2 text-2xl font-bold">{products.length}</p>
            <p className="text-xs text-muted-foreground">Products</p>
          </div>
          <div className="rounded-lg p-4" style={{ background: "#F1EFE8" }}>
            <Star className="size-5 text-muted-foreground" />
            <p className="mt-2 text-2xl font-bold">{vendor.rating.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Rating</p>
          </div>
          <div className="rounded-lg p-4" style={{ background: "#F1EFE8" }}>
            <Store className="size-5 text-muted-foreground" />
            <p className="mt-2 text-2xl font-bold">{vendor.reviewCount}</p>
            <p className="text-xs text-muted-foreground">Reviews</p>
          </div>
        </div>

        {/* Business Details Form */}
        <section className="mb-8 rounded-xl border border-black/10 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold">Business Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Business Name</Label>
              <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Tagline</Label>
              <Input value={form.tagline || ""} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
            </div>
            <div>
              <Label>WhatsApp Number</Label>
              <Input value={form.whatsapp || ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+919999999999" />
            </div>
            <div>
              <Label>Website</Label>
              <Input value={form.website || ""} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Instagram</Label>
              <Input value={form.instagram || ""} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@handle" />
            </div>
            <div>
              <Label>City</Label>
              <Input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <Label>State</Label>
              <Input value={form.state || ""} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div>
              <Label>Country</Label>
              <Input value={form.country || ""} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Cover Image URL</Label>
              <Input value={form.heroImage || ""} onChange={(e) => setForm({ ...form, heroImage: e.target.value })} placeholder="https://..." />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea rows={4} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <Button
            onClick={saveProfile}
            disabled={saving}
            className="mt-4 text-white"
            style={{ background: ecoColor }}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Save Changes"}
          </Button>
        </section>

        {/* Products Section */}
        <section className="rounded-xl border border-black/10 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Products & Services</h2>
            <Button
              onClick={() => setShowProductForm(!showProductForm)}
              size="sm"
              className="gap-1.5 text-white"
              style={{ background: ecoColor }}
            >
              <Plus className="size-4" /> Add Product
            </Button>
          </div>

          {showProductForm && (
            <div className="mb-4 rounded-lg border border-black/10 bg-muted/20 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>Product Name</Label>
                  <Input
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Wedding Cake"
                  />
                </div>
                <div>
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Type / Subcategory</Label>
                  <select
                    value={productForm.productType}
                    onChange={(e) => setProductForm({ ...productForm, productType: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select type</option>
                    {catConfig.types.map((t) => (
                      <option key={t} value={t.toLowerCase()}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={2}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Describe this product..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Product Image URL</Label>
                  <Input
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                    placeholder="https://... (upload image first, then paste URL here)"
                  />
                  {productForm.image && (
                    <img src={productForm.image} alt="Preview" className="mt-2 size-20 rounded-lg object-cover" />
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={addProduct} disabled={saving} size="sm" className="text-white" style={{ background: ecoColor }}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : "Add"}
                </Button>
                <Button onClick={() => setShowProductForm(false)} variant="ghost" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {products.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No products yet. Click "Add Product" to create your first listing.
            </p>
          ) : (
            <div className="space-y-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border border-black/10 p-3"
                >
                  {/* Product image */}
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="size-12 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-muted">
                      <Package className="size-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    {p.description && (
                      <p className="truncate text-xs text-muted-foreground">{p.description}</p>
                    )}
                    {p.productType && (
                      <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] capitalize">
                        {p.productType}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold" style={{ color: ecoColor }}>
                      {symbol}{p.price.toLocaleString("en-US")}
                    </span>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* View listing */}
        <div className="mt-6 text-center">
          <Button
            onClick={() => vendor?.slug && router.push(`/vendor/${vendor.slug}`)}
            variant="outline"
            className="gap-1.5"
          >
            View Public Listing <ArrowRight className="size-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
