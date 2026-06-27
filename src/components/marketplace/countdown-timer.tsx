"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  endsAt: string;
  className?: string;
  variant?: "default" | "flash";
}

/**
 * Live countdown timer for limited time offers and flash deals.
 * Updates every second. Shows "Offer ended" when expired.
 */
export function CountdownTimer({ endsAt, className, variant = "default" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = React.useState("");
  const [expired, setExpired] = React.useState(false);

  React.useEffect(() => {
    const update = () => {
      const now = Date.now();
      const end = new Date(endsAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Offer ended");
        setExpired(true);
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(`${days}d ${hours % 24}h ${mins}m`);
      } else {
        setTimeLeft(`${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (expired) {
    return (
      <div className={cn("text-[10px] font-medium text-muted-foreground", className)}>
        ⏱️ Offer ended
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-bold",
        variant === "flash" ? "text-red-600" : "text-orange-600",
        className
      )}
    >
      ⏱️ Ends in: <strong>{timeLeft}</strong>
    </div>
  );
}
