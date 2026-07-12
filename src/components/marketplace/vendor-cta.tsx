"use client";

import * as React from "react";
import {
  Globe2, Sparkles, MessageSquare, TrendingUp, Star, BarChart3,
  Crown, ArrowRight, CheckCircle2, BadgeCheck,
} from "lucide-react";
import { useMarketplace } from "@/lib/store";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { useStats } from "@/lib/queries";

const BENEFITS = [
  { icon: Globe2, title: "Reach global customers", desc: "Get discovered by event planners & hosts on 6 continents." },
  { icon: BadgeCheck, title: "Professional profile", desc: "A premium listing with photos, videos & verified badge." },
  { icon: MessageSquare, title: "Receive enquiries", desc: "Customers message you directly — no middlemen, no commission." },
  { icon: TrendingUp, title: "SEO-optimized listing", desc: "Rank on Google for your category & city." },
  { icon: BarChart3, title: "Analytics dashboard", desc: "Track views, enquiries, bookings & revenue in real time." },
  { icon: Star, title: "Reviews & ratings", desc: "Build trust with verified customer reviews." },
  { icon: Crown, title: "Subscription plans", desc: "Upgrade to Pro or Business for premium features." },
  { icon: Sparkles, title: "Featured placements", desc: "Get highlighted at the top of search results." },
];

export function VendorCTA() {
  const openListVendor = useMarketplace((s) => s.openListVendor);
  const openAuthDialog = useMarketplace((s) => s.openAuthDialog);
  const setAuthIntent = useMarketplace((s) => s.setAuthIntent);
  const { user: session } = useSupabaseSession();
  const { data: stats } = useStats();

  const handleStart = () => {
    // Auth gate removed — the onboarding form handles auth at publish time.
    // This maximizes conversion: user fills the form first, then signs in to publish.
    openListVendor();
  };

  const handlePricing = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-brand-border bg-gradient-to-br from-brand-soft via-background to-brand-soft p-6 sm:p-10 lg:p-14">
          {/* decorative blobs */}
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-brand/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 size-64 rounded-full bg-brand/10 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            {/* Left: copy + CTAs */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-background/80 px-3 py-1 text-xs font-semibold text-brand-soft-foreground backdrop-blur">
                <Sparkles className="size-3.5" />
                For vendors & businesses
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                Grow your business with customers worldwide.
              </h2>
              <p className="mt-4 max-w-lg text-muted-foreground">
                Whether you bake sourdough in Paris or spin decks in Amsterdam, thousands of
                customers are searching for exactly what you do. Join free and start receiving
                enquiries today.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleStart}
                  className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-lg transition-transform hover:scale-105"
                >
                  <Sparkles className="size-4" />
                  Start Free
                  <ArrowRight className="size-4" />
                </button>
                <button
                  onClick={handlePricing}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold transition-colors hover:bg-accent"
                >
                  <Crown className="size-4" />
                  View Pricing
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3.5 text-emerald-500" /> No setup fees</span>
                <span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3.5 text-emerald-500" /> No commission on first 5 bookings</span>
                <span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3.5 text-emerald-500" /> Cancel anytime</span>
              </div>

              {/* Live count */}
              <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-background/80 px-3 py-2 text-xs">
                <span className="flex -space-x-1.5">
                  {[0,1,2].map(i => <span key={i} className="size-5 rounded-full border-2 border-background bg-gradient-to-br from-amber-400 to-fuchsia-400" />)}
                </span>
                <span className="font-medium">{(stats?.totalVendors ?? 0).toLocaleString()}+ vendors already listed</span>
              </div>
            </div>

            {/* Right: benefits grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              {BENEFITS.map((b, i) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.title}
                    
                    
                    
                    
                    className="rounded-xl border border-border bg-background/80 p-4 backdrop-blur transition-shadow hover:shadow-md"
                  >
                    <div className="grid size-9 place-items-center rounded-lg bg-brand text-brand-foreground">
                      <Icon className="size-4.5" />
                    </div>
                    <h3 className="mt-2.5 text-sm font-bold">{b.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{b.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
