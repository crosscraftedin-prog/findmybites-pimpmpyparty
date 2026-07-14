"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Calendar, MessageCircle, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * StickyBookingBar — conversion-focused persistent booking bar.
 *
 * Desktop: slides down from the top when the user scrolls past the hero.
 * Mobile:  slides up from the bottom (above the global mobile nav if any).
 *
 * Contains ONLY: Price · Guests (optional) · Rating (optional) · Book Now · WhatsApp.
 * One primary CTA color (emerald). Everything else is secondary.
 *
 * Per the conversion-optimization brief: "Book Now should always be visible."
 */

export interface StickyBookingBarProps {
  /** Display price (already formatted with symbol). */
  priceLabel: string;
  /** Optional sub-label under the price, e.g. "50 guests · ₹31,448 total". */
  subLabel?: string;
  /** Optional rating to show trust without scrolling. */
  rating?: number;
  reviewCount?: number;
  /** WhatsApp link (full https://wa.me/... URL). If omitted, the button is hidden. */
  whatsappLink?: string;
  /** Called when the primary Book Now button is clicked. */
  onBook?: () => void;
  /** Label on the Book button. Default "Book Now". */
  bookLabel?: string;
}

export function StickyBookingBar({
  priceLabel,
  subLabel,
  rating,
  reviewCount,
  whatsappLink,
  onBook,
  bookLabel = "Book Now",
}: StickyBookingBarProps) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* ── Desktop sticky top bar ── */}
      <motion.div
        initial={false}
        animate={{ y: visible ? 0 : -100, opacity: visible ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 28 }}
        className="fixed inset-x-0 top-0 z-40 hidden border-b border-border bg-background/95 backdrop-blur lg:block"
        role="region"
        aria-label="Quick booking bar"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="leading-tight">
              <div className="text-lg font-extrabold leading-tight">{priceLabel}</div>
              {subLabel && <div className="text-xs text-muted-foreground">{subLabel}</div>}
            </div>
            {rating != null && rating > 0 && (
              <div className="hidden items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 xl:flex">
                <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
                {rating.toFixed(1)}
                {reviewCount != null && <span className="font-normal opacity-80">({reviewCount})</span>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {whatsappLink && (
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4 text-emerald-600" aria-hidden /> WhatsApp
                </a>
              </Button>
            )}
            <Button
              size="sm"
              onClick={onBook}
              className="gap-1.5 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
            >
              <Calendar className="size-4" aria-hidden /> {bookLabel}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── Mobile sticky bottom bar ── */}
      <motion.div
        initial={false}
        animate={{ y: visible ? 0 : 120, opacity: visible ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 28 }}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 shadow-lg backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        role="region"
        aria-label="Quick booking bar"
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 leading-tight">
            <div className="text-base font-extrabold">{priceLabel}</div>
            {subLabel && <div className="text-[11px] text-muted-foreground">{subLabel}</div>}
          </div>
          {whatsappLink && (
            <Button
              variant="outline"
              size="icon"
              asChild
              aria-label="Chat on WhatsApp"
              className="size-12 shrink-0"
            >
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-5 text-emerald-600" aria-hidden />
              </a>
            </Button>
          )}
          <Button
            size="default"
            onClick={onBook}
            className="shrink-0 gap-2 bg-emerald-600 px-6 text-white shadow-sm hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
          >
            <Calendar className="size-4" aria-hidden /> {bookLabel}
          </Button>
        </div>
      </motion.div>
    </>
  );
}
