"use client";

import * as React from "react";
import {
  MapPin,
  Check,
  Lock,
  Sparkles,
  UserCheck,
  X,
  HelpCircle,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorCountry: string; // ISO 3166-1 alpha-2 e.g. 'IN', 'US', 'GB'
  vendorBrand: "food" | "party";
  currentPlan: "free" | "pro" | "business";
  onSelectPlan: (
    plan: "free" | "pro" | "business",
    billing: "monthly" | "yearly"
  ) => void;
}

// ─── Pricing Config ─────────────────────────────────────────────────────────
const PRICING_BY_COUNTRY: Record<
  string,
  {
    symbol: string;
    pro: { monthly: number; yearly: number };
    business: { monthly: number; yearly: number };
    label: string;
    note?: string;
  }
> = {
  IN: { symbol: "₹", pro: { monthly: 299, yearly: 239 }, business: { monthly: 499, yearly: 399 }, label: "India — prices in ₹", note: "Prices in Indian Rupees. No transaction fees. Cancel anytime." },
  US: { symbol: "$", pro: { monthly: 5, yearly: 4 }, business: { monthly: 9, yearly: 7 }, label: "United States — prices in $", note: "Prices in USD. No transaction fees. Cancel anytime." },
  GB: { symbol: "£", pro: { monthly: 4, yearly: 3 }, business: { monthly: 7, yearly: 6 }, label: "United Kingdom — prices in £", note: "Prices in GBP. No transaction fees. Cancel anytime." },
  AU: { symbol: "A$", pro: { monthly: 8, yearly: 6 }, business: { monthly: 13, yearly: 10 }, label: "Australia — prices in A$", note: "Prices in AUD. No transaction fees. Cancel anytime." },
  AE: { symbol: "AED", pro: { monthly: 18, yearly: 14 }, business: { monthly: 33, yearly: 26 }, label: "UAE — prices in AED", note: "Prices in AED. No transaction fees. Cancel anytime." },
  SG: { symbol: "S$", pro: { monthly: 7, yearly: 6 }, business: { monthly: 12, yearly: 10 }, label: "Singapore — prices in S$", note: "Prices in SGD. No transaction fees. Cancel anytime." },
  NG: { symbol: "₦", pro: { monthly: 2000, yearly: 1600 }, business: { monthly: 3500, yearly: 2800 }, label: "Nigeria — prices in ₦", note: "Prices in NGN. No transaction fees. Cancel anytime." },
  CA: { symbol: "CA$", pro: { monthly: 7, yearly: 6 }, business: { monthly: 12, yearly: 10 }, label: "Canada" },
  ZA: { symbol: "R", pro: { monthly: 90, yearly: 72 }, business: { monthly: 160, yearly: 128 }, label: "South Africa" },
};

const FALLBACK_PRICING = PRICING_BY_COUNTRY["US"];

// ─── Brand System ───────────────────────────────────────────────────────────
function getBrand(vendorBrand: "food" | "party") {
  return {
    food: {
      name: "FindMyBites",
      color: "#D85A30",
      tint: "#FAECE7",
      darkText: "#993C1D",
      borderAccent: "#F0997B",
      proName: "Baker Pro",
    },
    party: {
      name: "PimpMyParty",
      color: "#7F77DD",
      tint: "#EEEDFE",
      darkText: "#534AB7",
      borderAccent: "#AFA9EC",
      proName: "Vendor Pro",
    },
  }[vendorBrand];
}

// ─── Feature Row ────────────────────────────────────────────────────────────
function FeatureRow({
  label,
  unlocked,
  brand,
  highlight,
  badge,
}: {
  label: string;
  unlocked: boolean;
  brand: ReturnType<typeof getBrand>;
  highlight?: boolean;
  badge?: "ai" | "leads";
}) {
  const BadgeIcon = badge === "ai" ? Sparkles : UserCheck;
  const badgeBg = badge === "ai" ? "#EEEDFE" : "#EAF3DE";
  const badgeText = badge === "ai" ? "#534AB7" : "#27500A";

  return (
    <div className="flex items-center gap-2 py-1.5">
      {unlocked ? (
        <Check className="size-3.5 shrink-0" style={{ color: brand.color }} />
      ) : (
        <Lock className="size-3.5 shrink-0 text-black/25" />
      )}
      <span
        className={
          unlocked
            ? highlight
              ? "text-[12px] font-medium text-black/80"
              : "text-[12px] text-black/60"
            : "text-[12px] text-black/30"
        }
      >
        {label}
      </span>
      {badge && (
        <span
          className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium"
          style={{ background: badgeBg, color: badgeText }}
        >
          <BadgeIcon className="size-2.5" />
          {badge === "ai" ? "AI" : "Leads"}
        </span>
      )}
    </div>
  );
}

// ─── Plan Card ──────────────────────────────────────────────────────────────
function PlanCard({
  planKey,
  name,
  description,
  price,
  priceNote,
  ctaLabel,
  ctaStyle,
  featured,
  popular,
  isCurrent,
  features,
  brand,
  onSelect,
}: {
  planKey: "free" | "pro" | "business";
  name: string;
  description: string;
  price: string;
  priceNote?: string;
  ctaLabel: string;
  ctaStyle: "outlined-gray" | "outlined-brand" | "solid-brand";
  featured: boolean;
  popular?: boolean;
  isCurrent: boolean;
  features: React.ReactNode[];
  brand: ReturnType<typeof getBrand>;
  onSelect: () => void;
}) {
  const ctaClasses: Record<string, string> = {
    "outlined-gray":
      "border border-black/15 text-black/60 hover:bg-black/5",
    "outlined-brand":
      "border text-black/60 hover:bg-black/5",
    "solid-brand":
      "text-white hover:opacity-90",
  };

  return (
    <div
      className={`relative flex flex-col rounded-lg border bg-white p-4 ${
        featured ? "border-2" : "border border-black/10"
      }`}
      style={
        featured
          ? { borderColor: brand.borderAccent }
          : undefined
      }
    >
      {popular && (
        <div
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[9px] font-medium text-white"
          style={{ background: brand.color }}
        >
          Most popular
        </div>
      )}

      {/* Plan name */}
      <p className="text-[13px] font-medium" style={{ color: brand.darkText }}>
        {name}
      </p>
      <p className="mt-0.5 text-[10px] leading-snug text-black/40">{description}</p>

      {/* Price */}
      <div className="mt-3">
        <span className="text-[24px] font-medium tracking-tight">{price}</span>
        {priceNote && (
          <span className="ml-1 text-[10px] text-black/40">{priceNote}</span>
        )}
      </div>

      {/* CTA or Current badge */}
      <div className="mt-3">
        {isCurrent ? (
          <div className="rounded-md bg-black/5 py-2 text-center text-[11px] font-medium text-black/40">
            Current plan
          </div>
        ) : (
          <button
            onClick={onSelect}
            className={`w-full rounded-md py-2 text-[11px] font-medium transition-opacity ${ctaClasses[ctaStyle]}`}
            style={
              ctaStyle === "outlined-brand"
                ? { borderColor: brand.borderAccent, background: brand.tint, color: brand.darkText }
                : ctaStyle === "solid-brand"
                  ? { background: brand.color }
                  : undefined
            }
          >
            {ctaLabel}
          </button>
        )}
      </div>

      {/* Features */}
      <div className="mt-4 flex-1">{features}</div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function SubscriptionModal({
  isOpen,
  onClose,
  vendorCountry,
  vendorBrand,
  currentPlan,
  onSelectPlan,
}: SubscriptionModalProps) {
  const [billing, setBilling] = React.useState<"monthly" | "yearly">("monthly");

  const brand = getBrand(vendorBrand);
  const pricing = PRICING_BY_COUNTRY[vendorCountry] ?? FALLBACK_PRICING;

  // Reset billing when modal closes
  React.useEffect(() => {
    if (!isOpen) setBilling("monthly");
  }, [isOpen]);

  // Close on Escape
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Lock body scroll
  React.useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isFood = vendorBrand === "food";

  // ── Build plan data ──────────────────────────────────────────────────────
  const plans = [
    {
      planKey: "free" as const,
      name: "Free",
      description: "Get started and be discovered",
      price: "0",
      priceNote: "forever",
      ctaLabel: "Get started free",
      ctaStyle: "outlined-gray" as const,
      featured: false,
      isCurrent: currentPlan === "free",
      features: [
        <FeatureRow key="f1" label="Basic listing (name, city, category)" unlocked={true} brand={brand} />,
        <FeatureRow key="f2" label="WhatsApp booking link" unlocked={true} brand={brand} />,
        <FeatureRow key="f3" label="Up to 5 gallery photos" unlocked={true} brand={brand} />,
        <FeatureRow key="f4" label="Verified badge" unlocked={false} brand={brand} />,
        <FeatureRow key="f5" label="Analytics dashboard" unlocked={false} brand={brand} />,
        isFood ? (
          <FeatureRow key="f6" label="AI suggestions" unlocked={false} brand={brand} badge="ai" />
        ) : (
          <FeatureRow key="f6" label="Leads" unlocked={false} brand={brand} badge="leads" />
        ),
      ],
    },
    {
      planKey: "pro" as const,
      name: brand.proName,
      description: isFood
        ? "For serious food vendors ready to grow"
        : "Get leads and grow your events business",
      price: `${pricing.symbol}${pricing.pro[billing]}`,
      priceNote: billing === "monthly" ? "/month" : "/month, billed yearly",
      ctaLabel: `Start ${brand.proName}`,
      ctaStyle: "outlined-brand" as const,
      featured: true,
      popular: true,
      isCurrent: currentPlan === "pro",
      features: [
        <FeatureRow key="p1" label="Everything in Free" unlocked={true} brand={brand} />,
        <FeatureRow key="p2" label="Verified badge on listing" unlocked={true} brand={brand} />,
        <FeatureRow key="p3" label="Up to 20 gallery photos" unlocked={true} brand={brand} />,
        <FeatureRow key="p4" label="Basic analytics dashboard" unlocked={true} brand={brand} />,
        <FeatureRow key="p5" label="Customer reviews enabled" unlocked={true} brand={brand} />,
        !isFood ? (
          <FeatureRow key="p6" label="Curated leads delivered to you" unlocked={true} brand={brand} badge="leads" highlight />
        ) : null,
        <FeatureRow key="p7" label="Priority placement in search" unlocked={false} brand={brand} />,
        isFood ? (
          <FeatureRow key="p8" label="AI suggestions" unlocked={false} brand={brand} badge="ai" />
        ) : null,
      ].filter(Boolean),
    },
    {
      planKey: "business" as const,
      name: "Business",
      description: "Maximum visibility + AI-powered growth",
      price: `${pricing.symbol}${pricing.business[billing]}`,
      priceNote: billing === "monthly" ? "/month" : "/month, billed yearly",
      ctaLabel: "Go Business",
      ctaStyle: "solid-brand" as const,
      featured: false,
      isCurrent: currentPlan === "business",
      features: [
        <FeatureRow key="b1" label={`Everything in ${brand.proName}`} unlocked={true} brand={brand} />,
        <FeatureRow key="b2" label="Priority placement in search" unlocked={true} brand={brand} />,
        <FeatureRow key="b3" label="Homepage spotlight feature" unlocked={true} brand={brand} />,
        <FeatureRow key="b4" label="Ad banner slot access" unlocked={true} brand={brand} />,
        <FeatureRow key="b5" label="Advanced analytics" unlocked={true} brand={brand} />,
        <FeatureRow key="b6" label="Unlimited gallery photos" unlocked={true} brand={brand} />,
        <FeatureRow key="b7" label="AI-powered suggestions" unlocked={true} brand={brand} badge="ai" highlight />,
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.48)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[640px] overflow-hidden rounded-xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-full text-black/40 transition-colors hover:bg-black/5 hover:text-black/70"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="px-6 pb-0 pt-5">
          {/* Brand pill */}
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium"
            style={{ background: brand.tint, color: brand.darkText }}
          >
            {brand.name}
          </span>

          {/* Title */}
          <h2 className="mt-2 text-[18px] font-medium tracking-tight">
            {isFood ? "Grow your food business" : "Grow your events business"}
          </h2>
          <p className="mt-0.5 text-[12px] text-black/40">
            {isFood
              ? "Get discovered by thousands of customers — zero commission, always."
              : "Connect with hosts, couples, and corporates — zero commission, always."}
          </p>

          {/* Billing toggle */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-[12px] text-black/50">Monthly</span>
            <button
              onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
              className="relative h-5 w-10 rounded-full transition-colors"
              style={{
                background: billing === "yearly" ? brand.color : "rgba(0,0,0,0.12)",
              }}
            >
              <span
                className="absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform"
                style={{
                  transform: billing === "yearly" ? "translateX(20px)" : "translateX(2px)",
                }}
              />
            </button>
            <span className="text-[12px] text-black/50">Yearly</span>
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

          {/* Country pill */}
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-1 text-[10px] text-black/40">
              <MapPin className="size-3" />
              {pricing.label} — prices in {pricing.symbol}
            </span>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-3 gap-2.5 px-6 py-5">
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
              onSelect={() => onSelectPlan(plan.planKey, billing)}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-black/10" />

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3">
          <p className="text-[10px] text-black/40">
            {pricing.note || "All plans include WhatsApp direct booking. No transaction fees. Cancel anytime."}
          </p>
          <button className="inline-flex items-center gap-1 text-[10px] text-black/40 transition-colors hover:text-black/60">
            <HelpCircle className="size-3" />
            How it works
          </button>
        </div>
      </div>
    </div>
  );
}
