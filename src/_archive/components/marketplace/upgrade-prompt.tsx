/**
 * Archived on 2026-07-14
 * Reason: Zero runtime references found during production audit.
 * Preserved for future features.
 */
"use client";

import * as React from "react";
import { Sparkles, Crown, TrendingUp, BarChart3, Star, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UpgradePromptProps {
  variant?: "card" | "banner" | "inline" | "modal";
  feature?: string;
  limit?: number;
  current?: number;
  onUpgrade?: () => void;
  onDismiss?: () => void;
}

const FEATURES = [
  { icon: Crown, label: "Verified Badge", desc: "Build trust with customers" },
  { icon: Star, label: "Featured Listing", desc: "Appear first in search results" },
  { icon: TrendingUp, label: "Priority Search", desc: "Rank higher than free vendors" },
  { icon: BarChart3, label: "Advanced Analytics", desc: "Track views, enquiries, conversions" },
  { icon: Sparkles, label: "AI Tools", desc: "Auto-generate descriptions & SEO" },
  { icon: Zap, label: "Unlimited Gallery", desc: "Upload unlimited photos" },
];

export function UpgradePrompt({ variant = "card", feature, limit, current, onUpgrade, onDismiss }: UpgradePromptProps) {
  if (variant === "modal") {
    return (
      <div
        
        
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onDismiss}
      >
        <div
          
          
          className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
                <Crown className="size-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold">Upgrade to Pro</h3>
                <p className="text-xs text-muted-foreground">Unlock premium features</p>
              </div>
            </div>
            {onDismiss && (
              <button onClick={onDismiss} className="grid size-8 place-items-center rounded-full hover:bg-muted">
                <X className="size-4" />
              </button>
            )}
          </div>
          {feature && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {limit !== undefined && current !== undefined ? (
                <>You've used {current}/{limit} free {feature}. Upgrade for more.</>
              ) : (
                <>{feature} is a Pro feature. Upgrade to unlock it.</>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="flex items-start gap-2 rounded-lg border border-border p-2">
                  <Icon className="size-4 shrink-0 text-[#FF6B35] mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{f.label}</p>
                    <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <Button onClick={onUpgrade} className="w-full bg-[#FF6B35] text-white hover:bg-[#e85a2a]">
            View Plans
          </Button>
        </div>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            {feature ? `Unlock ${feature}` : "Unlock premium features"} with a Pro plan
          </p>
        </div>
        <Button size="sm" onClick={onUpgrade} className="shrink-0 bg-amber-600 text-white hover:bg-amber-700">
          Upgrade
        </Button>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <button
        onClick={onUpgrade}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
      >
        <Crown className="size-3.5" />
        {feature ? `Upgrade for ${feature}` : "Upgrade to Pro"}
      </button>
    );
  }

  // Default: card
  return (
    <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Crown className="size-5 text-amber-600" />
        <h3 className="font-semibold text-amber-900">Want more visibility?</h3>
      </div>
      <p className="text-sm text-amber-700 mb-3">
        Upgrade to Pro for Featured Listing, Verified Badge, Priority Search, Analytics, and more.
      </p>
      <Button onClick={onUpgrade} size="sm" className="bg-amber-600 text-white hover:bg-amber-700">
        View Plans
      </Button>
    </div>
  );
}
