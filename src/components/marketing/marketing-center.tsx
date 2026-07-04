"use client";

import * as React from "react";
import {
  BarChart3, Sparkles, Search, Share2, Megaphone, Mail, MessageCircle,
  QrCode, Star, Users, TrendingUp, Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarketingOverview } from "./marketing-overview";
import { SeoCenter } from "./marketing-seo-center";
import { SocialMediaGenerator } from "./marketing-social-generator";
import { CampaignManager } from "./marketing-campaigns";
import { EmailCampaignManager } from "./marketing-email";
import { WhatsAppMarketing } from "./marketing-whatsapp";
import { QrCodeGenerator } from "./marketing-qr";
import { ReviewBooster } from "./marketing-review-booster";
import { ReferralProgram } from "./marketing-referral";
import { PerformanceAnalytics } from "./marketing-performance";
import { CompetitorInsights } from "./marketing-competitors";
import { SubscriptionUpsell } from "./marketing-upsell";
import type { Vendor } from "@/lib/types";

export type MarketingTab =
  | "overview" | "seo" | "social" | "campaigns" | "email" | "whatsapp"
  | "qr" | "reviews" | "referral" | "analytics" | "competitors" | "upsell";

interface MarketingTabDef { id: MarketingTab; label: string; icon: React.ElementType; group: "growth" | "content" | "outreach"; }

const TABS: MarketingTabDef[] = [
  { id: "overview", label: "Overview", icon: BarChart3, group: "growth" },
  { id: "analytics", label: "Performance", icon: TrendingUp, group: "growth" },
  { id: "competitors", label: "Competitors", icon: Users, group: "growth" },
  { id: "upsell", label: "Upgrade", icon: Crown, group: "growth" },
  { id: "seo", label: "SEO Center", icon: Search, group: "content" },
  { id: "social", label: "Social Media", icon: Share2, group: "content" },
  { id: "campaigns", label: "Campaigns", icon: Megaphone, group: "content" },
  { id: "email", label: "Email", icon: Mail, group: "content" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, group: "outreach" },
  { id: "qr", label: "QR Codes", icon: QrCode, group: "outreach" },
  { id: "reviews", label: "Review Booster", icon: Star, group: "outreach" },
  { id: "referral", label: "Referrals", icon: Users, group: "outreach" },
];

const GROUP_LABELS: Record<string, string> = { growth: "Growth", content: "Content", outreach: "Outreach" };

export function MarketingCenter({ vendor }: { vendor: Vendor }) {
  const [tab, setTab] = React.useState<MarketingTab>("overview");

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-5">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Sparkles className="h-6 w-6 text-primary" /> Marketing Center
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your growth dashboard — grow visibility, reach more customers, and track performance.
        </p>
      </div>

      <div className="mb-6">
        <ScrollArea className="w-full pb-1">
          <div className="flex w-max gap-4">
            {(["growth", "content", "outreach"] as const).map((group) => (
              <div key={group} className="flex flex-col gap-1.5">
                <span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{GROUP_LABELS[group]}</span>
                <div className="flex gap-1.5">
                  {TABS.filter((t) => t.group === group).map((t) => {
                    const Icon = t.icon;
                    const active = tab === t.id;
                    return (
                      <button key={t.id} onClick={() => setTab(t.id)}
                        className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition whitespace-nowrap",
                          active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent")}>
                        <Icon className="h-4 w-4" />{t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="min-h-[400px]">
        {tab === "overview" && <MarketingOverview vendor={vendor} onNavigate={setTab} />}
        {tab === "analytics" && <PerformanceAnalytics />}
        {tab === "competitors" && <CompetitorInsights />}
        {tab === "upsell" && <SubscriptionUpsell vendor={vendor} />}
        {tab === "seo" && <SeoCenter />}
        {tab === "social" && <SocialMediaGenerator vendor={vendor} />}
        {tab === "campaigns" && <CampaignManager />}
        {tab === "email" && <EmailCampaignManager />}
        {tab === "whatsapp" && <WhatsAppMarketing />}
        {tab === "qr" && <QrCodeGenerator vendor={vendor} />}
        {tab === "reviews" && <ReviewBooster vendor={vendor} />}
        {tab === "referral" && <ReferralProgram vendor={vendor} />}
      </div>
    </div>
  );
}
