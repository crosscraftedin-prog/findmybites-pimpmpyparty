/**
 * Category-specific product/package field configurations.
 * Each vendor category gets its own set of fields tailored to what that
 * business type actually sells — bakers have egg/eggless + shape, DJs have
 * hours + equipment, photographers have hours + deliverables, etc.
 */

import { migrateCategory } from "./constants";

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
  // ── FindMyBites — NEW 6-category architecture ──
  "bakers-bakery": {
    noun: "Product",
    types: [
      // Cakes
      "Wedding Cake", "Birthday Cake", "Anniversary Cake", "Baby Shower Cake",
      "Engagement Cake", "Corporate Cake", "Theme Cake", "Fondant Cake",
      "Buttercream Cake", "Custom Cake", "Designer Cake", "Vegan Cake",
      "Eggless Cake",
      // Cupcakes
      "Wedding Cupcakes", "Birthday Cupcakes", "Mini Cupcakes", "Custom Cupcakes",
      // Chocolates
      "Handmade Chocolates", "Truffles", "Chocolate Bouquet", "Chocolate Box",
      // Desserts
      "Cheesecake", "Dessert Cup", "Tiramisu", "Mousse", "Pudding",
      "Other",
    ],
    show: {
      ...ALL_OFF,
      sizes: true, flavours: true, weight: true, prepTime: true,
      servings: true, shape: true, eggless: true, inventory: true, pricingTiers: true,
    },
    extraFields: [
      { key: "tiers", label: "Tiers (for cakes)", placeholder: "1, 2, 3, 4+" },
      { key: "icingType", label: "Icing type", placeholder: "Fondant, buttercream, ganache" },
    ],
  },
  caterers: {
    noun: "Menu",
    types: [
      "Live Counter", "Wedding Menu", "Corporate Buffet", "Private Dinner",
      "BBQ Package", "Buffet Package", "Canape Package",
      "Vegetarian Menu", "Vegan Menu", "Halal Menu", "Other",
    ],
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
  "chef-staff": {
    noun: "Service",
    types: [
      "Private Chef", "Wedding Chef", "Corporate Chef", "Pastry Chef",
      "Bartender", "Cocktail Maker", "Mixologist", "Bar Staff",
      "Waiter", "Waitress", "Host", "Hostess", "Serving Staff",
      "Event Crew", "Kitchen Assistant", "Cleaner", "Other",
    ],
    show: {
      ...ALL_OFF,
      minGuests: true, pricePerHead: true, prepTime: true, servings: true,
      pricingTiers: true,
    },
    extraFields: [
      { key: "experience", label: "Experience", placeholder: "5+ years, Michelin-trained" },
      { key: "cuisine", label: "Specialty cuisine", placeholder: "French, Japanese, Modern Indian" },
    ],
  },
  "food-trucks": {
    noun: "Menu Item",
    types: ["Burger", "Pizza", "BBQ", "Street Food", "Dessert", "Ice Cream", "Coffee", "Other"],
    show: {
      ...ALL_OFF,
      sizes: true, flavours: true, prepTime: true, servings: true,
      inventory: true,
    },
    extraFields: [
      { key: "minimumOrder", label: "Minimum order", placeholder: "10 plates" },
    ],
  },
  "beverage-specialists": {
    noun: "Package",
    types: ["Coffee Catering", "Tea Catering", "Mocktail Bar", "Juice Bar", "Smoothie Bar", "Bubble Tea", "Other"],
    show: {
      ...ALL_OFF,
      minGuests: true, pricePerHead: true, servings: true, prepTime: true,
      pricingTiers: true,
    },
    extraFields: [
      { key: "capacity", label: "Capacity", placeholder: "Up to 100, up to 500 guests" },
      { key: "equipment", label: "Equipment", placeholder: "Espresso machine, bar setup, blenders" },
    ],
  },
  "specialty-food": {
    noun: "Product",
    types: ["Organic", "Keto & Low-Carb", "Vegan & Plant-Based", "Gluten-Free", "Halal", "Kosher", "Sugar-Free", "Dairy-Free", "Other"],
    show: {
      ...ALL_OFF,
      sizes: true, weight: true, prepTime: true, servings: true,
      inventory: true, pricingTiers: true,
    },
    extraFields: [
      { key: "certification", label: "Certification", placeholder: "USDA Organic, Halal-certified" },
    ],
  },
  // ── Old FindMyBites category aliases (backward compatibility) ──
  // These map old slugs to the same config as their new equivalent so existing
  // vendors' product forms still render correctly.
  bakers: {
    noun: "Product",
    types: ["Bread", "Loaf", "Pastry", "Viennoiserie", "Bagel", "Roll", "Other"],
    show: { ...ALL_OFF, sizes: true, weight: true, prepTime: true, servings: true, inventory: true, pricingTiers: true },
    extraFields: [{ key: "flourType", label: "Flour type", placeholder: "Whole wheat, all-purpose, sourdough starter" }],
  },
  "cake-artists": {
    noun: "Cake",
    types: ["Wedding Cake", "Birthday Cake", "Custom Cake", "Sculptural Cake", "Cupcake Box", "Other"],
    show: { ...ALL_OFF, sizes: true, flavours: true, weight: true, prepTime: true, servings: true, shape: true, eggless: true, inventory: true, pricingTiers: true },
    extraFields: [
      { key: "tiers", label: "Tiers", placeholder: "1, 2, 3, 4+" },
      { key: "icingType", label: "Icing type", placeholder: "Fondant, buttercream, ganache" },
    ],
  },
  desserts: {
    noun: "Dessert",
    types: ["Macarons", "Chocolates", "Tiramisu", "Pudding", "Dessert Table", "Ice Cream", "Other"],
    show: { ...ALL_OFF, sizes: true, flavours: true, weight: true, prepTime: true, servings: true, eggless: true, inventory: true, pricingTiers: true },
    extraFields: [],
  },
  catering: {
    noun: "Menu",
    types: ["Wedding Menu", "Corporate Buffet", "Private Dinner", "BBQ Package", "Canape Package", "Other"],
    show: { ...ALL_OFF, minGuests: true, pricePerHead: true, servings: true, prepTime: true, pricingTiers: true },
    extraFields: [
      { key: "cuisine", label: "Cuisine type", placeholder: "Indian, Italian, Mexican, Fusion" },
      { key: "vegOption", label: "Veg / Non-veg", placeholder: "Veg, Non-veg, Both" },
    ],
  },
  "private-chefs": {
    noun: "Menu",
    types: ["Tasting Menu", "Dinner Party", "BBQ Experience", "Cooking Class", "Other"],
    show: { ...ALL_OFF, minGuests: true, pricePerHead: true, prepTime: true, servings: true, pricingTiers: true },
    extraFields: [
      { key: "courses", label: "Courses", placeholder: "5, 7, 9" },
      { key: "cuisine", label: "Cuisine", placeholder: "French, Japanese, Modern Indian" },
    ],
  },
  "specialty-foods": {
    noun: "Product",
    types: ["Organic", "Vegan", "Gluten-Free", "Keto", "Halal", "Kosher", "Other"],
    show: { ...ALL_OFF, sizes: true, weight: true, prepTime: true, servings: true, inventory: true, pricingTiers: true },
    extraFields: [{ key: "certification", label: "Certification", placeholder: "USDA Organic, Halal-certified" }],
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
  // ── NEW categories ──
  "cupcake-specialists": {
    noun: "Product",
    types: ["Cupcake Box", "Mini Desserts", "Custom Cupcakes", "Vegan Cupcakes", "Other"],
    show: { ...ALL_OFF, sizes: true, flavours: true, eggless: true, inventory: true, pricingTiers: true },
    extraFields: [{ key: "perBox", label: "Per box quantity", placeholder: "6, 12, 24" }],
  },
  chocolatiers: {
    noun: "Product",
    types: ["Truffles", "Pralines", "Chocolate Bars", "Gift Boxes", "Other"],
    show: { ...ALL_OFF, weight: true, flavours: true, inventory: true, pricingTiers: true },
    extraFields: [{ key: "packaging", label: "Packaging", placeholder: "Gift box, bulk" }],
  },
  "dessert-makers": {
    noun: "Dessert",
    types: ["Macarons", "Tiramisu", "Ice Cream", "Dessert Table", "Donuts", "Other"],
    show: { ...ALL_OFF, sizes: true, flavours: true, weight: true, eggless: true, inventory: true, pricingTiers: true },
    extraFields: [],
  },
  // NOTE: beverage-specialists is defined above at line 122 with the new
  // 6-category architecture config. The old duplicate was removed to prevent
  // the last-definition-wins behavior from overriding the new config.
  // NOTE: specialty-foods is also defined above at line 189 — removed duplicate here.
  videographers: {
    noun: "Package",
    types: ["Wedding Film", "Event Coverage", "Drone Video", "Promo Video", "Other"],
    show: { ...ALL_OFF, pricingTiers: true },
    extraFields: [
      { key: "hours", label: "Hours of coverage", placeholder: "4, 8, 12" },
      { key: "deliverables", label: "Deliverables", placeholder: "5-min film, raw footage" },
      { key: "editors", label: "Videographers", placeholder: "1, 2" },
    ],
  },
  florists: {
    noun: "Arrangement",
    types: ["Bridal Bouquet", "Centerpieces", "Floral Arch", "Event Florals", "Other"],
    show: { ...ALL_OFF, sizes: true, pricingTiers: true },
    extraFields: [
      { key: "flowerType", label: "Flower type", placeholder: "Roses, lilies, peonies" },
      { key: "bouquetType", label: "Bouquet type", placeholder: "Hand-tied, cascade, posy" },
    ],
  },
  "rental-services": {
    noun: "Rental",
    types: ["Tents", "Furniture", "Tableware", "Lighting", "Power", "Other"],
    show: { ...ALL_OFF, inventory: true, pricingTiers: true },
    extraFields: [
      { key: "quantity", label: "Available quantity", placeholder: "50 chairs, 20 tables" },
      { key: "rentalPeriod", label: "Rental period", placeholder: "Per day, per event" },
    ],
  },
  "makeup-artists": {
    noun: "Service",
    types: ["Bridal Makeup", "Party Makeup", "Editorial", "HD Makeup", "Airbrush", "Other"],
    show: { ...ALL_OFF, pricingTiers: true },
    extraFields: [
      { key: "trials", label: "Trial included", placeholder: "Yes / No" },
      { key: "products", label: "Products used", placeholder: "MAC, Huda, Charlotte Tilbury" },
    ],
  },
  "beauty-services": {
    noun: "Service",
    types: ["Hair Styling", "Mehndi", "Spa", "Nail Art", "Grooming", "Other"],
    show: { ...ALL_OFF, pricingTiers: true },
    extraFields: [{ key: "duration", label: "Duration", placeholder: "1 hour, 2 hours" }],
  },
  transportation: {
    noun: "Service",
    types: ["Limousine", "Party Bus", "Guest Shuttle", "Vintage Car", "Other"],
    show: { ...ALL_OFF, minGuests: true, pricingTiers: true },
    extraFields: [
      { key: "capacity", label: "Vehicle capacity", placeholder: "8, 15, 30 passengers" },
      { key: "hours", label: "Hours included", placeholder: "4, 8" },
    ],
  },
  "invitation-printing": {
    noun: "Product",
    types: ["Wedding Invitations", "Birthday Cards", "Corporate Stationery", "Digital Invites", "Other"],
    show: { ...ALL_OFF, sizes: true, inventory: true, pricingTiers: true },
    extraFields: [{ key: "material", label: "Material", placeholder: "Cardstock, handmade paper" }],
  },
  "kids-party-services": {
    noun: "Package",
    types: ["Bounce House", "Mascot Visit", "Games Package", "Face Painting", "Other"],
    show: { ...ALL_OFF, pricingTiers: true },
    extraFields: [
      { key: "ageRange", label: "Age range", placeholder: "3-8 years" },
      { key: "duration", label: "Duration", placeholder: "1 hour, 2 hours" },
    ],
  },
  "audio-visual-services": {
    noun: "Package",
    types: ["Sound System", "Stage Lighting", "LED Wall", "AV Production", "Other"],
    show: { ...ALL_OFF, pricingTiers: true },
    extraFields: [
      { key: "capacity", label: "Venue capacity", placeholder: "Up to 500, up to 1000" },
      { key: "includes", label: "Includes", placeholder: "Speakers, mics, mixer, technician" },
    ],
  },
};

export function getCategoryFields(category: string): CategoryFieldConfig {
  // Apply category migration first so old slugs (cake-artists, bakers, etc.)
  // resolve to their new 6-category config.
  const migrated = migrateCategory(category);
  return (
    CATEGORY_FIELDS[migrated] ??
    CATEGORY_FIELDS[category] ?? {
      noun: "Product",
      types: ["Other"],
      show: { ...ALL_OFF },
      extraFields: [],
    }
  );
}
