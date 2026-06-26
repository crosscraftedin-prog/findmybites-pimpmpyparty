"use client";

import * as React from "react";
import { Check, Star, CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import type { Vendor } from "@/lib/types";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "Free",
    period: "Always",
    features: ["Basic listing", "5 photos", "Standard placement"],
    highlighted: false,
  },
  {
    id: "featured",
    name: "Featured",
    price: "$29",
    period: "/month",
    features: ["Priority in search", "Josh AI suggestions", "Verified badge"],
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    price: "$59",
    period: "/month",
    features: ["Top of results", "Homepage spotlight", "Account manager"],
    highlighted: false,
  },
];

export function PlanBilling({ vendor }: { vendor: Vendor }) {
  const [showUpgrade, setShowUpgrade] = React.useState(false);
  const currentPlan = vendor.featured ? "featured" : "free";

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight">Your Plan</h1>

      {/* Current plan card */}
      <div className="mb-6 rounded-xl border-2 border-brand bg-brand-soft p-5">
        <div className="flex items-start justify-between">
          <div>
            <Badge className="border-0 bg-brand text-brand-foreground">
              Current Plan
            </Badge>
            <h2 className="mt-2 text-2xl font-extrabold">
              {currentPlan === "free" ? "Free" : currentPlan === "featured" ? "Featured" : "Business"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {currentPlan === "free"
                ? "You're on the free plan. Upgrade for more visibility."
                : "Your plan is active."}
            </p>
          </div>
          <Button
            onClick={() => setShowUpgrade(true)}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            {currentPlan === "free" ? "Upgrade" : "Manage Billing"}
          </Button>
        </div>
      </div>

      {/* All plans */}
      <h2 className="mb-4 text-base font-bold">Available Plans</h2>
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-xl border-2 p-4",
                plan.highlighted ? "border-brand" : "border-border",
                isCurrent && "bg-brand-soft"
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-2 left-4 rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold text-brand-foreground">
                  POPULAR
                </span>
              )}
              <p className="text-sm font-bold">{plan.name}</p>
              <p className="mt-1 text-2xl font-extrabold">
                {plan.price}
                <span className="text-xs font-normal text-muted-foreground">
                  {" "}
                  {plan.period}
                </span>
              </p>
              <div className="mt-3 space-y-1.5">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-1.5 text-[11px]">
                    <Check className="size-3 text-brand" />
                    <span className="text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>
              {isCurrent ? (
                <div className="mt-4 rounded-md bg-black/5 py-2 text-center text-[11px] font-medium text-muted-foreground">
                  Current plan
                </div>
              ) : (
                <Button
                  size="sm"
                  variant={plan.highlighted ? "default" : "outline"}
                  className={cn(
                    "mt-4 w-full",
                    plan.highlighted && "bg-brand text-brand-foreground hover:bg-brand/90"
                  )}
                  onClick={() => setShowUpgrade(true)}
                >
                  {currentPlan === "free" ? "Upgrade" : "Switch"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Billing history */}
      <h2 className="mb-4 text-base font-bold">Billing History</h2>
      <div className="rounded-xl border border-border bg-card p-5">
        {currentPlan === "free" ? (
          <div className="py-6 text-center">
            <CreditCard className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              No billing history yet. Upgrade to a paid plan to see invoices here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-semibold">Date</th>
                  <th className="pb-2 pr-4 font-semibold">Plan</th>
                  <th className="pb-2 pr-4 font-semibold">Amount</th>
                  <th className="pb-2 pr-4 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Invoice</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 pr-4">{new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</td>
                  <td className="py-2 pr-4 capitalize">{currentPlan}</td>
                  <td className="py-2 pr-4">{currentPlan === "featured" ? "$29" : "$59"}</td>
                  <td className="py-2 pr-4">
                    <Badge className="border-0 bg-emerald-100 text-emerald-700">Paid</Badge>
                  </td>
                  <td className="py-2">
                    <button className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                      <Download className="size-3.5" />
                      Download
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SubscriptionModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        vendorCountry={vendor.countryCode || "US"}
        vendorBrand={vendor.ecosystem === "FINDMYBITES" ? "food" : "party"}
        currentPlan={currentPlan as "free" | "pro" | "business"}
        onSelectPlan={() => setShowUpgrade(false)}
      />
    </div>
  );
}
