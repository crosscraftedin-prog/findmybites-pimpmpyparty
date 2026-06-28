"use client";

import * as React from "react";
import { Search, ArrowRight } from "lucide-react";

/**
 * Client-side search bar for the SEO landing hero. Scrolls to the #vendors
 * section on submit. Kept as a client component so the parent page can stay
 * a server component (required for SSR + static prerendering).
 */
export function HeroSearchBar({
  placeholder,
  ecoColor,
}: {
  placeholder: string;
  ecoColor: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        document.getElementById("vendors")?.scrollIntoView({ behavior: "smooth" });
      }}
      className="mt-7 flex flex-col gap-3 sm:flex-row sm:max-w-xl"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-black/40" />
        <input
          type="text"
          placeholder={placeholder}
          className="h-14 w-full rounded-full border border-black/15 bg-white pl-12 pr-4 text-sm font-medium text-black shadow-sm placeholder:text-black/40 focus:outline-none focus:ring-2"
          style={{ ["--tw-ring-color" as any]: `${ecoColor}55` }}
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-14 items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
        style={{ background: ecoColor }}
      >
        Find Vendors
        <ArrowRight className="size-4" />
      </button>
    </form>
  );
}
