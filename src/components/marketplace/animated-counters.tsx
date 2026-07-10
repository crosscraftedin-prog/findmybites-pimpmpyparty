"use client";

import * as React from "react";
import { Globe2, MapPin, Users, Star } from "lucide-react";
import { useStats } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Animated number that counts up when scrolled into view. */
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = React.useState(0);
  const inView = React.useRef(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !inView.current) {
          inView.current = true;
          const start = performance.now();
          const duration = 1500;
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setDisplayValue(Math.round(value * eased));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{displayValue.toLocaleString()}{suffix}</span>;
}

export function AnimatedCounters({ stats: serverStats }: { stats?: any } = {}) {
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
              < div
                key={c.label}
                
                
                
                
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
              </ div>
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
                < div
                  key={c.continent}
                  
                  
                  
                  
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-lg">{emoji}</span> {c.continent}
                    </span>
                    <span className="text-sm font-bold tabular-nums">{c.count}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    < div
                      
                      
                      
                      
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-fuchsia-400"
                    />
                  </div>
                </ div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
