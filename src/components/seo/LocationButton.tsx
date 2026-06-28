"use client";

import { Navigation } from "lucide-react";

/**
 * Client-side location button — asks for geolocation permission then
 * redirects to /near-me. Kept separate so the parent near-me page can
 * stay a server component (for SEO).
 */
export function LocationButton({
  ecoColor,
  label = "Use my location",
}: {
  ecoColor: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof navigator !== "undefined" && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            () => {
              window.location.href = "/near-me";
            },
            () => {
              window.location.href = "/near-me";
            }
          );
        } else {
          window.location.href = "/near-me";
        }
      }}
      className="inline-flex h-14 items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
      style={{ background: ecoColor }}
    >
      <Navigation className="size-4" />
      {label}
    </button>
  );
}
