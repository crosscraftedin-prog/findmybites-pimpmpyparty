"use client";

import * as React from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useClaimAuth } from "@/hooks/use-claim-auth";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Loader2 } from "lucide-react";

const CLAIM_STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

export default function ClaimStatusPage() {
  const { user, loading: authLoading } = useClaimAuth();
  const [claims, setClaims] = React.useState<any[]>([]);
  const [vendorMap, setVendorMap] = React.useState<Record<string, any>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      if (!user) return;
      const { data: cs } = await supabaseBrowser
        .from("vendor_claims")
        .select("*")
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false });
      setClaims(cs || []);

      const ids = [...new Set((cs || []).map((c) => c.vendor_id))];
      if (ids.length) {
        const { data: vs } = await supabaseBrowser
          .from("Vendor")
          .select("id,name,slug,ecosystem,category")
          .in("id", ids);
        const map: Record<string, any> = {};
        (vs || []).forEach((v) => {
          map[v.id] = v;
        });
        setVendorMap(map);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const statusColor = (s: string) =>
    s === "approved"
      ? "bg-[#8B9D83]/15 text-[#5d6e57] border-[#8B9D83]/30"
      : s === "rejected"
        ? "bg-[#B04646]/10 text-[#8e3a3a] border-[#B04646]/30"
        : "bg-[#D9A05B]/15 text-[#8a6630] border-[#D9A05B]/30";

  if (authLoading || loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" /> Loading…
      </div>
    );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F9F8F6] py-16">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Your activity
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tighter">My claims</h1>

        <div className="mt-10 space-y-4">
          {claims.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center">
              <h3 className="text-xl font-bold">No claims yet</h3>
              <p className="mb-4 mt-2 text-muted-foreground">
                Find your business and submit a claim to get verified.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 font-medium text-[#C65D47]"
              >
                Browse vendors <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            claims.map((c) => {
              const v = vendorMap[c.vendor_id];
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-6"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {v?.category || "—"}
                    </p>
                    {v ? (
                      <Link
                        href={`/vendor/${v.slug}`}
                        className="block truncate text-lg font-bold hover:text-[#C65D47]"
                      >
                        {v.name}
                      </Link>
                    ) : (
                      <p className="text-lg font-bold">Vendor</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Submitted {new Date(c.submitted_at).toLocaleDateString()} via{" "}
                      {c.claim_method.replace("_", " ")}
                    </p>
                    {c.admin_notes && (
                      <p className="mt-2 text-sm italic text-muted-foreground">
                        "{c.admin_notes}"
                      </p>
                    )}
                  </div>
                  <Badge
                    className={`${statusColor(c.status)} rounded-full px-3 py-1 text-xs uppercase tracking-wide`}
                  >
                    {CLAIM_STATUS_LABEL[c.status]}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
