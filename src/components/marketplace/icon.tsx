"use client";

import * as React from "react";
import {
  Croissant,
  UtensilsCrossed,
  Cookie,
  Cake,
  Truck,
  ChefHat,
  ClipboardList,
  Flower2,
  Drama,
  Music,
  Camera,
  Building2,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Croissant,
  UtensilsCrossed,
  Cookie,
  Cake,
  Truck,
  ChefHat,
  ClipboardList,
  Flower2,
  Drama,
  Music,
  Camera,
  Building2,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? UtensilsCrossed;
  return <Icon className={className} />;
}
