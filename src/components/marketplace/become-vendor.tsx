"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  ShieldCheck,
  Globe2,
  Clock,
  Sparkles,
  ArrowRight,
  UtensilsCrossed,
  PartyPopper,
} from "lucide-react";
import { useMarketplace } from "@/lib/store";

const BENEFITS = [
  {
    icon: TrendingUp,
    title: "Grow your bookings",
    description: "Reach customers across the globe you'd never find otherwise.",
  },
  {
    icon: ShieldCheck,
    title: "Build trust",
    description: "Verified profile, reviews and ratings that convert browsers into buyers.",
  },
  {
    icon: Globe2,
    title: "Go global",
    description: "List once, get discovered by event planners and hosts on 6 continents.",
  },
  {
    icon: Clock,
    title: "Save time",
    description: "Manage enquiries, quotes and calendars in one beautiful dashboard.",
  },
];

export function BecomeVendor() {
  const ecosystem = useMarketplace((s) => s.ecosystem);
  const toggle = useMarketplace((s) => s.toggleEcosystem);
  const openListVendor = useMarketplace((s) => s.openListVendor);
  const openAuthDialog = useMarketplace((s) => s.openAuthDialog);
  const setAuthIntent = useMarketplace((s) => s.setAuthIntent);
  const { data: session } = useSession();

  const handleListClick = () => {
    if (session?.user) {
      openListVendor();
    } else {
      setAuthIntent(() => openListVendor);
      openAuthDialog();
    }
  };

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-brand-border bg-gradient-to-br from-brand-soft via-background to-brand-soft p-6 sm:p-10 lg:p-14">
          {/* decorative blobs */}
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-brand/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 size-64 rounded-full bg-brand/10 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-background/80 px-3 py-1 text-xs font-semibold text-brand-soft-foreground backdrop-blur">
                <Sparkles className="size-3.5" />
                For vendors & businesses
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                List your business on the world&apos;s dual marketplace
              </h2>
              <p className="mt-4 max-w-lg text-muted-foreground">
                Whether you bake sourdough in Paris or spin decks in Amsterdam,
                thousands of customers are searching for exactly what you do.
                Join free and start receiving enquiries today.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleListClick}
                  className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-lg transition-transform hover:scale-105"
                >
                  <Sparkles className="size-4" />
                  List your business — free
                  <ArrowRight className="size-4" />
                </button>
                <button
                  onClick={toggle}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold transition-colors hover:bg-accent"
                >
                  {ecosystem === "FINDMYBITES" ? (
                    <>
                      <PartyPopper className="size-4" />
                      I&apos;m a party pro
                    </>
                  ) : (
                    <>
                      <UtensilsCrossed className="size-4" />
                      I sell food
                    </>
                  )}
                </button>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                No setup fees · No commission on your first 5 bookings · Cancel
                anytime
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {BENEFITS.map((b, i) => {
                const Icon = b.icon;
                return (
                  <motion.div
                    key={b.title}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-2xl border border-border bg-background/80 p-5 backdrop-blur"
                  >
                    <div className="grid size-10 place-items-center rounded-xl bg-brand text-brand-foreground">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-3 font-bold">{b.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {b.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
