"use client";

import * as React from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Globe2, MapPin, Users, Star } from "lucide-react";
import { useStats } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Animated number that counts up when scrolled into view. */
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: 1500, bounce: 0 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString() + suffix);

  React.useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

export function AnimatedCounters() {
  const { data, isLoading } = useStats();
  const continents = data?.continents ?? [];
  const max = Math.max(1, ...continents.map((c) => c.count));

  const counters = [
    { icon: Users, label: "Verified Vendors", value: data?.totalVendors ?? 0, suffix: "+", color: "from-amber-400 to-orange-500" },
    { icon: Globe2, label: "Countries", value: data?.countries ?? 0, suffix: "", color: "from-fuchsia-400 to-purple-500" },
    { icon: MapPin, label: "Cities", value: Math.round((data?.totalVendors ?? 0) / 8), suffix: "+", color: "from-emerald-400 to-teal-500" },
    { icon: Star, label: "Reviews", value: data?.totalReviews ?? 0, suffix: "+", color: "from-sky-400 to-indigo-500" },
  ];

  return (
    <section className="border-b border-border bg-gradient-to-b from-muted/30 to-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand">
            <Globe2 className="size-4" /> Global marketplace
          </p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
            One platform, every continent
          </h2>
          <p className="mt-2 text-muted-foreground">
            FindMyBites × PimpMyParty connects customers and vendors across the entire planet —
            so whether you&apos;re in Lisbon, Lagos, or Lima, the perfect vendor is just a search away.
          </p>
        </div>

        {/* Big animated counters */}
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {counters.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 text-center"
              >
                <div className={cn("mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg", c.color)}>
                  <Icon className="size-6" />
                </div>
                {isLoading ? (
                  <Skeleton className="mx-auto h-8 w-20" />
                ) : (
                  <p className="text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
                    <AnimatedNumber value={c.value} suffix={c.suffix} />
                  </p>
                )}
                <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">{c.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Continent distribution — modern progress indicators */}
        {!isLoading && continents.length > 0 && (
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {continents.slice(0, 6).map((c, i) => {
              const pct = Math.round((c.count / max) * 100);
              const emoji = { Africa: "🌍", Asia: "🌏", Europe: "🌍", "North America": "🌎", "South America": "🌎", Oceania: "🌏", "Middle East": "🌍" }[c.continent] || "🌍";
              return (
                <motion.div
                  key={c.continent}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-lg">{emoji}</span> {c.continent}
                    </span>
                    <span className="text-sm font-bold tabular-nums">{c.count}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-fuchsia-400"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
