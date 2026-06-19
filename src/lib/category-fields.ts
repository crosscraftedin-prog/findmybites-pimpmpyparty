/**
 * Category-specific product/package field configurations.
 * Each vendor category gets its own set of fields tailored to what that
 * business type actually sells — bakers have egg/eggless + shape, DJs have
 * hours + equipment, photographers have hours + deliverables, etc.
 */

export interface CategoryFieldConfig {
  /** display name for "product" vs "package" vs "service" */
  noun: string;
  /** product type options for the dropdown */
  types: string[];
  /** which field groups to show */
  show: {
    sizes: boolean;
    flavours: boolean;
    weight: boolean;
    prepTime: boolean;
    servings: boolean;
    shape: boolean;
    eggless: boolean;
    minGuests: boolean;
    pricePerHead: boolean;
    delivery: boolean;
    pickup: boolean;
    sameDay: boolean;
    customOrder: boolean;
    inventory: boolean;
    pricingTiers: boolean;
    availability: boolean;
    seo: boolean;
  };
  /** category-specific extra fields (label → placeholder) */
  extraFields: { key: string; label: string; placeholder: string }[];
}

const ALL_OFF = {
  sizes: false, flavours: false, weight: false, prepTime: false,
  servings: false, shape: false, eggless: false,
  minGuests: false, pricePerHead: false,
  delivery: true, pickup: true, sameDay: true, customOrder: true,
  inventory: false, pricingTiers: false, availability: false, seo: true,
};

export const CATEGORY_FIELDS: Record<string, CategoryFieldConfig> = {
  // ── FindMyBites ──
  bakers: {
    noun: "Product",
    types: ["Bread", "Loaf", "Pastry", "Viennoiserie", "Bagel", "Roll", "Other"],
    show: {
      ...ALL_OFF,
      sizes: true, weight: true, prepTime: true, servings: true,
      inventory: true, pricingTiers: true,
    },
    extraFields: [
      { key: "flourType", label: "Flour type", placeholder: "Whole wheat, all-purpose, sourdough starter" },
    ],
  },
  "cake-artists": {
    noun: "Cake",
    types: ["Wedding Cake", "Birthday Cake", "Custom Cake", "Sculptural Cake", "Cupcake Box", "Other"],
    show: {
      ...ALL_OFF,
      sizes: true, flavours: true, weight: true, prepTime: true,
      servings: true, shape: true, eggless: true, inventory: true, pricingTiers: true,
    },
    extraFields: [
      { key: "tiers", label: "Tiers", placeholder: "1, 2, 3, 4+" },
      { key: "icingType", label: "Icing type", placeholder: "Fondant, buttercream, ganache" },
    ],
  },
  desserts: {
    noun: "Dessert",
    types: ["Macarons", "Chocolates", "Tiramisu", "Pudding", "Dessert Table", "Ice Cream", "Other"],
    show: {
      ...ALL_OFF,
      sizes: true, flavours: true, weight: true, prepTime: true,
      servings: true, eggless: true, inventory: true, pricingTiers: true,
    },
    extraFields: [],
  },
  catering: {
    noun: "Menu",
    types: ["Wedding Menu", "Corporate Buffet", "Private Dinner", "BBQ Package", "Canape Package", "Other"],
    show: {
      ...ALL_OFF,
      minGuests: true, pricePerHead: true, servings: true, prepTime: true,
      pricingTiers: true,
    },
    extraFields: [
      { key: "cuisine", label: "Cuisine type", placeholder: "Indian, Italian, Mexican, Fusion" },
      { key: "vegOption", label: "Veg / Non-veg", placeholder: "Veg, Non-veg, Both" },
    ],
  },
  "food-trucks": {
    noun: "Menu Item",
    types: ["Taco", "Burger", "Pizza", "BBQ", "Asian", "Dessert", "Other"],
    show: {
      ...ALL_OFF,
      sizes: true, flavours: true, prepTime: true, servings: true,
      inventory: true,
    },
    extraFields: [
      { key: "minimumOrder", label: "Minimum order", placeholder: "10 plates" },
    ],
  },
  "private-chefs": {
    noun: "Menu",
    types: ["Tasting Menu", "Dinner Party", "BBQ Experience", "Cooking Class", "Other"],
    show: {
      ...ALL_OFF,
      minGuests: true, pricePerHead: true, prepTime: true, servings: true,
      pricingTiers: true,
    },
    extraFields: [
      { key: "courses", label: "Courses", placeholder: "5, 7, 9" },
      { key: "cuisine", label: "Cuisine", placeholder: "French, Japanese, Modern Indian" },
    ],
  },

  // ── PimpMyParty ──
  "event-planners": {
    noun: "Package",
    types: ["Full Wedding Planning", "Partial Planning", "Day-of Coordination", "Corporate Event", "Other"],
    show: {
      ...ALL_OFF,
      minGuests: true, pricingTiers: true,
    },
    extraFields: [
      { key: "duration", label: "Duration", placeholder: "Full day, multi-day" },
      { key: "services", label: "Includes", placeholder: "Venue scouting, vendor management, timeline" },
    ],
  },
  decorators: {
    noun: "Package",
    types: ["Balloon Arch", "Floral Design", "Stage Setup", "Full Decoration", "Table Styling", "Other"],
    show: {
      ...ALL_OFF,
      sizes: true, pricingTiers: true,
    },
    extraFields: [
      { key: "theme", label: "Theme options", placeholder: "Rustic, modern, floral, boho" },
      { key: "setupTime", label: "Setup time", placeholder: "2-4 hours" },
    ],
  },
  entertainers: {
    noun: "Performance",
    types: ["Magic Show", "Stilt Walking", "Fire Performance", "Aerial Act", "Live Band", "Mascot", "Other"],
    show: {
      ...ALL_OFF,
      pricingTiers: true,
    },
    extraFields: [
      { key: "duration", label: "Performance duration", placeholder: "30 min, 1 hour, 2 hours" },
      { key: "groupSize", label: "Group size", placeholder: "Solo, duo, 4-piece" },
    ],
  },
  djs: {
    noun: "Package",
    types: ["DJ Gold", "DJ Platinum", "DJ Diamond", "Open-Format", "Bollywood Night", "Other"],
    show: {
      ...ALL_OFF,
      pricingTiers: true,
    },
    extraFields: [
      { key: "hours", label: "Hours included", placeholder: "4, 6, 8" },
      { key: "equipment", label: "Equipment", placeholder: "Sound system, LED walls, fog machine" },
      { key: "genres", label: "Genres", placeholder: "House, Bollywood, Hip-hop, Latin" },
    ],
  },
  photographers: {
    noun: "Package",
    types: ["Wedding Photography", "Pre-Wedding Shoot", "Event Coverage", "Product Shoot", "Drone Package", "Other"],
    show: {
      ...ALL_OFF,
      pricingTiers: true,
    },
    extraFields: [
      { key: "hours", label: "Hours of coverage", placeholder: "4, 8, 12" },
      { key: "deliverables", label: "Deliverables", placeholder: "300 photos, 5-min video, album" },
      { key: "editors", label: "Photographers", placeholder: "1, 2, 3" },
    ],
  },
  venues: {
    noun: "Venue",
    types: ["Banquet Hall", "Rooftop", "Garden", "Beachfront", "Ballroom", "Loft", "Other"],
    show: {
      ...ALL_OFF,
      minGuests: true, pricingTiers: true, inventory: true,
    },
    extraFields: [
      { key: "capacity", label: "Capacity", placeholder: "100-500 guests" },
      { key: "amenities", label: "Amenities", placeholder: "Parking, AC, catering kitchen, stage" },
      { key: "pricing", label: "Pricing mode", placeholder: "Per day, per hour, per event" },
    ],
  },
};

export function getCategoryFields(category: string): CategoryFieldConfig {
  return (
    CATEGORY_FIELDS[category] ?? {
      noun: "Product",
      types: ["Other"],
      show: { ...ALL_OFF },
      extraFields: [],
    }
  );
}
