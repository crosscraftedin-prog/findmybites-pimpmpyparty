"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Search,
  Star,
  BadgeCheck,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminVendors,
  useDeleteVendor,
  useToggleVendorFlag,
} from "@/lib/queries";
import { useMarketplace } from "@/lib/store";
import { countryCodeToFlag, timeAgo } from "@/lib/format";
import { getCategory } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function AdminVendors() {
  const [search, setSearch] = React.useState("");
  const [ecosystem, setEcosystem] = React.useState<string>("all");
  const [featured, setFeatured] = React.useState<string>("all");
  const [approval, setApproval] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);

  const { data, isLoading, isFetching } = useAdminVendors({
    search: search || undefined,
    ecosystem: ecosystem === "all" ? undefined : ecosystem,
    featured: featured === "all" ? undefined : (featured as "true" | "false"),
    approved: approval === "all" ? undefined : (approval as "true" | "false"),
    page,
    pageSize: 15,
  });

  const deleteVendor = useDeleteVendor();
  const toggleFlag = useToggleVendorFlag();
  const openVendor = useMarketplace((s) => s.openVendor);

  const vendors = data?.vendors ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // debounce search
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const onDelete = (slug: string, name: string) => {
    if (!confirm(`Delete "${name}"? This removes the vendor, its reviews and bookings. This cannot be undone.`))
      return;
    deleteVendor.mutate(slug, {
      onSuccess: () => toast.success(`"${name}" deleted.`),
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors by name, city, country, tags…"
            className="h-10 rounded-full pl-10"
          />
        </div>
        <Select value={ecosystem} onValueChange={(v) => { setEcosystem(v); setPage(1); }}>
          <SelectTrigger className="h-10 w-[160px] rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ecosystems</SelectItem>
            <SelectItem value="FINDMYBITES">FindMyBites</SelectItem>
            <SelectItem value="PIMPMYPARTY">PimpMyParty</SelectItem>
          </SelectContent>
        </Select>
        <Select value={featured} onValueChange={(v) => { setFeatured(v); setPage(1); }}>
          <SelectTrigger className="h-10 w-[150px] rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All vendors</SelectItem>
            <SelectItem value="true">Featured only</SelectItem>
            <SelectItem value="false">Not featured</SelectItem>
          </SelectContent>
        </Select>
        <Select value={approval} onValueChange={(v) => { setApproval(v); setPage(1); }}>
          <SelectTrigger className="h-10 w-[160px] rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="false">⏳ Pending approval</SelectItem>
            <SelectItem value="true">✅ Approved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        {isFetching && !isLoading ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="size-3.5 animate-spin" /> Updating…
          </span>
        ) : (
          <>
            <span className="font-semibold text-foreground">{total}</span>{" "}
            {total === 1 ? "vendor" : "vendors"}
            {debouncedSearch && ` matching "${debouncedSearch}"`}
          </>
        )}
      </p>

      {/* Table (desktop) */}
      <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Vendor</th>
              <th className="px-4 py-3 text-left font-semibold">Location</th>
              <th className="px-4 py-3 text-left font-semibold">Rating</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Listed</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-4">
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))
            ) : vendors.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No vendors found.
                </td>
              </tr>
            ) : (
              vendors.map((v) => {
                const cat = getCategory(v.category);
                return (
                  <tr key={v.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-9 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {v.heroImage && (
                            <img
                              src={v.heroImage}
                              alt={v.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{v.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {cat?.label ?? v.category}
                            {v.subcategory ? ` · ${v.subcategory}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {countryCodeToFlag(v.countryCode)} {v.city}, {v.country}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-medium tabular-nums">
                          {v.rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({v.reviewCount})
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {v.approved ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                          ✅ Approved
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                          ⏳ Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {timeAgo(v.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {!v.approved && (
                          <button
                            title="Approve listing"
                            onClick={() =>
                              toggleFlag.mutate({ slug: v.slug, approved: true })
                            }
                            disabled={toggleFlag.isPending}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                          >
                            ✓ Approve
                          </button>
                        )}
                        {v.approved && (
                          <button
                            title="Unapprove (hide from public)"
                            onClick={() =>
                              toggleFlag.mutate({ slug: v.slug, approved: false })
                            }
                            disabled={toggleFlag.isPending}
                            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-amber-100 hover:text-amber-600 disabled:opacity-50"
                          >
                            <EyeOff className="size-4" />
                          </button>
                        )}
                        <IconBtn
                          title={v.featured ? "Unfeature" : "Feature"}
                          active={v.featured}
                          loading={toggleFlag.isPending}
                          onClick={() =>
                            toggleFlag.mutate({ slug: v.slug, featured: !v.featured })
                          }
                        >
                          <Star className={cn("size-4", v.featured && "fill-current")} />
                        </IconBtn>
                        <IconBtn
                          title={v.verified ? "Unverify" : "Verify"}
                          active={v.verified}
                          loading={toggleFlag.isPending}
                          onClick={() =>
                            toggleFlag.mutate({ slug: v.slug, verified: !v.verified })
                          }
                        >
                          <BadgeCheck className="size-4" />
                        </IconBtn>
                        <IconBtn
                          title="View listing"
                          onClick={() => openVendor(v.slug)}
                        >
                          <Eye className="size-4" />
                        </IconBtn>
                        <IconBtn
                          title="Delete vendor"
                          danger
                          loading={deleteVendor.isPending}
                          onClick={() => onDelete(v.slug, v.name)}
                        >
                          <Trash2 className="size-4" />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Card list (mobile) */}
      <div className="space-y-3 md:hidden">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))
          : vendors.map((v) => {
              const cat = getCategory(v.category);
              return (
                <div
                  key={v.id}
                  className="rounded-2xl border border-border bg-card p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {v.heroImage && (
                        <img src={v.heroImage} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{v.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {cat?.label} · {countryCodeToFlag(v.countryCode)} {v.city}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Star className="size-3 fill-amber-400 text-amber-400" />
                          {v.rating.toFixed(1)} ({v.reviewCount})
                        </span>
                        {v.featured && (
                          <Badge className="border-0 bg-brand-soft text-xs text-brand-soft-foreground">
                            Featured
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 flex-1"
                      onClick={() =>
                        toggleFlag.mutate({ slug: v.slug, featured: !v.featured })
                      }
                    >
                      <Star className={cn("size-3.5", v.featured && "fill-current")} />
                      {v.featured ? "Unfeature" : "Feature"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 flex-1"
                      onClick={() =>
                        toggleFlag.mutate({ slug: v.slug, verified: !v.verified })
                      }
                    >
                      <BadgeCheck className="size-3.5" />
                      {v.verified ? "Unverify" : "Verify"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(v.slug, v.name)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" />
            Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function IconBtn({
  title,
  children,
  onClick,
  active,
  danger,
  loading,
}: {
  title: string;
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={loading}
      className={cn(
        "grid size-8 place-items-center rounded-lg border transition-colors disabled:opacity-50",
        danger
          ? "border-transparent text-destructive hover:bg-destructive/10"
          : active
            ? "border-brand bg-brand-soft text-brand"
            : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : children}
    </button>
  );
}
