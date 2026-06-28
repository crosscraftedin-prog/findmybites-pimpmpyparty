"use client";

import * as React from "react";
import {
  Search,
  MapPin,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Globe2,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CORAL = "#D85A30";
const CORAL_TINT = "#FAECE7";
const CORAL_DARK = "#993C1D";

interface SEOPageRow {
  url: string;
  city: string;
  category: string;
  vendors: number;
  ecosystem: string;
}

interface SEOStats {
  totalKeywordPages: number;
  totalCityPages: number;
  totalNearMePages: number;
  totalCities: number;
  totalCountries: number;
  pages: SEOPageRow[];
}

/**
 * Admin "SEO Pages" section — shows stats and a table of all auto-generated
 * SEO pages. Lets admins revalidate all pages + jump to Google Search
 * Console.
 */
export function AdminSeoPages() {
  const [stats, setStats] = React.useState<SEOStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [revalidating, setRevalidating] = React.useState(false);
  const [revalidateMsg, setRevalidateMsg] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seo-pages");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // network error — keep last stats
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filteredPages = React.useMemo(() => {
    if (!stats) return [];
    const q = search.toLowerCase().trim();
    if (!q) return stats.pages.slice(0, 100);
    return stats.pages
      .filter(
        (p) =>
          p.url.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
      .slice(0, 100);
  }, [stats, search]);

  const handleRevalidate = async () => {
    setRevalidating(true);
    setRevalidateMsg(null);
    try {
      const res = await fetch("/api/admin/seo-pages", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setRevalidateMsg(
          `✅ Revalidated ${data.revalidated ?? "all"} SEO pages + sitemap.`
        );
        load();
      } else {
        setRevalidateMsg(`❌ ${data.error ?? "Revalidation failed"}`);
      }
    } catch (e) {
      setRevalidateMsg("❌ Network error during revalidation");
    } finally {
      setRevalidating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin" style={{ color: CORAL }} />
      </div>
    );
  }

  const totalAutoPages = stats
    ? stats.totalKeywordPages + stats.totalCityPages + stats.totalNearMePages
    : 0;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight">SEO Pages</h2>
          <p className="mt-1 text-[13px] text-black/50">
            Auto-generated from approved vendors. New cities &amp; categories
            appear automatically — no manual work.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRevalidate}
            disabled={revalidating}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
            style={{ background: CORAL }}
          >
            {revalidating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Revalidate All
          </button>
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-4 py-2 text-[13px] font-medium text-black/70 transition-colors hover:bg-black/[0.04]"
          >
            <ExternalLink className="size-4" />
            Google Search Console
          </a>
        </div>
      </div>

      {revalidateMsg && (
        <div
          className="mb-4 rounded-lg px-4 py-3 text-[13px] font-medium"
          style={{
            background: revalidateMsg.startsWith("✅") ? "#EAF3DE" : "#FDECEA",
            color: revalidateMsg.startsWith("✅") ? "#27500A" : "#8B1A1A",
          }}
        >
          {revalidateMsg}
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={FileText}
          label="Total SEO pages"
          value={totalAutoPages.toLocaleString()}
          color={CORAL}
          tint={CORAL_TINT}
        />
        <StatCard
          icon={Search}
          label="Keyword pages"
          value={(stats?.totalKeywordPages ?? 0).toLocaleString()}
          color={CORAL}
          tint={CORAL_TINT}
        />
        <StatCard
          icon={MapPin}
          label="City pages"
          value={(stats?.totalCityPages ?? 0).toLocaleString()}
          color={CORAL}
          tint={CORAL_TINT}
        />
        <StatCard
          icon={Globe2}
          label="Near-me pages"
          value={(stats?.totalNearMePages ?? 0).toLocaleString()}
          color={CORAL}
          tint={CORAL_TINT}
        />
        <StatCard
          icon={MapPin}
          label="Cities covered"
          value={(stats?.totalCities ?? 0).toLocaleString()}
          color={CORAL}
          tint={CORAL_TINT}
        />
        <StatCard
          icon={TrendingUp}
          label="Countries"
          value={(stats?.totalCountries ?? 0).toLocaleString()}
          color={CORAL}
          tint={CORAL_TINT}
        />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by URL, city, or category…"
          className="h-10 w-full rounded-lg border border-black/15 bg-white pl-10 pr-4 text-[13px] text-black placeholder:text-black/40 focus:outline-none focus:ring-2"
          style={{ ["--tw-ring-color" as any]: `${CORAL}44` }}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 bg-black/[0.02]">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-black/50">
                  Page URL
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-black/50">
                  City
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-black/50">
                  Category
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-black/50">
                  Vendors
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-black/50">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-black/40">
                    {stats && stats.pages.length === 0
                      ? "No SEO pages yet. Approve vendors to auto-generate pages."
                      : "No pages match your search."}
                  </td>
                </tr>
              ) : (
                filteredPages.map((p, i) => (
                  <tr
                    key={p.url}
                    className={cn(
                      "border-b border-black/5",
                      i % 2 === 1 && "bg-black/[0.015]"
                    )}
                  >
                    <td className="px-4 py-3">
                      <a
                        href={`https://www.findmybites.com${p.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-black/80 hover:underline"
                        style={{ color: CORAL_DARK }}
                      >
                        {p.url}
                        <ExternalLink className="size-3 opacity-50" />
                      </a>
                    </td>
                    <td className="px-4 py-3 text-black/60">{p.city}</td>
                    <td className="px-4 py-3 text-black/60">{p.category}</td>
                    <td className="px-4 py-3 font-medium text-black/70">
                      {p.vendors}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: "#EAF3DE", color: "#27500A" }}
                      >
                        ✅ Live
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {stats && stats.pages.length > 100 && (
        <p className="mt-3 text-[12px] text-black/40">
          Showing {filteredPages.length} of {stats.pages.length} pages. Use
          search to filter.
        </p>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  tint,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  color: string;
  tint: string;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4">
      <div
        className="grid size-9 place-items-center rounded-lg"
        style={{ background: tint }}
      >
        <Icon className="size-4" style={{ color }} />
      </div>
      <p className="mt-2 text-[20px] font-bold tracking-tight">{value}</p>
      <p className="text-[11px] text-black/50">{label}</p>
    </div>
  );
}
