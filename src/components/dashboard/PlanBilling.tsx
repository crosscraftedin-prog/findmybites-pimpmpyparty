"use client";

import * as React from "react";
import { CreditCard, Download, MapPin, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SubscriptionModal,
  PRICING_BY_COUNTRY,
  FALLBACK_PRICING,
  getBrand,
  buildPlans,
  PlanCard,
  type PlanKey,
  type BillingCycle,
} from "@/components/SubscriptionModal";
import type { Vendor } from "@/lib/types";

export function PlanBilling({ vendor }: { vendor: Vendor }) {
  const [showUpgrade, setShowUpgrade] = React.useState(false);
  const [billing, setBilling] = React.useState<BillingCycle>("monthly");

  // New plan model: free | pro (Vendor Pro / Baker Pro) | business.
  // The DB currently only tracks a `featured` boolean — treat featured as the
  // mid "pro" tier (the primary upgrade target). When a dedicated plan column
  // lands later, swap this single line.
  const currentPlan: PlanKey = vendor.featured ? "pro" : "free";

  const vendorBrand = vendor.ecosystem === "FINDMYBITES" ? "food" : "party";
  const isFood = vendorBrand === "food";
  const brand = getBrand(vendorBrand);
  const pricing = PRICING_BY_COUNTRY[vendorCountrySafe(vendor.countryCode)] ?? FALLBACK_PRICING;

  const plans = buildPlans({ brand, pricing, billing, isFood, currentPlan });

  // ── Plan expiry calculation ──────────────────────────────────────────
  // vendor.planExpiresAt is set when a payment is verified. Show a warning
  // badge when the plan expires within 30 days, and a "Renew Now" button
  // when within 7 days.
  const daysUntilExpiry = (vendor as any)?.planExpiresAt
    ? Math.ceil(
        (new Date((vendor as any).planExpiresAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const currentPlanName =
    currentPlan === "free"
      ? "Free"
      : currentPlan === "pro"
        ? brand.proName
        : "Business";

  const currentPlanDescription =
    currentPlan === "free"
      ? "You're on the free plan. Upgrade for more visibility, leads, and AI-powered growth."
      : "Your plan is active. Manage your billing or switch plans anytime.";

  // Price strings for the billing-history row (uses current cycle).
  const priceFor = (key: PlanKey) => {
    if (key === "free") return `${pricing.symbol}0`;
    if (key === "pro") return `${pricing.symbol}${pricing.pro[billing]}`;
    return `${pricing.symbol}${pricing.business[billing]}`;
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight">Your Plan</h1>

      {/* Current plan card */}
      <div
        className="mb-6 rounded-xl border-2 p-5"
        style={{ borderColor: brand.borderAccent, background: brand.tint }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge style={{ background: brand.color, color: "#fff", border: 0 }}>
              Current Plan
            </Badge>
            <h2 className="mt-2 text-2xl font-extrabold" style={{ color: brand.darkText }}>
              {currentPlanName}
            </h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {currentPlanDescription}
            </p>
            {currentPlan !== "free" && (
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {priceFor(currentPlan)}
                {billing === "monthly" ? "/month" : "/year"} ·{" "}
                {pricing.label}
              </p>
            )}

            {/* Expiry notification */}
            {currentPlan !== "free" && daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
              <div className="mt-3">
                <div
                  className={`inline-block rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    daysUntilExpiry <= 7
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  ⏰ Plan {daysUntilExpiry <= 0 ? "has expired" : `expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}`}
                </div>
                {daysUntilExpiry <= 7 && (
                  <Button
                    onClick={() => setShowUpgrade(true)}
                    className="mt-2 w-full sm:w-auto"
                    style={{ background: brand.color }}
                  >
                    🔄 Renew Now
                  </Button>
                )}
              </div>
            )}
          </div>
          <Button
            onClick={() => setShowUpgrade(true)}
            className="text-white hover:opacity-90"
            style={{ background: brand.color }}
          >
            {currentPlan === "free" ? "Upgrade" : "Manage Billing"}
          </Button>
        </div>
      </div>

      {/* Available Plans header + controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-bold">Available Plans</h2>

        <div className="flex flex-wrap items-center gap-3">
          {/* Billing cycle toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">Monthly</span>
            <button
              onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
              className="relative h-5 w-10 rounded-full transition-colors"
              style={{
                background: billing === "yearly" ? brand.color : "rgba(0,0,0,0.12)",
              }}
              aria-label="Toggle billing cycle"
            >
              <span
                className="absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform"
                style={{
                  transform: billing === "yearly" ? "translateX(20px)" : "translateX(2px)",
                }}
              />
            </button>
            <span className="text-[12px] text-muted-foreground">Yearly</span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium transition-opacity"
              style={{
                background: "#EAF3DE",
                color: "#27500A",
                opacity: billing === "yearly" ? 1 : 0.35,
              }}
            >
              Save 20%
            </span>
          </div>

          {/* Currency pill */}
          <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-1 text-[10px] text-muted-foreground">
            <MapPin className="size-3" />
            {pricing.label} — prices in {pricing.symbol}
          </span>
        </div>
      </div>

      {/* Plans grid — shared PlanCard component, identical to the upgrade modal */}
      <div className="mb-8 grid gap-3 md:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.planKey}
            planKey={plan.planKey}
            name={plan.name}
            description={plan.description}
            price={plan.price}
            priceNote={plan.priceNote}
            ctaLabel={plan.ctaLabel}
            ctaStyle={plan.ctaStyle}
            featured={plan.featured}
            popular={plan.popular}
            isCurrent={plan.isCurrent}
            features={plan.features}
            brand={brand}
            onSelect={() => setShowUpgrade(true)}
          />
        ))}
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
                  <td className="py-2 pr-4">
                    {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </td>
                  <td className="py-2 pr-4">{currentPlanName}</td>
                  <td className="py-2 pr-4">
                    {priceFor(currentPlan)}
                    {billing === "monthly" ? "/mo" : "/yr"}
                  </td>
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

      {/* Footnote */}
      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <HelpCircle className="size-3" />
        {pricing.note || "All plans include WhatsApp direct booking. No transaction fees. Cancel anytime."}
      </p>

      <SubscriptionModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        vendorCountry={vendor.countryCode || "US"}
        vendorBrand={vendorBrand}
        currentPlan={currentPlan}
        vendorId={vendor.id}
        vendorEmail={vendor.userEmail || undefined}
        vendorName={vendor.name}
        onSelectPlan={() => setShowUpgrade(false)}
      />
    </div>
  );
}

/** Normalise whatever is stored in vendor.countryCode to a key in PRICING_BY_COUNTRY. */
function vendorCountrySafe(code?: string | null): string {
  if (!code) return "US";
  const upper = code.toUpperCase().trim();
  return upper in PRICING_BY_COUNTRY ? upper : "US";
}
