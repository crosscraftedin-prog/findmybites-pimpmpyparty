"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Search, MessageSquareHeart, PartyPopper } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Discover & compare",
    description:
      "Browse thousands of verified vendors worldwide. Filter by category, continent, price and rating to shortlist your favourites.",
    accent: "from-amber-400 to-orange-500",
  },
  {
    icon: MessageSquareHeart,
    title: "Connect & book",
    description:
      "Send a free enquiry with your event details. Chat directly with vendors, ask questions and confirm your booking — no middlemen.",
    accent: "from-rose-400 to-fuchsia-500",
  },
  {
    icon: PartyPopper,
    title: "Celebrate & review",
    description:
      "Enjoy a flawless event, then share your experience to help the next customer. Build trust across a truly global community.",
    accent: "from-fuchsia-500 to-purple-600",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            How it works
          </p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
            From craving to celebration in 3 simple steps
          </h2>
          <p className="mt-2 text-muted-foreground">
            Whether you&apos;re planning a wedding in Lisbon or a corporate gala
            in São Paulo, FindMyBites × PimpMyParty makes booking the right pro
            effortless.
          </p>
        </div>

        <div className="relative mt-12 grid gap-6 md:grid-cols-3">
          {/* connecting line */}
          <div className="absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative flex flex-col items-center text-center"
              >
                <div
                  className={`relative grid size-16 place-items-center rounded-2xl bg-gradient-to-br ${s.accent} text-white shadow-lg`}
                >
                  <Icon className="size-8" />
                  <span className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-background text-xs font-bold text-foreground shadow-md ring-1 ring-border">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  {s.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
