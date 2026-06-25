"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Globe2,
  HandHeart,
  Heart,
  Store,
  ArrowRight,
  Mail,
  MessageCircle,
} from "lucide-react";
import { SiteHeader } from "@/components/marketplace/site-header";
import { SiteFooter } from "@/components/marketplace/site-footer";
import { Button } from "@/components/ui/button";
import { useMarketplace } from "@/lib/store";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5 },
};

export default function AboutPage() {
  const openListVendor = useMarketplace((s) => s.openListVendor);
  const openAuthDialog = useMarketplace((s) => s.openAuthDialog);
  const setAuthIntent = useMarketplace((s) => s.setAuthIntent);

  const handleListClick = () => {
    setAuthIntent("list-vendor");
    openAuthDialog();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-rose-500/15" />
          <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8 lg:py-32">
            <motion.div {...fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-soft-foreground">
                <Sparkles className="size-3.5" />
                Our Story
              </span>
            </motion.div>
            <motion.h1
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.1 }}
              className="mt-6 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl"
            >
              The Story Behind FindMyBites
            </motion.h1>
            <motion.p
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.2 }}
              className="mt-4 text-lg font-medium text-muted-foreground sm:text-xl"
            >
              Built in the Middle East. Built for the world.
            </motion.p>
          </div>
        </section>

        {/* FOUNDER */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <div className="grid items-center gap-10 lg:grid-cols-[300px_1fr] lg:gap-16">
              <motion.div {...fadeUp} className="mx-auto flex flex-col items-center gap-4">
                {/* REPLACE WITH JOSH'S PHOTO — swap /founder-josh.jpg with any image */}
                <div className="relative size-[300px] overflow-hidden rounded-full ring-4 ring-[#FF6B35] ring-offset-4 ring-offset-background">
                  <img
                    src="/founder-josh.jpg"
                    alt="Josh, Founder & CEO of FindMyBites × PimpMyParty"
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Josh, Founder & CEO
                </p>
              </motion.div>

              <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }}>
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                  👋 Hi, I&apos;m Josh
                </h2>
                <p className="mt-2 text-base font-semibold text-brand">
                  Founder &amp; CEO of FindMyBites × PimpMyParty
                </p>
                <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
                  <p>
                    Growing up in the Middle East, I watched incredibly talented
                    food artisans — home bakers, private chefs, caterers with
                    generations of recipes — struggle to find customers beyond
                    their immediate circle. Not because their food wasn&apos;t
                    extraordinary. But because no one could find them.
                  </p>
                  <p>
                    I built FindMyBites to change that. A marketplace where every
                    small food business — whether you&apos;re a home baker in
                    Dubai, a private chef in Riyadh, or a caterer in Beirut —
                    gets the same visibility as the big restaurants. Because
                    great food deserves to be found.
                  </p>
                  <p>
                    And PimpMyParty? That came naturally. Because the same people
                    planning events were also searching for decorators, DJs, and
                    photographers. So we built it all in one place.
                  </p>
                </div>
                <p className="mt-6 font-[cursive] text-lg italic text-foreground">
                  — Josh, Founder
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* MISSION */}
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <motion.div {...fadeUp} className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Our Mission</h2>
              <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
                Three principles guide everything we build.
              </p>
            </motion.div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                { emoji: "🌍", icon: Globe2, title: "Global Reach", desc: "We connect food artisans and event professionals with customers across 62 countries — from your neighbourhood to the world." },
                { emoji: "🤝", icon: HandHeart, title: "Vendor First", desc: "Every feature we build starts with one question: does this help our vendors grow? Small businesses are the heart of this platform." },
                { emoji: "✨", icon: Heart, title: "Built with Love", desc: "FindMyBites was built in the Middle East with a deep respect for food culture, community, and the people who feed us." },
              ].map((card) => (
                <motion.div key={card.title} {...fadeUp} className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                  <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-soft text-2xl">{card.emoji}</div>
                  <h3 className="mt-4 text-lg font-bold">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* TIMELINE */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <motion.div {...fadeUp} className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">How it all started</h2>
            </motion.div>
            <div className="mt-12 space-y-8">
              {[
                { emoji: "📍", year: "2023", title: "The Idea", desc: "Josh notices talented home bakers and caterers in the Middle East with no digital presence and no way to reach customers outside their WhatsApp contacts." },
                { emoji: "🛠️", year: "2024", title: "Building Begins", desc: "FindMyBites is born. The first version connects food vendors with local customers looking for alternatives to big restaurant chains." },
                { emoji: "🎉", year: "2024", title: "PimpMyParty Launches", desc: "Customers planning events need more than food. PimpMyParty is added — bringing decorators, DJs, photographers and more under one roof." },
                { emoji: "🌍", year: "2025", title: "Going Global", desc: "The platform expands across the Middle East, Africa, Europe and beyond — with vendors in over 60 countries." },
                { emoji: "🚀", year: "2026", title: "AI Meets Events", desc: "Josh, our AI event planning assistant, launches — helping customers plan entire events through a single conversation." },
              ].map((item, i) => (
                <motion.div key={i} {...fadeUp} className="relative flex gap-5">
                  {!i === 4 && <div className="absolute left-[26px] top-14 h-full w-px bg-border" />}
                  <div className="grid size-[54px] shrink-0 place-items-center rounded-full border-2 border-brand/30 bg-brand-soft text-2xl">{item.emoji}</div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-brand-foreground">{item.year}</span>
                      <h3 className="text-lg font-bold">{item.title}</h3>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* VALUES */}
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <motion.div {...fadeUp} className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">What we stand for</h2>
            </motion.div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                { emoji: "🏪", text: "Small businesses deserve big opportunities" },
                { emoji: "🌐", text: "Food and culture are universal languages" },
                { emoji: "💛", text: "Every vendor is a person, not just a listing" },
              ].map((v) => (
                <motion.div key={v.text} {...fadeUp} className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
                  <span className="text-3xl">{v.emoji}</span>
                  <p className="text-base font-semibold leading-snug">{v.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-background">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
            <motion.div {...fadeUp}>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Join us</h2>
              <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
                Whether you&apos;re a vendor looking to grow or a customer planning your next event — we&apos;d love to have you.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button onClick={handleListClick} size="lg" className="w-full bg-brand text-brand-foreground hover:bg-brand/90 sm:w-auto">
                  <Store className="size-4" /> List Your Business
                </Button>
                <a href="/" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full">
                    <ArrowRight className="size-4" /> Find Vendors Near You
                  </Button>
                </a>
              </div>
              <p className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <MessageCircle className="size-4 text-brand" />
                Have a question? Chat with Josh our AI assistant
                <span className="text-border">or</span>
                <a href="mailto:hello@findmybites.com" className="inline-flex items-center gap-1 font-medium text-brand hover:underline">
                  <Mail className="size-3.5" /> email us at hello@findmybites.com
                </a>
              </p>
            </motion.div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
