import type { Ecosystem } from "./types";

export interface CategoryDef {
  id: string;
  ecosystem: Ecosystem;
  label: string;
  description: string;
  icon: string; // lucide icon name
  image: string;
  accent: string; // tailwind gradient classes
}

export const CATEGORIES: CategoryDef[] = [
  // ---- FindMyBites (Food) ----
  {
    id: "bakers",
    ecosystem: "FINDMYBITES",
    label: "Bakers & Bakeries",
    description: "Artisan breads, pastries, and baked goods crafted fresh daily.",
    icon: "Croissant",
    image: "/vendors/baker.png",
    accent: "from-amber-400 to-orange-500",
  },
  {
    id: "catering",
    ecosystem: "FINDMYBITES",
    label: "Catering Services",
    description: "Full-service catering for weddings, corporate events, and gatherings.",
    icon: "UtensilsCrossed",
    image: "/vendors/catering.png",
    accent: "from-rose-400 to-red-500",
  },
  {
    id: "desserts",
    ecosystem: "FINDMYBITES",
    label: "Dessert Specialists",
    description: "Chocolates, pastries, macarons, and sweet tables for every occasion.",
    icon: "Cookie",
    image: "/vendors/desserts.png",
    accent: "from-pink-400 to-fuchsia-500",
  },
  {
    id: "cake-artists",
    ecosystem: "FINDMYBITES",
    label: "Cake Artists",
    description: "Sculptural, custom celebration cakes that taste as stunning as they look.",
    icon: "Cake",
    image: "/vendors/cake-artist.png",
    accent: "from-orange-400 to-rose-500",
  },
  {
    id: "food-trucks",
    ecosystem: "FINDMYBITES",
    label: "Food Trucks",
    description: "Mobile kitchens serving street food, BBQ, tacos, and global bites.",
    icon: "Truck",
    image: "/vendors/food-truck.png",
    accent: "from-yellow-400 to-amber-500",
  },
  {
    id: "private-chefs",
    ecosystem: "FINDMYBITES",
    label: "Private Chefs",
    description: "Personal chefs bringing fine dining to your home or venue.",
    icon: "ChefHat",
    image: "/vendors/private-chef.png",
    accent: "from-lime-400 to-emerald-500",
  },
  // ---- PimpMyParty (Events) ----
  {
    id: "event-planners",
    ecosystem: "PIMPMYPARTY",
    label: "Event Planners",
    description: "End-to-end planning for weddings, milestones, and brand activations.",
    icon: "ClipboardList",
    image: "/vendors/event-planner.png",
    accent: "from-fuchsia-400 to-purple-500",
  },
  {
    id: "decorators",
    ecosystem: "PIMPMYPARTY",
    label: "Decorators & Stylists",
    description: "Balloon art, florals, tablescapes, and immersive themed decor.",
    icon: "Flower2",
    image: "/vendors/decorator.png",
    accent: "from-purple-400 to-pink-500",
  },
  {
    id: "entertainers",
    ecosystem: "PIMPMYPARTY",
    label: "Entertainers",
    description: "Magicians, clowns, mascots, performers, and live acts for all ages.",
    icon: "Drama",
    image: "/vendors/entertainer.png",
    accent: "from-violet-400 to-fuchsia-500",
  },
  {
    id: "djs",
    ecosystem: "PIMPMYPARTY",
    label: "DJs & Music",
    description: "DJs, live bands, and sound engineers to keep your party moving.",
    icon: "Music",
    image: "/vendors/dj.png",
    accent: "from-fuchsia-500 to-rose-500",
  },
  {
    id: "photographers",
    ecosystem: "PIMPMYPARTY",
    label: "Photographers & Video",
    description: "Capturing every moment with photo, video, and drone services.",
    icon: "Camera",
    image: "/vendors/photographer.png",
    accent: "from-pink-400 to-purple-500",
  },
  {
    id: "venues",
    ecosystem: "PIMPMYPARTY",
    label: "Venues & Spaces",
    description: "Banquet halls, rooftops, gardens, and unique event spaces worldwide.",
    icon: "Building2",
    image: "/vendors/venue.png",
    accent: "from-purple-500 to-indigo-500",
  },
];

export function categoriesFor(ecosystem: Ecosystem): CategoryDef[] {
  return CATEGORIES.filter((c) => c.ecosystem === ecosystem);
}

export function getCategory(id: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export const CONTINENTS = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania",
  "Middle East",
] as const;

export const PRICE_RANGES = [
  { id: "$", label: "$ — Affordable", description: "Budget-friendly" },
  { id: "$$", label: "$$ — Moderate", description: "Mid-range pricing" },
  { id: "$$$", label: "$$$ — Premium", description: "Higher-end" },
  { id: "$$$$", label: "$$$$ — Luxury", description: "Top-tier luxury" },
] as const;

export const SORT_OPTIONS = [
  { id: "featured", label: "Featured first" },
  { id: "rating", label: "Top rated" },
  { id: "reviews", label: "Most reviewed" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "newest", label: "Newest" },
] as const;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  AED: "د.إ",
  AUD: "A$",
  CAD: "C$",
  JPY: "¥",
  SGD: "S$",
  BRL: "R$",
  ZAR: "R",
  NGN: "₦",
};

export const ECOSYSTEM_META: Record<
  Ecosystem,
  { label: string; short: string; tagline: string; gradient: string }
> = {
  FINDMYBITES: {
    label: "FindMyBites",
    short: "Food",
    tagline: "Discover exceptional food artisans, bakers & caterers across the globe.",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
  },
  PIMPMYPARTY: {
    label: "PimpMyParty",
    short: "Events",
    tagline: "Find the planners, decorators & entertainers to throw an unforgettable party.",
    gradient: "from-fuchsia-500 via-purple-500 to-pink-500",
  },
};
