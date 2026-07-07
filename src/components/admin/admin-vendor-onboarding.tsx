"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Search, Loader2, Globe2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  orange: "bg-orange-100 text-orange-700",
  red: "bg-red-100 text-red-700",
};

const FILTERS = [
  { label: "All", value: "" },
  { label: "0–25%", value: "0-25" },
  { label: "25–50%", value: "25-50" },
  { label: "50–75%", value: "50-75" },
  { label: "75–99%", value: "75-99" },
  { label: "100%", value: "100-100" },
];

interface VendorRow {
  id: string;
  name: string;
  slug: string;
  ecosystem: string;
  country: string;
  countryCode: string;
  completion: number;
  status: string;
  statusColor: string;
  productCount: number;
  invite_type: string | null;
  createdAt: string;
}

export function AdminVendorOnboarding() {
  const [vendors, setVendors] = React.useState<VendorRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [summary, setSummary] = React.useState({ live: 0, almostReady: 0, halfway: 0, incomplete: 0 });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/vendor-onboarding${filter ? `?filter=${filter}` : ""}`);
      if (!res.ok) return;
      const data = await res.json();
      setVendors(data.vendors ?? []);
      setSummary(data.summary ?? { live: 0, almostReady: 0, halfway: 0, incomplete: 0 });
    } catch {
      // silent
    }
    setLoading(false);
  }, [filter]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return vendors;
    const q = search.toLowerCase();
    return vendors.filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.country?.toLowerCase().includes(q) ||
      v.ecosystem.toLowerCase().includes(q)
    );
  }, [vendors, search]);

  return (
    <div>
      <h2 className="mb-5 text-lg font-semibold">Vendor Onboarding</h2>

      {/* Summary cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Live (100%)", val: summary.live, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Almost Ready (75-99%)", val: summary.almostReady, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Halfway (50-74%)", val: summary.halfway, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Incomplete (<50%)", val: summary.incomplete, color: "text-red-600", bg: "bg-red-50" },
        ].map(s => (
          <div key={s.label} className={cn("rounded-lg p-3.5", s.bg)}>
            <p className={cn("text-2xl font-bold", s.color)}>{s.val}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.value
                  ? "border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/30"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-8 text-center text-muted-foreground">
          <Loader2 className="mx-auto size-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center">
          <p className="text-sm font-medium">No vendors found</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 px-2 font-medium text-xs uppercase text-muted-foreground">Business Name</th>
                <th className="py-2 px-2 font-medium text-xs uppercase text-muted-foreground">Platform</th>
                <th className="py-2 px-2 font-medium text-xs uppercase text-muted-foreground">Country</th>
                <th className="py-2 px-2 font-medium text-xs uppercase text-muted-foreground">Profile %</th>
                <th className="py-2 px-2 font-medium text-xs uppercase text-muted-foreground">Products</th>
                <th className="py-2 px-2 font-medium text-xs uppercase text-muted-foreground">Status</th>
                <th className="py-2 px-2 font-medium text-xs uppercase text-muted-foreground">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <motion.tr
                  key={v.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border/50 hover:bg-muted/30"
                >
                  <td className="py-3 px-2">
                    <a href={`/vendor/${v.slug}`} className="font-medium text-foreground hover:underline">
                      {v.name}
                    </a>
                  </td>
                  <td className="py-3 px-2 text-xs">
                    {v.ecosystem === "FINDMYBITES" ? "FindMyBites" : "PimpMyParty"}
                  </td>
                  <td className="py-3 px-2 text-xs text-muted-foreground">
                    {v.country} ({v.countryCode})
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            v.completion >= 100 ? "bg-emerald-500" :
                            v.completion >= 75 ? "bg-emerald-400" :
                            v.completion >= 50 ? "bg-amber-400" :
                            v.completion >= 25 ? "bg-orange-400" : "bg-red-400"
                          )}
                          style={{ width: `${v.completion}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{v.completion}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-xs">{v.productCount}</td>
                  <td className="py-3 px-2">
                    <Badge className={cn("rounded-full px-2 py-0.5 text-[10px] uppercase", STATUS_STYLES[v.statusColor] || "bg-gray-100 text-gray-700")}>
                      {v.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-xs text-muted-foreground">
                    {new Date(v.createdAt).toLocaleDateString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
