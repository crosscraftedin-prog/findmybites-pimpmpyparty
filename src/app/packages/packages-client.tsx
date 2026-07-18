"use client";

import * as React from "react";
import { Search, X, SlidersHorizontal, Loader2, GitCompare, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/marketplace/site-header";
import { SiteFooter } from "@/components/marketplace/site-footer";
import { PackageCard, type PackageCardProduct } from "@/components/marketplace/package-card";
import { PackageFilters, type PackageFilterState } from "@/components/marketplace/package-filters";
import { QuickView } from "@/components/marketplace/quick-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface PackagesClientProps {
  initialPackages: PackageCardProduct[];
}

export function PackagesClient({ initialPackages }: PackagesClientProps) {
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<PackageFilterState>({});
  const [compareList, setCompareList] = React.useState<PackageCardProduct[]>([]);
  const [showCompareTray, setShowCompareTray] = React.useState(false);
  const [quickViewProduct, setQuickViewProduct] = React.useState<PackageCardProduct | null>(null);

  // Filter packages based on search + filters
  const filteredPackages = React.useMemo(() => {
    let result = initialPackages;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.vendor?.name?.toLowerCase().includes(q) ||
        p.vendor?.city?.toLowerCase().includes(q) ||
        p.productInfo?.cuisine?.some((c: string) => c.toLowerCase().includes(q)) ||
        p.productInfo?.occasionTags?.some((o: string) => o.toLowerCase().includes(q))
      );
    }

    // Budget filter
    if (filters.budget) {
      const [min, max] = filters.budget === "1000+" ? [1000, Infinity] : filters.budget.split("-").map(Number);
      result = result.filter(p => {
        const price = p.pricePerHead ?? p.price ?? 0;
        return price >= min && (max === Infinity || price <= max);
      });
    }

    // Guests filter
    if (filters.guests) {
      result = result.filter(p => !p.minGuests || p.minGuests <= filters.guests!);
    }

    // Occasion filter
    if (filters.occasion?.length) {
      result = result.filter(p =>
        p.productInfo?.occasionTags?.some((o: string) => filters.occasion!.includes(o))
      );
    }

    // Food type filter
    if (filters.foodType) {
      result = result.filter(p => {
        const ft = p.productInfo?.foodType || ((p.productInfo as any)?.dietaryBadges?.includes("Vegetarian") ? "Veg" : "Both");
        return ft === filters.foodType || ft === "Both";
      });
    }

    // Cuisine filter
    if (filters.cuisine?.length) {
      result = result.filter(p =>
        p.productInfo?.cuisine?.some((c: string) => filters.cuisine!.includes(c))
      );
    }

    // Services filter
    if (filters.services?.length) {
      result = result.filter(p => {
        const services = [
          ...(p.deliveryAvailable ? ["Delivery"] : []),
          ...(p.productInfo?.highlights || []),
          ...(p.productInfo?.includes || []),
        ].map(s => s.toLowerCase());
        return filters.services!.some(s => services.includes(s.toLowerCase()));
      });
    }

    // Rating filter
    if (filters.rating) {
      result = result.filter(p => (p.vendor?.rating ?? 0) >= filters.rating!);
    }

    return result;
  }, [initialPackages, search, filters]);

  const handleCompare = (product: PackageCardProduct) => {
    const exists = compareList.find(p => p.id === product.id);
    if (exists) {
      setCompareList(compareList.filter(p => p.id !== product.id));
    } else if (compareList.length < 4) {
      setCompareList([...compareList, product]);
    }
  };

  const isCompared = (id: string) => compareList.some(p => p.id === id);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero / Search Section */}
        <div className="border-b border-border bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Catering Packages
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse premium catering packages for weddings, birthdays, corporate events and more.
            </p>
            {/* Search bar */}
            <div className="mt-4 relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search packages... (e.g. 'Veg catering for 50 guests')"
                className="pl-10 pr-4 h-12 rounded-full border-border bg-background shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Filters */}
        <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <PackageFilters filters={filters} onChange={setFilters} />
          </div>
        </div>

        {/* Package Grid */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {filteredPackages.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg font-semibold text-muted-foreground">No packages found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters or search query.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => { setSearch(""); setFilters({}); }}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <>
              <motion.p
                key={filteredPackages.length}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-4 text-sm font-medium text-muted-foreground"
              >
                {filteredPackages.length} package{filteredPackages.length !== 1 ? "s" : ""} found
              </motion.p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPackages.map((pkg, idx) => (
                  <PackageCard
                    key={pkg.id}
                    product={pkg}
                    index={idx}
                    onCompare={handleCompare}
                    isCompared={isCompared(pkg.id)}
                    onQuickView={(p) => setQuickViewProduct(p)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Compare Tray */}
      <AnimatePresence>
        {compareList.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card p-4 shadow-lg"
          >
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <GitCompare className="size-5 text-brand" />
                <span className="text-sm font-semibold">
                  {compareList.length} package{compareList.length !== 1 ? "s" : ""} selected
                </span>
                <div className="hidden sm:flex items-center gap-2 ml-4">
                  {compareList.map(p => (
                    <div key={p.id} className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                      {p.name}
                      <button onClick={() => handleCompare(p)} className="text-muted-foreground hover:text-foreground">
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setCompareList([])}>
                  Clear
                </Button>
                <Button size="sm" className="gap-1.5" disabled={compareList.length < 2}>
                  <GitCompare className="size-4" /> Compare ({compareList.length})
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickView
          product={quickViewProduct}
          open={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onCompare={handleCompare}
          isCompared={isCompared(quickViewProduct.id)}
        />
      )}

      <SiteFooter />
    </div>
  );
}
