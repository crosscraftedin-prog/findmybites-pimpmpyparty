"use client";

import * as React from "react";
import { Crown, Check, Lock, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Vendor } from "@/lib/types";

const PLAN_FEATURES: Record<string, { label: string; features: string[]; visibility: string; color: string }[]> = {
  pro: [
    {
      label: "Baker Pro / Party Pro",
      features: ["Up to 25 products", "AI Growth Advisor", "SEO Center", "Social Media Generator", "Email Campaigns", "QR Codes", "Review Booster"],
      visibility: "+40% profile visibility",
      color: "from-blue-500 to-violet-500",
    },
  ],
  business: [
    {
      label: "Business",
      features: ["Unlimited products", "Everything in Pro", "Competitor Insights", "Advanced Analytics", "Marketing Automation", "Priority Support", "Custom Domain"],
      visibility: "+120% profile visibility",
      color: "from-amber-500 to-orange-500",
    },
  ],
};

export function SubscriptionUpsell({ vendor }: { vendor: Vendor }) {
  const [tier, setTier] = React.useState<string>("free");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/subscriptions/current")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setTier(d?.planTier || "free"))
      .catch(() => setTier("free"))
      .finally(() => setLoading(false));
  }, []);

  const upgrade = (plan: string) => {
    toast.success(`Redirecting to ${plan} upgrade…`);
    // In production this would route to /billing?upgrade=plan
    setTimeout(() => { window.location.hash = "billing"; }, 800);
  };

  return (
    <div className="space-y-4">
      {/* Current plan */}
      <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Current Plan</span>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold capitalize">{tier === "free" ? "Free" : tier === "pro" ? "Pro" : "Business"}</h3>
              {tier !== "free" && <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>}
            </div>
          </div>
          <Crown className={cn("h-8 w-8", tier === "business" ? "text-amber-500" : tier === "pro" ? "text-blue-500" : "text-muted-foreground")} />
        </div>
        {tier === "free" && (
          <p className="mt-2 text-xs text-muted-foreground">Upgrade to unlock AI marketing tools, advanced analytics, and more visibility.</p>
        )}
      </div>

      {/* Plans */}
      {loading ? <div className="flex h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {(["pro", "business"] as const).filter((p) => tier !== p && !(tier === "business" && p === "pro")).map((plan) => {
            const p = PLAN_FEATURES[plan][0];
            return (
              <div key={plan} className={cn("relative overflow-hidden rounded-xl border bg-card p-4", tier === plan && "ring-2 ring-primary")}>
                <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", p.color)} />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold">{p.label}</h4>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400">{p.visibility}</span>
                  </div>
                  {tier === plan ? <Badge className="bg-emerald-100 text-emerald-700">Current</Badge> : <Lock className="h-4 w-4 text-muted-foreground" />}
                </div>
                <ul className="mt-3 space-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />{f}
                    </li>
                  ))}
                </ul>
                {tier !== plan && (
                  <Button className="mt-3 w-full" onClick={() => upgrade(plan)}>
                    <Crown className="mr-1.5 h-4 w-4" /> Upgrade to {p.label.split(" ")[0]}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Estimated impact */}
      <div className="rounded-xl border bg-card p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold"><TrendingUp className="h-4 w-4" /> Estimated Impact</h4>
        <p className="mt-1 text-xs text-muted-foreground">Based on similar vendors who upgraded.</p>
        <div className="mt-3 space-y-2">
          <div>
            <div className="flex justify-between text-xs"><span>Profile Visibility</span><span className="font-medium">{tier === "business" ? "100%" : tier === "pro" ? "70%" : "30%"}</span></div>
            <Progress value={tier === "business" ? 100 : tier === "pro" ? 70 : 30} className="mt-1 h-2" />
          </div>
          <div>
            <div className="flex justify-between text-xs"><span>Enquiry Potential</span><span className="font-medium">{tier === "business" ? "3.2×" : tier === "pro" ? "1.8×" : "1×"} baseline</span></div>
            <Progress value={tier === "business" ? 100 : tier === "pro" ? 56 : 31} className="mt-1 h-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
