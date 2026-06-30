"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Cake, Heart, Briefcase, Baby, GraduationCap, Music, Gift, PartyPopper } from "lucide-react";
import { useMarketplace } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const EVENT_TYPES = [
  { id: "weddings", label: "Weddings", icon: Heart, color: "from-rose-400 to-pink-500", categories: ["decorators", "photographers", "florists", "venues", "djs", "makeup-artists"] },
  { id: "birthdays", label: "Birthdays", icon: Cake, color: "from-amber-400 to-orange-500", categories: ["decorators", "entertainers", "djs", "party-supplies"] },
  { id: "corporate", label: "Corporate", icon: Briefcase, color: "from-slate-400 to-gray-600", categories: ["venues", "caterers", "audio-visual-services", "event-planners"] },
  { id: "kids", label: "Kids Parties", icon: Baby, color: "from-cyan-400 to-blue-500", categories: ["kids-party-services", "entertainers", "decorators", "party-supplies"] },
  { id: "engagements", label: "Engagements", icon: Heart, color: "from-fuchsia-400 to-purple-500", categories: ["decorators", "photographers", "florists", "makeup-artists"] },
  { id: "anniversaries", label: "Anniversaries", icon: Gift, color: "from-violet-400 to-indigo-500", categories: ["decorators", "photographers", "florists", "venues"] },
  { id: "festivals", label: "Festivals", icon: PartyPopper, color: "from-emerald-400 to-teal-500", categories: ["decorators", "djs", "entertainers", "caterers"] },
  { id: "concerts", label: "Concerts", icon: Music, color: "from-purple-400 to-fuchsia-500", categories: ["venues", "audio-visual-services", "djs", "entertainers"] },
];

export function EventTypeSection() {
  const ecosystem = useMarketplace((s) => s.ecosystem);
  const setSelectedCategory = useMarketplace((s) => s.setSelectedCategory);
  const setSearch = useMarketplace((s) => s.setSearch);

  // Only show for PimpMyParty
  if (ecosystem !== "PIMPMYPARTY") return null;

  const handlePick = (eventType: typeof EVENT_TYPES[0]) => {
    // Set search to the event type label and scroll to browse
    setSearch(eventType.label);
    setSelectedCategory(null);
    document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="event-types" className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">
              Browse by event
            </p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
              What are you celebrating?
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              From dream weddings to kids' birthday bashes — find the right pros for every occasion.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {EVENT_TYPES.map((et, i) => {
            const Icon = et.icon;
            return (
              <motion.button
                key={et.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                onClick={() => handlePick(et)}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-border hover:shadow-lg"
              >
                <div className={cn(
                  "grid size-14 place-items-center rounded-full bg-gradient-to-br transition-transform group-hover:scale-110",
                  et.color
                )}>
                  <Icon className="size-7 text-white" />
                </div>
                <span className="text-xs font-bold text-center">{et.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
