"use client";

import * as React from "react";
import { UtensilsCrossed, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarketplace } from "@/lib/store";
import type { Ecosystem } from "@/lib/types";

interface EcosystemToggleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EcosystemToggle({
  className,
  size = "md",
}: EcosystemToggleProps) {
  const ecosystem = useMarketplace((s) => s.ecosystem);
  const setEcosystem = useMarketplace((s) => s.setEcosystem);

  const opts: {
    id: Ecosystem;
    label: string;
    short: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "FINDMYBITES",
      label: "FindMyBites",
      short: "Food",
      icon: <UtensilsCrossed className="size-3.5" />,
    },
    {
      id: "PIMPMYPARTY",
      label: "PimpMyParty",
      short: "Events",
      icon: <PartyPopper className="size-3.5" />,
    },
  ];

  const sizes = {
    sm: "h-8 text-xs",
    md: "h-9 text-sm",
    lg: "h-11 text-base",
  };

  return (
    <div
      role="tablist"
      aria-label="Switch marketplace ecosystem"
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-muted/60 p-1",
        className
      )}
    >
      {opts.map((opt) => {
        const active = ecosystem === opt.id;
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={active}
            onClick={() => setEcosystem(opt.id)}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-full font-semibold transition-all",
              sizes[size],
              "px-3 sm:px-4",
              active
                ? "bg-brand text-brand-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.icon}
            <span className="hidden sm:inline">{opt.label}</span>
            <span className="sm:hidden">{opt.short}</span>
          </button>
        );
      })}
    </div>
  );
}
