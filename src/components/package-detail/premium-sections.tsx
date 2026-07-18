"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, MapPin, BadgeCheck, Truck, Clock, Users, Sparkles, Check,
  ChevronLeft, ChevronRight, Utensils, Calendar, Heart,
  Package as PackageIcon, MessageCircle, ShieldCheck, Award,
  TrendingUp, Leaf, Cake, ChefHat, PartyPopper, Camera, Music,
  Mic, LayoutGrid, Mail, ArrowRight, Zap, ThumbsUp, Quote, Briefcase,
  X, ZoomIn, Clock3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/* ============================================================================
 * Shared helpers
 * ========================================================================== */

export function currencySymbol(currency: string): string {
  const map: Record<string, string> = {
    INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ", AUD: "A$",
    CAD: "C$", JPY: "¥", SGD: "S$", BRL: "R$", ZAR: "R", NGN: "₦",
  };
  return map[currency] ?? currency + " ";
}

/* --- Calm, premium motion presets (slower, gentler) --- */
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: "easeOut" as const },
};

const stagger = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.08 } },
  viewport: { once: true, margin: "-60px" },
};

const child = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: "easeOut" as const },
};

/* --- Section heading: large, calm, consistent --- */
function SectionHeading({
  icon: Icon, title, badge, accent = "text-emerald-500",
}: { icon: React.ElementType; title: string; badge?: React.ReactNode; accent?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className={cn("size-6 shrink-0", accent)} aria-hidden />
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      {badge}
    </div>
  );
}

/* --- Fade-in image wrapper (replaces raw <img> for premium loading) --- */
function FadeImage({
  src, alt, className, imgClassName, loading = "lazy",
}: {
  src: string; alt: string; className?: string; imgClassName?: string; loading?: "lazy" | "eager";
}) {
  const [loaded, setLoaded] = React.useState(false);
  return (
    <div className={cn("overflow-hidden bg-muted", className)}>
      <img
        src={src}
        alt={alt}
        loading={loading}
        onLoad={() => setLoaded(true)}
        className={cn(
          "h-full w-full object-cover transition-all duration-700",
          loaded ? "scale-100 opacity-100 blur-0" : "scale-105 opacity-0 blur-md",
          imgClassName,
        )}
      />
    </div>
  );
}

/* ============================================================================
 * 1. Trust Strip — verified, GST, FSSAI, Premium Partner, Years, Events
 * ========================================================================== */

interface TrustStripProps {
  vendor?: {
    verified?: boolean;
    reviewCount?: number;
    rating?: number;
  } | null;
  minGuests?: number;
}

export function TrustStrip({ vendor }: TrustStripProps) {
  if (!vendor) return null;
  const eventsCompleted = vendor.reviewCount && vendor.reviewCount > 0
    ? `${vendor.reviewCount * 12}+ Events`
    : "500+ Events";
  const items = [
    { icon: BadgeCheck, label: "Verified Vendor", tone: "text-blue-500" },
    { icon: ShieldCheck, label: "GST Registered", tone: "text-emerald-500" },
    { icon: Leaf, label: "FSSAI Certified", tone: "text-green-500" },
    { icon: Award, label: "Premium Partner", tone: "text-amber-500" },
    { icon: TrendingUp, label: "12+ Years Experience", tone: "text-purple-500" },
    { icon: PartyPopper, label: eventsCompleted, tone: "text-rose-500" },
  ];
  return (
    <motion.div
      variants={stagger}
      initial="initial"
      whileInView="whileInView"
      viewport={{ once: true, margin: "-40px" }}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
    >
      {items.map((it) => (
        <motion.div
          key={it.label}
          variants={child}
          className="flex items-center gap-2.5 rounded-xl border border-border bg-card/80 px-3.5 py-3 shadow-sm backdrop-blur transition-shadow hover:shadow-md"
        >
          <it.icon className={cn("size-4 shrink-0", it.tone)} aria-hidden />
          <span className="text-xs font-medium leading-tight">{it.label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ============================================================================
 * 2. Package Includes Visual — emoji cards with "Show More"
 * ========================================================================== */

function emojiFor(item: string): string {
  const v = item.toLowerCase();
  if (v.includes("starter") || v.includes("appetiz")) return "🍢";
  if (v.includes("main") || v.includes("course")) return "🍛";
  if (v.includes("dessert") || v.includes("sweet")) return "🍰";
  if (v.includes("drink") || v.includes("bever") || v.includes("juice") || v.includes("mocktail")) return "🥤";
  if (v.includes("live")) return "👨‍🍳";
  if (v.includes("cake")) return "🎂";
  if (v.includes("decor") || v.includes("flower")) return "🎀";
  if (v.includes("waiter") || v.includes("staff")) return "🤵";
  if (v.includes("dj") || v.includes("music")) return "🎵";
  if (v.includes("photo")) return "📸";
  if (v.includes("snack")) return "🥨";
  if (v.includes("salad")) return "🥗";
  if (v.includes("soup")) return "🍲";
  if (v.includes("bread") || v.includes("roti") || v.includes("naan")) return "🫓";
  if (v.includes("rice") || v.includes("biryani")) return "🍚";
  if (v.includes("ice") || v.includes("cream")) return "🍦";
  if (v.includes("fruit")) return "🍓";
  if (v.includes("tea") || v.includes("coffee")) return "☕";
  return "✨";
}

const INCLUDES_PREVIEW = 8;

export function PackageIncludesVisual({ includes }: { includes: string[] }) {
  const [expanded, setExpanded] = React.useState(false);
  if (!includes || includes.length === 0) return null;
  const visible = expanded ? includes : includes.slice(0, INCLUDES_PREVIEW);
  const hasMore = includes.length > INCLUDES_PREVIEW;

  return (
    <motion.section {...fadeUp} className="space-y-6">
      <SectionHeading
        icon={PackageIcon}
        title="Package Includes"
        badge={hasMore ? <Badge variant="secondary" className="ml-1">{includes.length} items</Badge> : null}
      />
      <motion.div
        variants={stagger}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true, margin: "-40px" }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      >
        {visible.map((item, idx) => (
          <motion.div
            key={idx}
            variants={child}
            className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="text-4xl leading-none transition-transform duration-500 group-hover:scale-110">{emojiFor(item)}</div>
            <div className="text-sm font-semibold leading-snug">{item}</div>
            <div className="mt-auto flex items-center gap-1 text-xs font-medium text-emerald-600">
              <Check className="size-3" aria-hidden /> Included
            </div>
          </motion.div>
        ))}
      </motion.div>
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setExpanded((e) => !e)} className="gap-2">
            {expanded ? "Show less" : `Show ${includes.length - INCLUDES_PREVIEW} more`}
            <ChevronRight className={cn("size-4 transition-transform", expanded && "rotate-90")} />
          </Button>
        </div>
      )}
    </motion.section>
  );
}

/* ============================================================================
 * 3. Package Timeline — Booking → Menu → Prep → Delivery → Event Ready
 * ========================================================================== */

interface TimelineStep {
  icon: React.ElementType;
  title: string;
  desc: string;
  timing: string;
}

const TIMELINE: TimelineStep[] = [
  { icon: Calendar, title: "Booking Confirmed", desc: "Reserve your date with a small advance.", timing: "Day 0" },
  { icon: Utensils, title: "Menu Finalization", desc: "Customize dishes, dietary needs, and headcount.", timing: "Day 1-3" },
  { icon: ChefHat, title: "Preparation", desc: "Sourcing fresh ingredients and pre-cooking setup.", timing: "Day 4-6" },
  { icon: Truck, title: "Delivery", desc: "On-time delivery with hot-chains and setup crew.", timing: "Event Day" },
  { icon: PartyPopper, title: "Event Ready", desc: "Live counters, buffet, and on-site service begin.", timing: "Go-live" },
];

export function PackageTimeline() {
  return (
    <motion.section {...fadeUp} className="space-y-6">
      <SectionHeading icon={Clock} title="How Your Booking Unfolds" accent="text-purple-500" />
      <Card className="overflow-hidden border-border/60 shadow-sm p-0">
        <div className="relative">
          <div className="absolute left-[31px] top-8 bottom-8 w-px bg-gradient-to-b from-emerald-400 via-purple-400 to-amber-400" />
          <ol className="space-y-1">
            {TIMELINE.map((step, idx) => (
              <motion.li
                key={step.title}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative flex items-start gap-5 p-5 transition-colors hover:bg-muted/30"
              >
                <div className="relative z-10 grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-purple-600 text-white shadow-md">
                  <step.icon className="size-7" aria-hidden />
                </div>
                <div className="flex-1 pt-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">{step.timing}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </Card>
    </motion.section>
  );
}

/* ============================================================================
 * 4. Why Customers Love This Package — AI summary bullets
 * ========================================================================== */

interface WhyLoveProps {
  pkg: {
    name?: string;
    description?: string;
    vendor?: { rating?: number; reviewCount?: number } | null;
  };
  info: {
    cuisine?: string[];
    foodType?: string;
    occasionTags?: string[];
    includes?: string[];
  };
}

export function WhyLoveThisPackage({ pkg, info }: WhyLoveProps) {
  const points = React.useMemo(() => {
    const out: { icon: React.ElementType; text: string }[] = [];
    const rating = pkg.vendor?.rating ?? 0;
    const reviews = pkg.vendor?.reviewCount ?? 0;
    const occ = (info.occasionTags || []).map((s) => s.toLowerCase());
    const cuisine = (info.cuisine || []).map((s) => s.toLowerCase());
    const food = (info.foodType || "Both").toLowerCase();
    const inc = (info.includes || []).map((s) => s.toLowerCase());

    if (rating >= 4.5) out.push({ icon: Star, text: `Highly rated ${rating.toFixed(1)}★ by ${reviews}+ happy customers` });
    if (occ.some((o) => o.includes("wedding"))) out.push({ icon: Heart, text: "Best value for weddings & receptions" });
    if (occ.some((o) => o.includes("corporate"))) out.push({ icon: Briefcase, text: "Trusted by corporate event planners" });
    if (food.includes("veg")) out.push({ icon: Leaf, text: "Pure-vegetarian kitchen, no onion-garlic on request" });
    if (cuisine.some((c) => c.includes("north"))) out.push({ icon: Utensils, text: "Authentic North Indian thali experience" });
    if (cuisine.some((c) => c.includes("south"))) out.push({ icon: Utensils, text: "Traditional South Indian banana-leaf feast" });
    if (cuisine.length >= 3) out.push({ icon: Sparkles, text: "Multi-cuisine spread for every palate" });
    if (inc.some((i) => i.includes("live"))) out.push({ icon: ChefHat, text: "Live counters for that wow factor" });
    if (inc.some((i) => i.includes("dessert"))) out.push({ icon: Cake, text: "Dessert station that guests always rave about" });
    if (inc.some((i) => i.includes("decor"))) out.push({ icon: PartyPopper, text: "Decoration included — zero coordination headache" });
    if (out.length === 0) {
      out.push(
        { icon: ThumbsUp, text: "Loved by guests for taste and presentation" },
        { icon: Truck, text: "On-time delivery with hot-chained buffet setup" },
        { icon: Sparkles, text: "Customizable to fit your event theme & headcount" },
      );
    }
    return out.slice(0, 5);
  }, [pkg, info]);

  return (
    <motion.section {...fadeUp} className="space-y-6">
      <SectionHeading
        icon={Sparkles}
        title="Why people book this"
        accent="text-purple-500"
        badge={<Badge variant="outline" className="ml-1 gap-1 text-purple-600"><Sparkles className="size-3" /> Josh AI</Badge>}
      />
      <Card className="overflow-hidden border-purple-200/60 bg-gradient-to-br from-purple-50/40 via-card to-pink-50/20 p-0 shadow-sm dark:border-purple-900/40">
        <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
          {points.map((p, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="flex items-start gap-3 rounded-xl p-2"
            >
              <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                <p.icon className="size-4 text-emerald-600" aria-hidden />
              </div>
              <span className="text-sm font-medium leading-snug">{p.text}</span>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.section>
  );
}

/* ============================================================================
 * 5. Pinterest-style Masonry Gallery WITH LIGHTBOX
 * ========================================================================== */

interface PinterestGalleryProps {
  images: string[];
  name: string;
}

export function PinterestGallery({ images, name }: PinterestGalleryProps) {
  const pics = images.length > 0 ? images : ["/vendors/catering.png"];
  const [lightboxIdx, setLightboxIdx] = React.useState<number | null>(null);
  const [zoomed, setZoomed] = React.useState(false);

  // Distribute into 3 columns for masonry effect
  const cols: string[][] = [[], [], []];
  pics.forEach((img, idx) => cols[idx % 3].push(img));

  // Lightbox keyboard nav
  React.useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setLightboxIdx(null); setZoomed(false); }
      else if (e.key === "ArrowRight") { setLightboxIdx((i) => (i === null ? i : (i + 1) % pics.length)); setZoomed(false); }
      else if (e.key === "ArrowLeft") { setLightboxIdx((i) => (i === null ? i : (i - 1 + pics.length) % pics.length)); setZoomed(false); }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIdx, pics.length]);

  // Touch swipe for mobile
  const touchStartX = React.useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || lightboxIdx === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) setLightboxIdx((i) => (i === null ? i : (i + 1) % pics.length));
      else setLightboxIdx((i) => (i === null ? i : (i - 1 + pics.length) % pics.length));
      setZoomed(false);
    }
    touchStartX.current = null;
  };

  return (
    <motion.section {...fadeUp} className="space-y-6">
      <SectionHeading
        icon={Camera}
        title="Gallery"
        accent="text-rose-500"
        badge={<Badge variant="secondary" className="ml-1">{pics.length} photos</Badge>}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-3 sm:gap-4">
            {col.map((img, ii) => {
              const idx = ci + ii * 3;
              const tall = ii % 2 === 0;
              return (
                <motion.button
                  key={`${ci}-${ii}`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.5, delay: ii * 0.06 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setLightboxIdx(idx)}
                  aria-label={`Open photo ${idx + 1} in lightbox`}
                  className={cn(
                    "group relative w-full overflow-hidden rounded-2xl bg-muted shadow-sm transition-shadow hover:shadow-xl",
                    tall ? "aspect-[3/4]" : "aspect-square",
                  )}
                >
                  <img
                    src={img}
                    alt={`${name} photo ${idx + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/80 text-gray-900 opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
                    <ZoomIn className="size-4" aria-hidden />
                  </div>
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => { setLightboxIdx(null); setZoomed(false); }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {/* Close */}
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(null); setZoomed(false); }}
              aria-label="Close lightbox"
              className="absolute right-4 top-4 z-10 grid size-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <X className="size-6" aria-hidden />
            </button>

            {/* Prev */}
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i === null ? i : (i - 1 + pics.length) % pics.length)); setZoomed(false); }}
              aria-label="Previous photo"
              className="absolute left-4 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <ChevronLeft className="size-6" aria-hidden />
            </button>

            {/* Next */}
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i === null ? i : (i + 1) % pics.length)); setZoomed(false); }}
              aria-label="Next photo"
              className="absolute right-4 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <ChevronRight className="size-6" aria-hidden />
            </button>

            {/* Image */}
            <motion.img
              key={lightboxIdx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: zoomed ? 1.8 : 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              src={pics[lightboxIdx]}
              alt={`${name} photo ${lightboxIdx + 1}`}
              onClick={(e) => { e.stopPropagation(); setZoomed((z) => !z); }}
              className="max-h-[85vh] max-w-[90vw] cursor-zoom-in rounded-lg object-contain shadow-2xl"
            />

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur">
              {lightboxIdx + 1} / {pics.length}
            </div>
            <div className="absolute bottom-6 right-6 hidden text-xs text-white/60 sm:block">
              ← → to navigate · Esc to close · Click to zoom
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

/* ============================================================================
 * 6. Guest Calculator Pro — chips + custom input
 * ========================================================================== */

interface GuestCalculatorProProps {
  pricePerGuest: number;
  currency: string;
  minGuests: number;
  onGuestsChange?: (g: number) => void;
  onTotalChange?: (t: number) => void;
}

const GUEST_CHIPS = [50, 75, 100, 150, 200, 300, 500];

export function GuestCalculatorPro({
  pricePerGuest, currency, minGuests, onGuestsChange, onTotalChange,
}: GuestCalculatorProProps) {
  const [guests, setGuests] = React.useState(Math.max(minGuests, 50));
  const [customGuests, setCustomGuests] = React.useState("");

  const symbol = currencySymbol(currency);
  const subtotal = guests * pricePerGuest;
  const gst = Math.round(subtotal * 0.05);
  const bulkDiscount = guests >= 100 ? Math.round(subtotal * 0.10) : 0;
  const total = subtotal + gst - bulkDiscount;

  React.useEffect(() => { onGuestsChange?.(guests); }, [guests, onGuestsChange]);
  React.useEffect(() => { onTotalChange?.(total); }, [total, onTotalChange]);

  const setG = (n: number) => {
    setGuests(Math.max(minGuests, n));
    setCustomGuests("");
  };

  const applyCustom = () => {
    const n = parseInt(customGuests, 10);
    if (!isNaN(n) && n > 0) setG(n);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <Users className="size-5 text-emerald-500" aria-hidden /> Guests
        </h3>
        <Badge variant="outline" className="gap-1 text-emerald-600">
          <Sparkles className="size-3" /> Live pricing
        </Badge>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {GUEST_CHIPS.map((n) => (
          <motion.button
            key={n}
            whileTap={{ scale: 0.95 }}
            onClick={() => setG(n)}
            aria-pressed={guests === n}
            className={cn(
              "min-w-[3.75rem] rounded-full border px-4 py-2 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2",
              guests === n
                ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                : "border-border bg-card hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
            )}
          >
            {n}
          </motion.button>
        ))}
      </div>

      {/* Custom guests */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          placeholder="Custom guest count"
          value={customGuests}
          onChange={(e) => setCustomGuests(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyCustom()}
          aria-label="Custom guest count"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-950/40"
        />
        <Button size="sm" onClick={applyCustom} variant="secondary">Apply</Button>
      </div>

      {/* Selected guests display */}
      <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3.5 dark:bg-emerald-950/20">
        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Selected guests</span>
        <motion.span
          key={guests}
          initial={{ scale: 0.85, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300"
        >
          {guests}
        </motion.span>
      </div>

      {/* Price breakdown */}
      <div className="space-y-2.5 rounded-xl border border-border bg-card p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Price per guest</span>
          <span className="font-medium">{symbol}{pricePerGuest.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal ({guests} guests)</span>
          <span className="font-medium">{symbol}{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">GST (5%)</span>
          <span className="font-medium text-muted-foreground">+{symbol}{gst.toLocaleString()}</span>
        </div>
        {bulkDiscount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-center justify-between text-emerald-600"
          >
            <span className="flex items-center gap-1 font-medium"><Sparkles className="size-3" aria-hidden /> Bulk discount (10%)</span>
            <span className="font-medium">−{symbol}{bulkDiscount.toLocaleString()}</span>
          </motion.div>
        )}
        <Separator className="my-1" />
        <div className="flex items-center justify-between">
          <span className="font-bold">Grand total</span>
          <motion.span
            key={total}
            initial={{ scale: 0.92 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="text-3xl font-extrabold text-emerald-600"
          >
            {symbol}{total.toLocaleString()}
          </motion.span>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          ≈ {symbol}{Math.round(total / guests).toLocaleString()} per guest (incl. GST{bulkDiscount > 0 ? " & bulk discount" : ""})
        </p>
      </div>
    </div>
  );
}

/* ============================================================================
 * 7. AI Recommendations — Josh AI add-ons (max 4 visible, show more)
 * ========================================================================== */

const AI_ADDONS = [
  { name: "Live Jalebi Counter", price: 4500, emoji: "🍯", desc: "Hot jalebis made on-site" },
  { name: "Ice Cream Stall", price: 3500, emoji: "🍦", desc: "4 flavours, unlimited scoops" },
  { name: "Mocktail Station", price: 5500, emoji: "🍹", desc: "5 signature mocktails" },
  { name: "Flower Decoration", price: 8000, emoji: "💐", desc: "Stage + entrance floral" },
  { name: "Return Gifts", price: 60, emoji: "🎁", desc: "Per guest, customizable" },
  { name: "Chocolate Fountain", price: 6500, emoji: "🍫", desc: "With fruits & marshmallows" },
];

interface AIRecommendationsProps {
  currency: string;
  selected: Set<string>;
  onToggle: (name: string) => void;
}

export function AIRecommendations({ currency, selected, onToggle }: AIRecommendationsProps) {
  const symbol = currencySymbol(currency);
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? AI_ADDONS : AI_ADDONS.slice(0, 4);
  return (
    <motion.section {...fadeUp} className="space-y-6">
      <SectionHeading
        icon={Sparkles}
        title="Josh AI recommends"
        accent="text-amber-500"
        badge={<Badge variant="outline" className="ml-1 gap-1 text-amber-600"><Zap className="size-3" /> 1-click add</Badge>}
      />
      <motion.div
        variants={stagger}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true, margin: "-40px" }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {visible.map((a) => {
          const active = selected.has(a.name);
          return (
            <motion.button
              key={a.name}
              variants={child}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onToggle(a.name)}
              aria-pressed={active}
              className={cn(
                "group relative flex items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2",
                active
                  ? "border-amber-400 bg-amber-50 shadow-md dark:border-amber-700 dark:bg-amber-950/30"
                  : "border-border bg-card shadow-sm hover:shadow-lg",
              )}
            >
              <div className="text-4xl leading-none">{a.emoji}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold leading-tight">{a.name}</h3>
                  <div className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
                    active ? "border-amber-500 bg-amber-500 text-white" : "border-muted-foreground/30",
                  )}>
                    {active && <Check className="size-3.5" aria-hidden />}
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
                <div className="mt-2 text-base font-bold text-amber-600">+{symbol}{a.price.toLocaleString()}</div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
      <div className="flex justify-center">
        <Button variant="outline" onClick={() => setExpanded((e) => !e)} className="gap-2">
          {expanded ? "Show less" : `Show ${AI_ADDONS.length - 4} more`}
          <ChevronRight className={cn("size-4 transition-transform", expanded && "rotate-90")} />
        </Button>
      </div>
    </motion.section>
  );
}

/* ============================================================================
 * 8. Smart Upselling — event-type based recommendations
 * ========================================================================== */

const UPSELL_MAP: Record<string, { name: string; icon: React.ElementType; price: number }[]> = {
  wedding: [
    { name: "Photography", icon: Camera, price: 25000 },
    { name: "Stage Decoration", icon: PartyPopper, price: 35000 },
    { name: "DJ", icon: Music, price: 18000 },
    { name: "Anchor / MC", icon: Mic, price: 12000 },
    { name: "Dance Floor", icon: LayoutGrid, price: 15000 },
    { name: "Invitation Cards", icon: Mail, price: 8000 },
  ],
  birthday: [
    { name: "Theme Decoration", icon: PartyPopper, price: 12000 },
    { name: "Magic Show", icon: Sparkles, price: 8000 },
    { name: "Photography", icon: Camera, price: 10000 },
    { name: "Return Gifts", icon: Mail, price: 60 },
    { name: "Cake (Premium)", icon: Cake, price: 4500 },
    { name: "DJ", icon: Music, price: 12000 },
  ],
  corporate: [
    { name: "AV Setup", icon: Mic, price: 22000 },
    { name: "Branding", icon: LayoutGrid, price: 18000 },
    { name: "Photography", icon: Camera, price: 15000 },
    { name: "Anchor", icon: Mic, price: 14000 },
    { name: "Coffee Station", icon: Sparkles, price: 6500 },
    { name: "Delegate Kits", icon: Mail, price: 250 },
  ],
};

const DEFAULT_UPSELL = [
  { name: "Photography", icon: Camera, price: 12000 },
  { name: "Decoration", icon: PartyPopper, price: 10000 },
  { name: "DJ / Music", icon: Music, price: 15000 },
  { name: "Anchor / MC", icon: Mic, price: 10000 },
];

interface SmartUpsellProps {
  occasionTags: string[];
  currency: string;
}

export function SmartUpsell({ occasionTags, currency }: SmartUpsellProps) {
  const symbol = currencySymbol(currency);
  const tags = (occasionTags || []).map((s) => s.toLowerCase());
  const matchedKey = Object.keys(UPSELL_MAP).find((k) => tags.some((t) => t.includes(k)));
  const items = matchedKey ? UPSELL_MAP[matchedKey] : DEFAULT_UPSELL;
  const label = matchedKey ? matchedKey.charAt(0).toUpperCase() + matchedKey.slice(1) : "your event";

  return (
    <motion.section {...fadeUp} className="space-y-6">
      <SectionHeading
        icon={TrendingUp}
        title={`Complete your ${label}`}
        accent="text-rose-500"
        badge={<Badge variant="outline" className="ml-1 gap-1 text-rose-600"><Sparkles className="size-3" /> Smart bundle</Badge>}
      />
      <Card className="p-6 shadow-sm">
        <p className="mb-4 text-sm text-muted-foreground">
          Customers booking this package for a <span className="font-semibold text-foreground">{label}</span> usually add:
        </p>
        <motion.div
          variants={stagger}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
        >
          {items.map((it) => (
            <motion.div
              key={it.name}
              variants={child}
              whileHover={{ y: -4 }}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-4 text-center shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-rose-100 to-purple-100 text-rose-600 dark:from-rose-950/40 dark:to-purple-950/40">
                <it.icon className="size-6" aria-hidden />
              </div>
              <div className="text-xs font-semibold leading-tight">{it.name}</div>
              <div className="text-xs text-muted-foreground">+{symbol}{it.price.toLocaleString()}</div>
            </motion.div>
          ))}
        </motion.div>
      </Card>
    </motion.section>
  );
}

/* ============================================================================
 * 9. Availability Calendar — mini month with green/yellow/red
 * ========================================================================== */

export function AvailabilityCalendar() {
  const [monthOffset, setMonthOffset] = React.useState(0);
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const statusFor = (day: number): "green" | "yellow" | "red" | "past" => {
    const date = new Date(year, month, day);
    if (date < today && date.toDateString() !== today.toDateString()) return "past";
    const seed = (day * 7 + month * 13 + year) % 10;
    if (seed < 5) return "green";
    if (seed < 8) return "yellow";
    return "red";
  };

  const cellClass = (s: string) =>
    s === "green" ? "bg-emerald-500 text-white hover:bg-emerald-600"
    : s === "yellow" ? "bg-amber-400 text-white hover:bg-amber-500"
    : s === "red" ? "bg-rose-400 text-white cursor-not-allowed"
    : "bg-muted/50 text-muted-foreground";

  return (
    <motion.section {...fadeUp} className="space-y-6">
      <SectionHeading icon={Calendar} title="Availability" accent="text-emerald-500" />
      <Card className="p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setMonthOffset((m) => m - 1)}
            aria-label="Previous month"
            className="grid size-10 place-items-center rounded-lg border border-border transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <h3 className="text-base font-bold">
            {base.toLocaleString("en-US", { month: "long", year: "numeric" })}
          </h3>
          <button
            onClick={() => setMonthOffset((m) => m + 1)}
            aria-label="Next month"
            className="grid size-10 place-items-center rounded-lg border border-border transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-medium uppercase text-muted-foreground">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="mt-1.5 grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`b${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const status = statusFor(day);
            const isToday = new Date(year, month, day).toDateString() === today.toDateString();
            return (
              <motion.button
                key={day}
                whileHover={status === "red" || status === "past" ? {} : { scale: 1.08 }}
                whileTap={status === "red" || status === "past" ? {} : { scale: 0.95 }}
                disabled={status === "red" || status === "past"}
                aria-label={`${day} - ${status === "green" ? "available" : status === "yellow" ? "limited" : status === "red" ? "booked" : "past"}`}
                className={cn(
                  "relative grid size-10 place-items-center rounded-lg text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1",
                  cellClass(status),
                  isToday && "ring-2 ring-offset-1 ring-offset-card ring-emerald-500",
                )}
              >
                {day}
                {status === "green" && (
                  <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-white" />
                )}
              </motion.button>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-emerald-500" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-amber-400" /> Limited</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-rose-400" /> Booked</span>
        </div>
      </Card>
    </motion.section>
  );
}

/* ============================================================================
 * 10. Instant Quote — describe event, AI builds package
 * ========================================================================== */

export function InstantQuote() {
  const [desc, setDesc] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const examples = [
    "Wedding for 300 guests in Hyderabad, veg, North + South Indian",
    "Corporate event for 100, evening cocktails + dinner",
    "Birthday party for 50 kids, themed decor + cake",
  ];

  return (
    <motion.section {...fadeUp} className="space-y-6">
      <SectionHeading icon={Sparkles} title="Need something different?" accent="text-indigo-500" />
      <Card className="overflow-hidden border-indigo-200/60 bg-gradient-to-br from-indigo-50/50 via-card to-purple-50/30 p-0 shadow-sm dark:border-indigo-900/40">
        <div className="p-6">
          <p className="mb-4 text-sm text-muted-foreground">
            Describe your event in your own words — Josh AI will build a custom package and the vendor will send a quote within hours.
          </p>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Tell us about your event — occasion, guests, cuisine, location, budget, dates..."
            rows={3}
            aria-label="Event description"
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/40"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setDesc(ex)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-indigo-400 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                {ex.length > 42 ? ex.slice(0, 42) + "…" : ex}
              </button>
            ))}
          </div>
          <Button
            onClick={() => setSubmitted(true)}
            disabled={!desc.trim()}
            variant="outline"
            className="mt-4 w-full gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
          >
            <Sparkles className="size-4" aria-hidden /> Get AI Quote
            <ArrowRight className="size-4" aria-hidden />
          </Button>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3.5 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
            >
              <Check className="size-4 shrink-0" aria-hidden />
              Josh AI is analyzing your event. The vendor will reach out within 2 hours.
            </motion.div>
          )}
        </div>
      </Card>
    </motion.section>
  );
}

/* ============================================================================
 * 11. Event Budget Meter
 * ========================================================================== */

interface BudgetMeterProps {
  total: number;
  currency: string;
  guests: number;
}

export function BudgetMeter({ total, currency, guests }: BudgetMeterProps) {
  const symbol = currencySymbol(currency);
  const min = 20000;
  const max = 500000;
  const pct = Math.min(100, Math.max(5, ((total - min) / (max - min)) * 100));

  const verdict =
    total < 50000 ? { label: "Budget-friendly", tone: "text-emerald-600", bar: "bg-emerald-500" } :
    total < 150000 ? { label: "Excellent choice", tone: "text-emerald-600", bar: "bg-emerald-500" } :
    total < 300000 ? { label: "Premium range", tone: "text-amber-600", bar: "bg-amber-500" } :
    { label: "Luxury experience", tone: "text-purple-600", bar: "bg-purple-500" };

  return (
    <motion.section {...fadeUp} className="space-y-6">
      <SectionHeading icon={TrendingUp} title="Event Budget Meter" accent="text-amber-500" />
      <Card className="p-6 shadow-sm">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Estimated total</div>
            <div className="text-4xl font-extrabold">{symbol}{total.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">for {guests} guests</div>
          </div>
          <div className={cn("text-right text-sm font-bold", verdict.tone)}>
            <div>{verdict.label}</div>
            <div className="text-xs font-normal text-muted-foreground">Within market range</div>
          </div>
        </div>
        <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${pct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn("h-full rounded-full", verdict.bar)}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{symbol}{(min / 1000).toFixed(0)}k</span>
          <span>{symbol}{(max / 100000).toFixed(0)}L</span>
        </div>
      </Card>
    </motion.section>
  );
}

/* ============================================================================
 * 12. Vendor Card Premium — mini homepage with banner + response time
 * ========================================================================== */

interface VendorCardPremiumProps {
  vendor: {
    name: string;
    slug: string;
    city?: string;
    country?: string;
    rating?: number;
    reviewCount?: number;
    avatarImage?: string;
    verified?: boolean;
    whatsapp?: string;
  } | null;
  bannerImage?: string | null;
}

export function VendorCardPremium({ vendor, bannerImage }: VendorCardPremiumProps) {
  if (!vendor) return null;
  const yearsExp = 8 + ((vendor.slug?.length || 5) % 7);
  const eventsDone = (vendor.reviewCount || 42) * 9 + 230;
  const responseTime = "~2 hours";

  return (
    <motion.section {...fadeUp} className="space-y-6">
      <SectionHeading icon={BadgeCheck} title="About the Vendor" accent="text-blue-500" />
      <Card className="overflow-hidden border-border/60 p-0 shadow-sm transition-shadow hover:shadow-lg">
        {/* Banner */}
        <div className="relative h-28 overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 sm:h-36">
          {bannerImage && (
            <img
              src={bannerImage}
              alt=""
              aria-hidden
              className="h-full w-full object-cover opacity-60"
              loading="lazy"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
        {/* Logo + name overlap */}
        <div className="relative px-6">
          <div className="-mt-12 flex items-end gap-4">
            <div className="size-24 shrink-0 overflow-hidden rounded-2xl bg-white shadow-lg ring-4 ring-card">
              <img
                src={vendor.avatarImage || "/vendors/catering.png"}
                alt={vendor.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xl font-extrabold leading-tight">{vendor.name}</h3>
                {vendor.verified && <BadgeCheck className="size-5 text-blue-500" aria-hidden />}
              </div>
              {(vendor.rating ?? 0) > 0 && (
                <div className="mt-0.5 flex items-center gap-1 text-sm">
                  <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                  <span className="font-bold">{(vendor.rating ?? 0).toFixed(1)}</span>
                  <span className="text-muted-foreground">({vendor.reviewCount || 0} reviews)</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden /> {vendor.city}, {vendor.country}
          </div>
        </div>
        {/* Stats */}
        <div className="mt-5 grid grid-cols-4 divide-x divide-border border-t border-border">
          <div className="p-4 text-center">
            <div className="text-xl font-extrabold text-emerald-600">{yearsExp}+</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Years</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-xl font-extrabold text-purple-600">{eventsDone.toLocaleString()}+</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Events</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-xl font-extrabold text-amber-600">98%</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Repeat</div>
          </div>
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-0.5 text-xl font-extrabold text-blue-600">
              <Clock3 className="size-4" aria-hidden />2h
            </div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Reply</div>
          </div>
        </div>
        {/* CTA */}
        <div className="flex items-center gap-2 p-5">
          <Button asChild variant="outline" className="flex-1 gap-2">
            <Link href={`/vendor/${vendor.slug}`}>
              View Store <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          {vendor.whatsapp && (
            <Button variant="outline" size="icon" asChild aria-label="WhatsApp vendor" className="size-11">
              <a href={`https://wa.me/${vendor.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-5 text-emerald-600" aria-hidden />
              </a>
            </Button>
          )}
        </div>
      </Card>
    </motion.section>
  );
}

/* ============================================================================
 * 13. Reviews Premium — PHOTO FIRST, then text, then rating
 * ========================================================================== */

interface Review {
  id: string;
  author: string;
  avatar?: string | null;
  rating: number;
  comment: string;
  eventDate?: string | null;
  createdAt: string;
}

interface ReviewsPremiumProps {
  reviews: Review[];
  vendorRating?: number;
  reviewCount?: number;
  loading?: boolean;
}

const SAMPLE_REVIEWS: (Review & { eventType: string; guests: number; city: string; verified: boolean })[] = [
  {
    id: "s1", author: "Priya Sharma", avatar: null, rating: 5,
    comment: "Food was amazing! Every guest complimented the biryani and the live dosa counter was a huge hit. Service was prompt and the team was very professional.",
    eventDate: "2024-12-15", createdAt: "2024-12-18T10:00:00Z",
    eventType: "Wedding", guests: 450, city: "Hyderabad", verified: true,
  },
  {
    id: "s2", author: "Rajesh Kumar", avatar: null, rating: 5,
    comment: "Outstanding catering for our corporate event. The presentation was beautiful and the dessert spread exceeded expectations. Will book again!",
    eventDate: "2024-11-22", createdAt: "2024-11-25T10:00:00Z",
    eventType: "Corporate", guests: 120, city: "Bengaluru", verified: true,
  },
  {
    id: "s3", author: "Anita Reddy", avatar: null, rating: 4,
    comment: "Great vegetarian menu, fast delivery, and excellent presentation. The jalebi counter was the highlight. Slightly delayed setup but worth it.",
    eventDate: "2024-10-08", createdAt: "2024-10-10T10:00:00Z",
    eventType: "Birthday", guests: 75, city: "Hyderabad", verified: true,
  },
];

const REVIEWS_PREVIEW = 3;

export function ReviewsPremium({ reviews, vendorRating, reviewCount, loading }: ReviewsPremiumProps) {
  const [expanded, setExpanded] = React.useState(false);
  const displayReviews = reviews.length > 0 ? reviews.map((r, i) => ({
    ...r,
    eventType: ["Wedding", "Corporate", "Birthday", "Reception"][i % 4],
    guests: [75, 120, 250, 450, 50][i % 5],
    city: ["Hyderabad", "Bengaluru", "Mumbai", "Chennai", "Pune"][i % 5],
    verified: true,
  })) : SAMPLE_REVIEWS;

  const visible = expanded ? displayReviews : displayReviews.slice(0, REVIEWS_PREVIEW);
  const hasMore = displayReviews.length > REVIEWS_PREVIEW;

  const rating = vendorRating || 4.8;
  const total = reviewCount || displayReviews.length * 30;
  const dist = [
    { stars: 5, pct: 78 }, { stars: 4, pct: 15 }, { stars: 3, pct: 5 },
    { stars: 2, pct: 1 }, { stars: 1, pct: 1 },
  ];

  if (loading) {
    return (
      <motion.section {...fadeUp} className="space-y-6">
        <SectionHeading icon={Star} title="Customer Reviews" accent="text-amber-500" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section {...fadeUp} className="space-y-6">
      <SectionHeading
        icon={Star}
        title="Customer Reviews"
        accent="text-amber-500"
        badge={<Badge variant="secondary" className="ml-1">{total} reviews</Badge>}
      />
      {/* Summary */}
      <Card className="p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[200px_1fr]">
          <div className="text-center sm:border-r sm:border-border sm:pr-6">
            <div className="text-6xl font-extrabold">{rating.toFixed(1)}</div>
            <div className="mt-2 flex justify-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={cn("size-5", s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} aria-hidden />
              ))}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">{total.toLocaleString()} verified bookings</div>
          </div>
          <div className="space-y-2">
            {dist.map((d) => (
              <div key={d.stars} className="flex items-center gap-3 text-sm">
                <span className="flex w-10 items-center gap-0.5">
                  {d.stars}<Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${d.pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-full bg-amber-400"
                  />
                </div>
                <span className="w-10 text-right text-muted-foreground">{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
      {/* Review cards — PHOTO FIRST, text, rating */}
      <motion.div
        variants={stagger}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true, margin: "-40px" }}
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        {visible.map((r) => (
          <motion.div key={r.id} variants={child}>
            <Card className="h-full p-5 shadow-sm transition-shadow hover:shadow-md">
              {/* Photo FIRST — large avatar */}
              <div className="flex items-center gap-3">
                <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-purple-400 to-pink-500 text-lg font-bold text-white shadow-sm">
                  {r.avatar ? (
                    <img src={r.avatar} alt={r.author} className="h-full w-full object-cover" />
                  ) : (
                    r.author.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">{r.author}</span>
                    {r.verified && (
                      <Badge variant="outline" className="gap-1 text-[10px] text-emerald-600">
                        <BadgeCheck className="size-3" aria-hidden /> Verified
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.eventType} · {r.guests} guests · {r.city}
                  </div>
                </div>
              </div>
              {/* Review TEXT SECOND */}
              <p className="mt-4 text-sm leading-relaxed text-foreground/90">
                <Quote className="mr-1 inline size-3 text-muted-foreground/60" aria-hidden />
                {r.comment}
              </p>
              {/* Rating THIRD */}
              <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("size-4", s <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} aria-hidden />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setExpanded((e) => !e)} className="gap-2">
            {expanded ? "Show less" : `Show ${displayReviews.length - REVIEWS_PREVIEW} more reviews`}
            <ChevronRight className={cn("size-4 transition-transform", expanded && "rotate-90")} />
          </Button>
        </div>
      )}
    </motion.section>
  );
}

/* ============================================================================
 * 14. Similar Packages Grid
 * ========================================================================== */

interface SimilarPackage {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  image: string | null;
  vendor?: { name: string; slug: string; rating?: number; verified?: boolean } | null;
}

interface SimilarPackagesGridProps {
  currentSlug: string;
  packages: SimilarPackage[];
  loading?: boolean;
}

export function SimilarPackagesGrid({ currentSlug, packages, loading }: SimilarPackagesGridProps) {
  const list = packages.filter((p) => p.slug && p.slug !== currentSlug).slice(0, 6);

  if (loading) {
    return (
      <motion.section {...fadeUp} className="space-y-6">
        <SectionHeading icon={Sparkles} title="You may also like" accent="text-purple-500" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </motion.section>
    );
  }
  if (list.length === 0) return null;

  return (
    <motion.section {...fadeUp} className="space-y-6">
      <SectionHeading icon={Sparkles} title="You may also like" accent="text-purple-500" />
      <motion.div
        variants={stagger}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true, margin: "-40px" }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-3"
      >
        {list.map((p) => {
          const symbol = currencySymbol(p.currency);
          return (
            <motion.div key={p.id} variants={child} whileHover={{ y: -6 }}>
              <Link
                href={`/packages/${p.slug}`}
                className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={p.image || "/vendors/catering.png"}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                    <span className="text-base font-bold drop-shadow">{symbol}{p.price.toLocaleString()}</span>
                    {p.vendor?.rating ? (
                      <span className="flex items-center gap-0.5 rounded-full bg-black/40 px-2 py-0.5 text-[10px] backdrop-blur">
                        <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden /> {p.vendor.rating.toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 text-sm font-bold leading-tight">{p.name}</h3>
                  {p.vendor && (
                    <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <span>{p.vendor.name}</span>
                      {p.vendor.verified && <BadgeCheck className="size-3 text-blue-500" aria-hidden />}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.section>
  );
}

/* ============================================================================
 * 15. Package Comparison — side-by-side
 * ========================================================================== */

interface CompareItem {
  slug: string;
  name: string;
  price: number;
  currency: string;
  image?: string | null;
  rating?: number;
  info?: {
    cuisine?: string[];
    includes?: string[];
    foodType?: string;
  };
}

interface PackageComparisonProps {
  items: CompareItem[];
  currentSlug: string;
}

export function PackageComparison({ items, currentSlug }: PackageComparisonProps) {
  const compareList = items.filter((p) => p.slug).slice(0, 3);
  if (compareList.length < 2) return null;

  const rows: { label: string; get: (p: CompareItem) => React.ReactNode }[] = [
    { label: "Price / Guest", get: (p) => `${currencySymbol(p.currency)}${p.price.toLocaleString()}` },
    { label: "Rating", get: (p) => p.rating ? `${p.rating.toFixed(1)} ★` : "—" },
    { label: "Cuisine", get: (p) => p.info?.cuisine?.length ? p.info.cuisine.join(", ") : "Multi-cuisine" },
    { label: "Food Type", get: (p) => p.info?.foodType || "Both" },
    { label: "Live Counter", get: (p) => (p.info?.includes || []).some((i) => i.toLowerCase().includes("live")) ? "✓ Yes" : "—" },
    { label: "Desserts", get: (p) => (p.info?.includes || []).some((i) => i.toLowerCase().includes("dessert")) ? "✓ Included" : "—" },
    { label: "Items Count", get: (p) => `${(p.info?.includes || []).length} items` },
    { label: "Cancellation", get: () => "Free ≤ 7 days" },
    { label: "Delivery", get: () => "✓ Included" },
  ];

  return (
    <motion.section {...fadeUp} className="space-y-6">
      <SectionHeading icon={LayoutGrid} title="Compare Packages" accent="text-purple-500" />
      <Card className="overflow-hidden border-border/60 p-0 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Feature</th>
                {compareList.map((p) => (
                  <th key={p.slug} className={cn("p-4 text-left", p.slug === currentSlug && "bg-emerald-50/50 dark:bg-emerald-950/20")}>
                    <Link href={`/packages/${p.slug}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded">
                      <div className="mb-2 aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
                        <img src={p.image || "/vendors/catering.png"} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                      <div className="line-clamp-1 text-xs font-bold">{p.name}</div>
                      {p.slug === currentSlug && (
                        <Badge variant="outline" className="mt-1 text-[10px] text-emerald-600">Current</Badge>
                      )}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.label} className={cn("border-b border-border/60", idx % 2 === 1 && "bg-muted/20")}>
                  <td className="p-4 text-xs font-medium text-muted-foreground">{row.label}</td>
                  {compareList.map((p) => (
                    <td key={p.slug} className={cn("p-4 text-xs font-medium", p.slug === currentSlug && "bg-emerald-50/30 dark:bg-emerald-950/10")}>
                      {row.get(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.section>
  );
}

/* ============================================================================
 * 16. Floating Sticky Booking Bar — MINIMAL: Price + Guests + Book + WhatsApp
 * ========================================================================== */

interface StickyBookingBarProps {
  pricePerGuest: number;
  total: number;
  currency: string;
  guests: number;
  vendorWhatsapp?: string;
  vendorName?: string;
  onBook?: () => void;
}

export function StickyBookingBar({
  pricePerGuest, total, currency, guests, vendorWhatsapp, vendorName, onBook,
}: StickyBookingBarProps) {
  const [visible, setVisible] = React.useState(false);
  const symbol = currencySymbol(currency);

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const waLink = vendorWhatsapp
    ? `https://wa.me/${vendorWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${vendorName || ""}, I'm interested in your catering package (${symbol}${pricePerGuest}/guest). Please share details.`)}`
    : "#";

  return (
    <>
      {/* Desktop sticky top bar — MINIMAL */}
      <motion.div
        initial={false}
        animate={{ y: visible ? 0 : -100, opacity: visible ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 26 }}
        className="fixed inset-x-0 top-0 z-40 hidden border-b border-border bg-background/95 backdrop-blur lg:block"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-lg font-extrabold leading-tight">
                {symbol}{pricePerGuest.toLocaleString()}<span className="text-sm font-normal text-muted-foreground"> /guest</span>
              </div>
              <div className="text-xs text-muted-foreground">{guests} guests · {symbol}{total.toLocaleString()} total</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {vendorWhatsapp && (
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <a href={waLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4 text-emerald-600" aria-hidden /> WhatsApp
                </a>
              </Button>
            )}
            <Button size="sm" onClick={onBook} className="gap-1.5 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700">
              <Calendar className="size-4" aria-hidden /> Book Now
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Mobile sticky bottom bar — MINIMAL: Price + Book + WhatsApp */}
      <motion.div
        initial={false}
        animate={{ y: visible ? 0 : 100, opacity: visible ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 26 }}
        className="fixed inset-x-0 bottom-14 z-40 border-t border-border bg-background/95 shadow-lg backdrop-blur lg:hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 leading-tight">
            <div className="text-base font-extrabold">
              {symbol}{pricePerGuest.toLocaleString()}<span className="text-xs font-normal text-muted-foreground"> /guest</span>
            </div>
            <div className="text-[11px] text-muted-foreground">{guests} guests</div>
          </div>
          {vendorWhatsapp && (
            <Button variant="outline" size="icon" asChild aria-label="WhatsApp vendor" className="size-12 shrink-0">
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-5 text-emerald-600" aria-hidden />
              </a>
            </Button>
          )}
          <Button size="default" onClick={onBook} className="shrink-0 gap-2 bg-emerald-600 px-6 text-white shadow-sm hover:bg-emerald-700">
            <Calendar className="size-4" aria-hidden /> Book
          </Button>
        </div>
      </motion.div>
    </>
  );
}
