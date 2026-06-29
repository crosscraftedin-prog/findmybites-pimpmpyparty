/**
 * Template Engine — Canonical Template Definitions
 * ================================================
 *
 * This file is the SEED SOURCE OF TRUTH for all listing templates.
 *
 * Architecture: Business Type → Category → Subcategory → Template → Dynamic Fields
 *
 * How it works:
 * 1. The resolve API (`/api/templates/resolve`) checks the DB (TemplateMapping)
 *    first. If the DB is available, it returns the admin-managed template.
 * 2. If the DB is unavailable (sandbox) or has no mapping, it falls back to
 *    the definitions in this file.
 * 3. An admin can call `/api/admin/templates/seed` to sync these definitions
 *    into the DB, then edit them via the Admin Panel without touching code.
 *
 * Field types:
 *   text         — single-line text input
 *   number       — numeric input (supports unit, min, max, step)
 *   textarea     — multi-line text
 *   select       — dropdown (options from filterGroupName or staticOptions)
 *   chips        — multi-select toggle chips
 *   chips_single — single-select toggle chips (only one active)
 *   toggle       — boolean checkbox
 *   toggle_group — Yes/No style pill group (toggleOptions)
 *   images       — image upload grid (maxImages)
 *   section_toggle — boolean that reveals subFields when on
 *
 * Options resolution (for select/chips/chips_single):
 *   - If filterGroupName is set, options come from the Universal Filter Engine
 *     (FilterGroup by that name). Admin filter updates auto-propagate.
 *   - Else staticOptions is used.
 *
 * Conditions:
 *   condition: { field: "productType", values: ["Cakes", ""] }
 *   Field is visible only when form[field] is in values.
 *   Empty string "" means "shown by default / when nothing is selected".
 */

export type FieldType =
  | "text"
  | "number"
  | "textarea"
  | "select"
  | "chips"
  | "chips_single"
  | "toggle"
  | "toggle_group"
  | "images"
  | "section_toggle";

export interface TemplateFieldDef {
  key: string;
  label: string;
  type: FieldType;
  section: string;
  sortOrder: number;
  required?: boolean;
  enabled?: boolean;
  placeholder?: string;
  helpText?: string;
  unit?: string;
  span?: 1 | 2;
  filterGroupName?: string;
  staticOptions?: string[];
  condition?: { field: string; values: string[] };
  subFields?: string[];
  toggleOptions?: string[];
  maxImages?: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
}

export interface TemplateSectionDef {
  name: string;
  icon?: string;
  defaultOpen?: boolean;
  sortOrder: number;
}

export interface TemplateDef {
  slug: string;
  name: string;
  description: string;
  ecosystem: "FINDMYBITES" | "PIMPMYPARTY" | "BOTH";
  icon?: string;
  sections: TemplateSectionDef[];
  fields: TemplateFieldDef[];
}

// ────────────────────────────────────────────────────────────────────────────
// SHARED SECTIONS
// ────────────────────────────────────────────────────────────────────────────

const BASIC_SECTION: TemplateSectionDef = {
  name: "Basic Information",
  icon: "Package",
  defaultOpen: true,
  sortOrder: 0,
};

const DETAILS_SECTION: TemplateSectionDef = {
  name: "Product Details",
  icon: "Sparkles",
  defaultOpen: true,
  sortOrder: 1,
};

const DIETARY_SECTION: TemplateSectionDef = {
  name: "Dietary & Allergens",
  icon: "Check",
  defaultOpen: false,
  sortOrder: 2,
};

const NUTRITION_SECTION: TemplateSectionDef = {
  name: "Nutrition Information",
  icon: "Sparkles",
  defaultOpen: false,
  sortOrder: 3,
};

const PREP_SECTION: TemplateSectionDef = {
  name: "Preparation & Delivery",
  icon: "Package",
  defaultOpen: false,
  sortOrder: 4,
};

// ────────────────────────────────────────────────────────────────────────────
// 1. CAKE BAKERY TEMPLATE
//    Used by: Home Bakers, Home Bakery, and all future bakery categories.
//    This reproduces the EXACT existing Home Bakers product form.
// ────────────────────────────────────────────────────────────────────────────

const CAKE_BAKERY_TEMPLATE: TemplateDef = {
  slug: "cake-bakery",
  name: "Cake & Bakery Template",
  description:
    "Cakes, cupcakes, brownies, cookies, desserts, chocolates, and breads. Used by Home Bakers and all bakery categories.",
  ecosystem: "FINDMYBITES",
  icon: "Cake",
  sections: [BASIC_SECTION, DETAILS_SECTION, DIETARY_SECTION, NUTRITION_SECTION, PREP_SECTION],
  fields: [
    // ── Basic Information ──
    {
      key: "name",
      label: "Product name",
      type: "text",
      section: "Basic Information",
      sortOrder: 1,
      required: true,
      placeholder: "e.g. Custom Wedding Cake",
    },
    {
      key: "productType",
      label: "Product Type",
      type: "select",
      section: "Basic Information",
      sortOrder: 2,
      filterGroupName: "Bakery Product Type",
      helpText: "Selecting a type shows relevant fields below",
      placeholder: "Select product type",
    },
    {
      key: "packageType",
      label: "Package type",
      type: "select",
      section: "Basic Information",
      sortOrder: 3,
      staticOptions: ["basic", "standard", "premium", "custom"],
    },
    {
      key: "price",
      label: "Price",
      type: "number",
      section: "Basic Information",
      sortOrder: 4,
      required: true,
      placeholder: "0",
    },
    {
      key: "description",
      label: "Description",
      type: "textarea",
      section: "Basic Information",
      sortOrder: 5,
      placeholder: "Describe what's included...",
      span: 2,
    },
    {
      key: "images",
      label: "Product Photos (up to 10)",
      type: "images",
      section: "Basic Information",
      sortOrder: 6,
      maxImages: 10,
      span: 2,
    },

    // ── Product Details: CAKE fields (default + Cakes) ──
    {
      key: "cakeShape",
      label: "Cake Shape",
      type: "select",
      section: "Product Details",
      sortOrder: 10,
      condition: { field: "productType", values: ["Cakes", ""] },
      staticOptions: ["round", "square", "rectangle", "heart", "custom"],
    },
    {
      key: "cakeSize",
      label: "Cake Size",
      type: "number",
      section: "Product Details",
      sortOrder: 11,
      condition: { field: "productType", values: ["Cakes", ""] },
      unit: "kg",
      placeholder: "1",
    },
    {
      key: "serves",
      label: "Serves",
      type: "number",
      section: "Product Details",
      sortOrder: 12,
      condition: { field: "productType", values: ["Cakes", "Cupcakes", "Brownies", "Dessert Boxes", ""] },
      unit: "portions",
      placeholder: "20",
    },
    {
      key: "layers",
      label: "Number of Layers",
      type: "number",
      section: "Product Details",
      sortOrder: 13,
      condition: { field: "productType", values: ["Cakes", ""] },
      placeholder: "1",
    },
    {
      key: "cakeFlavour",
      label: "Flavour",
      type: "select",
      section: "Product Details",
      sortOrder: 14,
      condition: { field: "productType", values: ["Cakes", "Cupcakes", "Brownies", "Cookies", ""] },
      filterGroupName: "Flavour",
      placeholder: "Select flavour",
    },
    {
      key: "filling",
      label: "Filling",
      type: "text",
      section: "Product Details",
      sortOrder: 15,
      condition: { field: "productType", values: ["Cakes", ""] },
      placeholder: "e.g. Chocolate ganache",
    },
    {
      key: "frosting",
      label: "Frosting",
      type: "text",
      section: "Product Details",
      sortOrder: 16,
      condition: { field: "productType", values: ["Cakes", ""] },
      placeholder: "e.g. Buttercream",
    },
    {
      key: "cakeType",
      label: "Cake Finish / Type",
      type: "chips_single",
      section: "Product Details",
      sortOrder: 17,
      condition: { field: "productType", values: ["Cakes", ""] },
      filterGroupName: "Cake Type",
      span: 2,
    },
    {
      key: "nameOnCake",
      label: "Allow name on cake",
      type: "section_toggle",
      section: "Product Details",
      sortOrder: 18,
      condition: { field: "productType", values: ["Cakes", ""] },
      subFields: ["nameOnCakeText", "nameOnCakeMaxChars"],
      span: 2,
    },
    {
      key: "nameOnCakeText",
      label: "Field label (shown to customer)",
      type: "text",
      section: "Product Details",
      sortOrder: 19,
      condition: { field: "productType", values: ["Cakes", ""] },
      placeholder: "Name to be written",
    },
    {
      key: "nameOnCakeMaxChars",
      label: "Max characters",
      type: "number",
      section: "Product Details",
      sortOrder: 20,
      condition: { field: "productType", values: ["Cakes", ""] },
      placeholder: "20",
    },

    // ── Product Details: CUPCAKE fields ──
    {
      key: "cupcake_pieces",
      label: "Number of Pieces",
      type: "number",
      section: "Product Details",
      sortOrder: 30,
      condition: { field: "productType", values: ["Cupcakes"] },
      placeholder: "12",
    },
    {
      key: "cupcake_boxSize",
      label: "Box Size",
      type: "text",
      section: "Product Details",
      sortOrder: 31,
      condition: { field: "productType", values: ["Cupcakes"] },
      placeholder: "e.g. Box of 12",
    },
    {
      key: "cupcake_customColours",
      label: "Custom Colours",
      type: "text",
      section: "Product Details",
      sortOrder: 32,
      condition: { field: "productType", values: ["Cupcakes"] },
      placeholder: "e.g. Pink, Blue",
    },

    // ── Product Details: BROWNIE fields ──
    {
      key: "brownie_pieces",
      label: "Pieces Per Box",
      type: "number",
      section: "Product Details",
      sortOrder: 40,
      condition: { field: "productType", values: ["Brownies"] },
      placeholder: "9",
    },
    {
      key: "brownie_boxSize",
      label: "Box Size",
      type: "text",
      section: "Product Details",
      sortOrder: 41,
      condition: { field: "productType", values: ["Brownies"] },
      placeholder: "e.g. Box of 9",
    },
    {
      key: "brownie_weight",
      label: "Weight",
      type: "number",
      section: "Product Details",
      sortOrder: 42,
      condition: { field: "productType", values: ["Brownies", "Dessert Boxes", "Breads"] },
      unit: "g",
      placeholder: "500",
    },

    // ── Product Details: COOKIE fields ──
    {
      key: "cookie_pieces",
      label: "Pieces",
      type: "number",
      section: "Product Details",
      sortOrder: 50,
      condition: { field: "productType", values: ["Cookies"] },
      placeholder: "12",
    },
    {
      key: "cookie_size",
      label: "Cookie Size",
      type: "text",
      section: "Product Details",
      sortOrder: 51,
      condition: { field: "productType", values: ["Cookies"] },
      placeholder: "e.g. 3 inch",
    },
    {
      key: "cookie_giftBox",
      label: "Gift Box",
      type: "toggle_group",
      section: "Product Details",
      sortOrder: 52,
      condition: { field: "productType", values: ["Cookies", "Chocolates"] },
      toggleOptions: ["Yes", "No"],
    },

    // ── Product Details: DESSERT BOX fields ──
    {
      key: "dessert_pieces",
      label: "Number of Items",
      type: "number",
      section: "Product Details",
      sortOrder: 60,
      condition: { field: "productType", values: ["Dessert Boxes"] },
      placeholder: "6",
    },
    {
      key: "dessert_boxSize",
      label: "Box Size",
      type: "text",
      section: "Product Details",
      sortOrder: 61,
      condition: { field: "productType", values: ["Dessert Boxes", "Brownies", "Cupcakes"] },
      placeholder: "e.g. Medium",
    },

    // ── Product Details: SNACK BOX fields ──
    {
      key: "snackBoxType",
      label: "Snack Box Type",
      type: "select",
      section: "Product Details",
      sortOrder: 70,
      condition: { field: "productType", values: ["Snack Boxes"] },
      staticOptions: [
        "Kids Party Snack Box",
        "Birthday Snack Box",
        "School Snack Box",
        "Corporate Snack Box",
        "Breakfast Box",
        "Lunch Box",
        "Picnic Box",
      ],
      placeholder: "Select type",
    },
    {
      key: "snackContents",
      label: "Contents",
      type: "chips",
      section: "Product Details",
      sortOrder: 71,
      condition: { field: "productType", values: ["Snack Boxes"] },
      staticOptions: ["Sweet", "Savoury", "Mixed"],
      span: 2,
    },
    {
      key: "numSnacks",
      label: "Number of Snacks",
      type: "number",
      section: "Product Details",
      sortOrder: 72,
      condition: { field: "productType", values: ["Snack Boxes"] },
      placeholder: "10",
    },
    {
      key: "ageGroup",
      label: "Age Group",
      type: "select",
      section: "Product Details",
      sortOrder: 73,
      condition: { field: "productType", values: ["Snack Boxes"] },
      staticOptions: ["Kids", "Adults", "Mixed"],
      placeholder: "Select",
    },
    {
      key: "customBranding",
      label: "Custom Branding",
      type: "toggle_group",
      section: "Product Details",
      sortOrder: 74,
      condition: { field: "productType", values: ["Snack Boxes"] },
      toggleOptions: ["Available", "Not Available"],
    },

    // ── Product Details: CHOCOLATE fields ──
    {
      key: "chocolateType",
      label: "Chocolate Type",
      type: "text",
      section: "Product Details",
      sortOrder: 80,
      condition: { field: "productType", values: ["Chocolates"] },
      placeholder: "e.g. Dark, Milk, White",
    },
    {
      key: "chocolate_pieces",
      label: "Pieces Per Box",
      type: "number",
      section: "Product Details",
      sortOrder: 81,
      condition: { field: "productType", values: ["Chocolates"] },
      placeholder: "16",
    },
    {
      key: "netWeight",
      label: "Net Weight",
      type: "number",
      section: "Product Details",
      sortOrder: 82,
      condition: { field: "productType", values: ["Chocolates"] },
      unit: "g",
      placeholder: "250",
    },
    {
      key: "cocoaPercentage",
      label: "Cocoa %",
      type: "number",
      section: "Product Details",
      sortOrder: 83,
      condition: { field: "productType", values: ["Chocolates"] },
      placeholder: "70",
    },
    {
      key: "personalisedMessage",
      label: "Personalised Message",
      type: "text",
      section: "Product Details",
      sortOrder: 84,
      condition: { field: "productType", values: ["Chocolates"] },
      placeholder: "e.g. Happy Birthday!",
    },
    {
      key: "ribbonColour",
      label: "Ribbon Colour",
      type: "text",
      section: "Product Details",
      sortOrder: 85,
      condition: { field: "productType", values: ["Chocolates"] },
      placeholder: "e.g. Red",
    },

    // ── Product Details: BREAD fields ──
    {
      key: "bread_pieces",
      label: "Pieces",
      type: "number",
      section: "Product Details",
      sortOrder: 90,
      condition: { field: "productType", values: ["Breads"] },
      placeholder: "4",
    },
    {
      key: "bread_packSize",
      label: "Pack Size",
      type: "text",
      section: "Product Details",
      sortOrder: 91,
      condition: { field: "productType", values: ["Breads"] },
      placeholder: "e.g. Pack of 4",
    },
    {
      key: "shelfLife",
      label: "Shelf Life",
      type: "select",
      section: "Product Details",
      sortOrder: 92,
      condition: { field: "productType", values: ["Breads"] },
      staticOptions: ["Same day", "1-2 days", "3-5 days", "Up to 1 week"],
      placeholder: "Select",
    },
    {
      key: "storageMethod",
      label: "Storage Method",
      type: "select",
      section: "Product Details",
      sortOrder: 93,
      condition: { field: "productType", values: ["Breads"] },
      staticOptions: ["Room temperature", "Refrigerate", "Freeze", "Cool dry place"],
      placeholder: "Select",
    },

    // ── Occasion (all food) ──
    {
      key: "occasion",
      label: "Occasion",
      type: "chips",
      section: "Product Details",
      sortOrder: 100,
      filterGroupName: "Occasion",
      span: 2,
    },

    // ── Dietary & Allergens ──
    {
      key: "dietaryTags",
      label: "Dietary Tags",
      type: "chips",
      section: "Dietary & Allergens",
      sortOrder: 1,
      filterGroupName: "Dietary Options",
      staticOptions: ["Eggless", "Vegan", "Vegetarian", "Gluten-free", "Nut-free", "Dairy-free", "Halal", "Jain"],
      span: 2,
    },
    {
      key: "allergens",
      label: "Allergens",
      type: "chips",
      section: "Dietary & Allergens",
      sortOrder: 2,
      staticOptions: ["Nuts", "Peanuts", "Dairy", "Eggs", "Gluten", "Wheat", "Shellfish", "Fish", "Soy", "Sesame", "Sulphites", "Celery"],
      span: 2,
    },

    // ── Nutrition Information ──
    {
      key: "nutritionPer",
      label: "Per",
      type: "select",
      section: "Nutrition Information",
      sortOrder: 1,
      staticOptions: ["100g", "serving", "product"],
      placeholder: "Select",
    },
    {
      key: "calories",
      label: "Calories",
      type: "number",
      section: "Nutrition Information",
      sortOrder: 2,
      placeholder: "0",
    },
    {
      key: "protein",
      label: "Protein",
      type: "number",
      section: "Nutrition Information",
      sortOrder: 3,
      unit: "g",
      placeholder: "0",
    },
    {
      key: "carbs",
      label: "Carbs",
      type: "number",
      section: "Nutrition Information",
      sortOrder: 4,
      unit: "g",
      placeholder: "0",
    },
    {
      key: "fat",
      label: "Fat",
      type: "number",
      section: "Nutrition Information",
      sortOrder: 5,
      unit: "g",
      placeholder: "0",
    },

    // ── Preparation & Delivery ──
    {
      key: "leadTime",
      label: "Lead Time",
      type: "number",
      section: "Preparation & Delivery",
      sortOrder: 1,
      unit: "days",
      placeholder: "3",
    },
    {
      key: "minOrder",
      label: "Min Order",
      type: "number",
      section: "Preparation & Delivery",
      sortOrder: 2,
      placeholder: "1",
    },
    {
      key: "deliveryAvailable",
      label: "Delivery Available",
      type: "toggle",
      section: "Preparation & Delivery",
      sortOrder: 3,
    },
    {
      key: "pickupAvailable",
      label: "Pickup Available",
      type: "toggle",
      section: "Preparation & Delivery",
      sortOrder: 4,
    },
    {
      key: "nationwideShipping",
      label: "Nationwide Shipping",
      type: "toggle",
      section: "Preparation & Delivery",
      sortOrder: 5,
    },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// 2. DECORATION TEMPLATE
//    Used by: Birthday Decoration, Wedding Decoration, Balloon Decoration, Floral Decoration
// ────────────────────────────────────────────────────────────────────────────

const DECORATION_TEMPLATE: TemplateDef = {
  slug: "decoration",
  name: "Decoration Template",
  description: "Balloon decor, floral decor, stage decor, and themed event decoration packages.",
  ecosystem: "PIMPMYPARTY",
  icon: "Flower2",
  sections: [BASIC_SECTION, DETAILS_SECTION, PREP_SECTION],
  fields: [
    // Basic
    { key: "name", label: "Package name", type: "text", section: "Basic Information", sortOrder: 1, required: true, placeholder: "e.g. Royal Wedding Stage Decor" },
    { key: "packageType", label: "Package type", type: "select", section: "Basic Information", sortOrder: 2, staticOptions: ["basic", "standard", "premium", "custom"] },
    { key: "price", label: "Price", type: "number", section: "Basic Information", sortOrder: 3, required: true, placeholder: "0" },
    { key: "description", label: "Description", type: "textarea", section: "Basic Information", sortOrder: 4, placeholder: "Describe what's included...", span: 2 },
    { key: "images", label: "Photos (up to 10)", type: "images", section: "Basic Information", sortOrder: 5, maxImages: 10, span: 2 },
    // Details
    { key: "decorTheme", label: "Theme", type: "chips", section: "Product Details", sortOrder: 10, filterGroupName: "Party Theme", span: 2 },
    { key: "balloonColours", label: "Balloon Colours", type: "chips", section: "Product Details", sortOrder: 11, filterGroupName: "Colour", span: 2 },
    { key: "setupTime", label: "Setup Time", type: "text", section: "Product Details", sortOrder: 12, placeholder: "e.g. 2 hours", unit: "hours" },
    { key: "eventSize", label: "Event Size", type: "select", section: "Product Details", sortOrder: 13, staticOptions: ["Small (up to 50)", "Medium (50-150)", "Large (150-500)", "X-Large (500+)"], placeholder: "Select" },
    { key: "indoorOutdoor", label: "Indoor / Outdoor", type: "chips_single", section: "Product Details", sortOrder: 14, staticOptions: ["Indoor", "Outdoor", "Both"] },
    { key: "whatsIncluded", label: "What's Included", type: "textarea", section: "Product Details", sortOrder: 15, placeholder: "e.g. Balloon arch, backdrop, table centerpieces...", span: 2 },
    { key: "occasion", label: "Occasion", type: "chips", section: "Product Details", sortOrder: 16, filterGroupName: "Occasion", span: 2 },
    // Prep
    { key: "leadTime", label: "Lead Time", type: "number", section: "Preparation & Delivery", sortOrder: 1, unit: "days", placeholder: "3" },
    { key: "deliveryAvailable", label: "On-site Setup Available", type: "toggle", section: "Preparation & Delivery", sortOrder: 2 },
    { key: "serviceArea", label: "Service Area (km)", type: "number", section: "Preparation & Delivery", sortOrder: 3, placeholder: "50", unit: "km" },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// 3. PHOTOGRAPHY TEMPLATE
//    Used by: Wedding Photography, Event Photography, Videography, Drone Services
// ────────────────────────────────────────────────────────────────────────────

const PHOTOGRAPHY_TEMPLATE: TemplateDef = {
  slug: "photography",
  name: "Photography Template",
  description: "Wedding photography, event coverage, videography, and drone services.",
  ecosystem: "PIMPMYPARTY",
  icon: "Camera",
  sections: [BASIC_SECTION, DETAILS_SECTION, PREP_SECTION],
  fields: [
    { key: "name", label: "Package name", type: "text", section: "Basic Information", sortOrder: 1, required: true, placeholder: "e.g. Full Day Wedding Photography" },
    { key: "packageType", label: "Package type", type: "select", section: "Basic Information", sortOrder: 2, staticOptions: ["basic", "standard", "premium", "custom"] },
    { key: "price", label: "Price", type: "number", section: "Basic Information", sortOrder: 3, required: true, placeholder: "0" },
    { key: "description", label: "Description", type: "textarea", section: "Basic Information", sortOrder: 4, placeholder: "Describe what's included...", span: 2 },
    { key: "images", label: "Portfolio Photos (up to 10)", type: "images", section: "Basic Information", sortOrder: 5, maxImages: 10, span: 2 },
    // Details
    { key: "coverageHours", label: "Coverage Hours", type: "number", section: "Product Details", sortOrder: 10, unit: "hours", placeholder: "8" },
    { key: "drone", label: "Drone Coverage", type: "toggle_group", section: "Product Details", sortOrder: 11, toggleOptions: ["Included", "Add-on", "Not available"] },
    { key: "album", label: "Photo Album", type: "toggle_group", section: "Product Details", sortOrder: 12, toggleOptions: ["Included", "Add-on", "Not available"] },
    { key: "reels", label: "Reels / Short Videos", type: "toggle_group", section: "Product Details", sortOrder: 13, toggleOptions: ["Included", "Add-on", "Not available"] },
    { key: "editedPhotos", label: "Edited Photos", type: "number", section: "Product Details", sortOrder: 14, placeholder: "300" },
    { key: "secondShooter", label: "Second Shooter", type: "toggle_group", section: "Product Details", sortOrder: 15, toggleOptions: ["Included", "Add-on", "Not available"] },
    { key: "deliveryTime", label: "Delivery Time", type: "select", section: "Product Details", sortOrder: 16, staticOptions: ["1 week", "2 weeks", "3-4 weeks", "4-6 weeks", "6+ weeks"], placeholder: "Select" },
    { key: "printRelease", label: "Print Release", type: "toggle", section: "Product Details", sortOrder: 17 },
    { key: "onlineGallery", label: "Online Gallery", type: "toggle", section: "Product Details", sortOrder: 18 },
    { key: "occasion", label: "Occasion", type: "chips", section: "Product Details", sortOrder: 19, filterGroupName: "Occasion", span: 2 },
    // Prep
    { key: "leadTime", label: "Booking Lead Time", type: "number", section: "Preparation & Delivery", sortOrder: 1, unit: "days", placeholder: "7" },
    { key: "travelCost", label: "Travel Cost", type: "toggle_group", section: "Preparation & Delivery", sortOrder: 2, toggleOptions: ["Included", "Extra", "Varies"] },
    { key: "serviceArea", label: "Travel Distance", type: "number", section: "Preparation & Delivery", sortOrder: 3, unit: "km", placeholder: "100" },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// 4. ENTERTAINMENT TEMPLATE
//    Used by: DJs, Bands, Magicians, MCs, Mascots, Dancers, Live Performers
// ────────────────────────────────────────────────────────────────────────────

const ENTERTAINMENT_TEMPLATE: TemplateDef = {
  slug: "entertainment",
  name: "Entertainment Template",
  description: "DJs, bands, magicians, MCs, mascots, dancers, and live performers.",
  ecosystem: "PIMPMYPARTY",
  icon: "Music",
  sections: [BASIC_SECTION, DETAILS_SECTION, PREP_SECTION],
  fields: [
    { key: "name", label: "Package name", type: "text", section: "Basic Information", sortOrder: 1, required: true, placeholder: "e.g. 4-Hour DJ Package" },
    { key: "packageType", label: "Package type", type: "select", section: "Basic Information", sortOrder: 2, staticOptions: ["basic", "standard", "premium", "custom"] },
    { key: "price", label: "Price", type: "number", section: "Basic Information", sortOrder: 3, required: true, placeholder: "0" },
    { key: "description", label: "Description", type: "textarea", section: "Basic Information", sortOrder: 4, placeholder: "Describe what's included...", span: 2 },
    { key: "images", label: "Photos (up to 10)", type: "images", section: "Basic Information", sortOrder: 5, maxImages: 10, span: 2 },
    // Details
    { key: "performanceDuration", label: "Performance Duration", type: "number", section: "Product Details", sortOrder: 10, unit: "hours", placeholder: "4" },
    { key: "genre", label: "Genre / Style", type: "chips", section: "Product Details", sortOrder: 11, filterGroupName: "Music Genre", span: 2 },
    { key: "equipmentIncluded", label: "Equipment Included", type: "chips", section: "Product Details", sortOrder: 12, staticOptions: ["Sound System", "Lighting", "Microphone", "DJ Booth", "Smoke Machine", "LED Screen"], span: 2 },
    { key: "mcServices", label: "MC Services", type: "toggle_group", section: "Product Details", sortOrder: 13, toggleOptions: ["Included", "Add-on", "Not available"] },
    { key: "audienceSize", label: "Max Audience Size", type: "number", section: "Product Details", sortOrder: 14, placeholder: "200" },
    { key: "setupTime", label: "Setup Time", type: "number", section: "Product Details", sortOrder: 15, unit: "hours", placeholder: "1" },
    { key: "customPlaylist", label: "Custom Playlist", type: "toggle", section: "Product Details", sortOrder: 16 },
    { key: "songRequests", label: "Live Song Requests", type: "toggle", section: "Product Details", sortOrder: 17 },
    { key: "occasion", label: "Occasion", type: "chips", section: "Product Details", sortOrder: 18, filterGroupName: "Occasion", span: 2 },
    // Prep
    { key: "leadTime", label: "Booking Lead Time", type: "number", section: "Preparation & Delivery", sortOrder: 1, unit: "days", placeholder: "7" },
    { key: "travelCost", label: "Travel Cost", type: "toggle_group", section: "Preparation & Delivery", sortOrder: 2, toggleOptions: ["Included", "Extra", "Varies"] },
    { key: "serviceArea", label: "Travel Distance", type: "number", section: "Preparation & Delivery", sortOrder: 3, unit: "km", placeholder: "50" },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// 5. VENUE TEMPLATE
//    Used by: Wedding Venues, Birthday Venues, Corporate Venues
// ────────────────────────────────────────────────────────────────────────────

const VENUE_TEMPLATE: TemplateDef = {
  slug: "venue",
  name: "Venue Template",
  description: "Banquet halls, rooftops, gardens, and unique event spaces.",
  ecosystem: "PIMPMYPARTY",
  icon: "Building2",
  sections: [BASIC_SECTION, DETAILS_SECTION, PREP_SECTION],
  fields: [
    { key: "name", label: "Venue / Package name", type: "text", section: "Basic Information", sortOrder: 1, required: true, placeholder: "e.g. Full Day Venue Hire" },
    { key: "packageType", label: "Package type", type: "select", section: "Basic Information", sortOrder: 2, staticOptions: ["basic", "standard", "premium", "custom"] },
    { key: "price", label: "Price", type: "number", section: "Basic Information", sortOrder: 3, required: true, placeholder: "0" },
    { key: "description", label: "Description", type: "textarea", section: "Basic Information", sortOrder: 4, placeholder: "Describe the venue and what's included...", span: 2 },
    { key: "images", label: "Venue Photos (up to 10)", type: "images", section: "Basic Information", sortOrder: 5, maxImages: 10, span: 2 },
    // Details
    { key: "capacity", label: "Capacity", type: "number", section: "Product Details", sortOrder: 10, unit: "guests", placeholder: "150" },
    { key: "duration", label: "Duration", type: "select", section: "Product Details", sortOrder: 11, staticOptions: ["Half day (4 hrs)", "Full day (8 hrs)", "Weekend", "Multi-day"], placeholder: "Select" },
    { key: "venueType", label: "Venue Type", type: "chips", section: "Product Details", sortOrder: 12, filterGroupName: "Venue Type", span: 2 },
    { key: "indoorOutdoor", label: "Indoor / Outdoor", type: "chips_single", section: "Product Details", sortOrder: 13, staticOptions: ["Indoor", "Outdoor", "Both"] },
    { key: "amenities", label: "Amenities", type: "chips", section: "Product Details", sortOrder: 14, staticOptions: ["Parking", "Kitchen Access", "AV Equipment", "Bridal Suite", "Air Conditioning", "WiFi", "Bar", "Stage", "Garden", "Pool"], span: 2 },
    { key: "cateringOption", label: "In-house Catering", type: "toggle_group", section: "Product Details", sortOrder: 15, toggleOptions: ["Included", "Optional", "Not available"] },
    { key: "decorationOption", label: "In-house Decoration", type: "toggle_group", section: "Product Details", sortOrder: 16, toggleOptions: ["Included", "Optional", "Not available"] },
    { key: "occasion", label: "Occasion", type: "chips", section: "Product Details", sortOrder: 17, filterGroupName: "Occasion", span: 2 },
    // Prep
    { key: "leadTime", label: "Booking Lead Time", type: "number", section: "Preparation & Delivery", sortOrder: 1, unit: "days", placeholder: "30" },
    { key: "minGuests", label: "Minimum Guests", type: "number", section: "Preparation & Delivery", sortOrder: 2, placeholder: "50" },
    { key: "cleanupIncluded", label: "Setup & Cleanup Included", type: "toggle", section: "Preparation & Delivery", sortOrder: 3 },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// 6. CATERING TEMPLATE
//    Used by: Caterers, Live Food Counters
// ────────────────────────────────────────────────────────────────────────────

const CATERING_TEMPLATE: TemplateDef = {
  slug: "catering",
  name: "Catering Template",
  description: "Full-service catering, buffet, live counters, and per-head packages.",
  ecosystem: "FINDMYBITES",
  icon: "UtensilsCrossed",
  sections: [BASIC_SECTION, DETAILS_SECTION, DIETARY_SECTION, PREP_SECTION],
  fields: [
    { key: "name", label: "Package name", type: "text", section: "Basic Information", sortOrder: 1, required: true, placeholder: "e.g. Wedding Buffet Package" },
    { key: "packageType", label: "Package type", type: "select", section: "Basic Information", sortOrder: 2, staticOptions: ["basic", "standard", "premium", "custom"] },
    { key: "price", label: "Price (per head)", type: "number", section: "Basic Information", sortOrder: 3, required: true, placeholder: "0", unit: "/head" },
    { key: "description", label: "Description", type: "textarea", section: "Basic Information", sortOrder: 4, placeholder: "Describe the menu and what's included...", span: 2 },
    { key: "images", label: "Food Photos (up to 10)", type: "images", section: "Basic Information", sortOrder: 5, maxImages: 10, span: 2 },
    // Details
    { key: "cuisineType", label: "Cuisine Type", type: "chips", section: "Product Details", sortOrder: 10, filterGroupName: "Cuisine", span: 2 },
    { key: "minGuests", label: "Minimum Guests", type: "number", section: "Product Details", sortOrder: 11, placeholder: "50" },
    { key: "maxGuests", label: "Maximum Guests", type: "number", section: "Product Details", sortOrder: 12, placeholder: "500" },
    { key: "courses", label: "Courses", type: "chips", section: "Product Details", sortOrder: 13, staticOptions: ["Starter", "Main Course", "Dessert", "Live Counter", "Welcome Drinks", "Bread", "Salad", "Accompaniments"], span: 2 },
    { key: "serviceStyle", label: "Service Style", type: "chips_single", section: "Product Details", sortOrder: 14, staticOptions: ["Buffet", "Plated", "Live Counter", "Family Style"] },
    { key: "staffIncluded", label: "Staff Included", type: "chips", section: "Product Details", sortOrder: 15, staticOptions: ["Servers", "Chef", "Bartender", "Clean-up Crew", "Event Manager"], span: 2 },
    { key: "equipmentIncluded", label: "Equipment Included", type: "chips", section: "Product Details", sortOrder: 16, staticOptions: ["Chafing Dishes", "Plates & Cutlery", "Tables & Linen", "Serving Utensils", "Food Warmers"], span: 2 },
    { key: "occasion", label: "Occasion", type: "chips", section: "Product Details", sortOrder: 17, filterGroupName: "Occasion", span: 2 },
    // Dietary
    { key: "dietaryTags", label: "Dietary Options", type: "chips", section: "Dietary & Allergens", sortOrder: 1, filterGroupName: "Dietary Options", staticOptions: ["Vegetarian", "Vegan", "Gluten-free", "Nut-free", "Dairy-free", "Halal", "Kosher", "Jain"], span: 2 },
    { key: "allergens", label: "Allergens", type: "chips", section: "Dietary & Allergens", sortOrder: 2, staticOptions: ["Nuts", "Peanuts", "Dairy", "Eggs", "Gluten", "Wheat", "Shellfish", "Fish", "Soy", "Sesame"], span: 2 },
    // Prep
    { key: "leadTime", label: "Booking Lead Time", type: "number", section: "Preparation & Delivery", sortOrder: 1, unit: "days", placeholder: "5" },
    { key: "deliveryAvailable", label: "On-site Catering", type: "toggle", section: "Preparation & Delivery", sortOrder: 2 },
    { key: "serviceArea", label: "Service Area", type: "number", section: "Preparation & Delivery", sortOrder: 3, unit: "km", placeholder: "30" },
    { key: "tastingAvailable", label: "Tasting Session Available", type: "toggle", section: "Preparation & Delivery", sortOrder: 4 },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// 7. RENTAL TEMPLATE
//    Used by: Furniture Rental, Stage Rental, Photo Booth Rental, Equipment Rental
// ────────────────────────────────────────────────────────────────────────────

const RENTAL_TEMPLATE: TemplateDef = {
  slug: "rental",
  name: "Rental Template",
  description: "Furniture, stage, photo booth, and equipment rentals for events.",
  ecosystem: "PIMPMYPARTY",
  icon: "Package",
  sections: [BASIC_SECTION, DETAILS_SECTION, PREP_SECTION],
  fields: [
    { key: "name", label: "Item / Package name", type: "text", section: "Basic Information", sortOrder: 1, required: true, placeholder: "e.g. Chiavari Chair Rental (100 qty)" },
    { key: "packageType", label: "Package type", type: "select", section: "Basic Information", sortOrder: 2, staticOptions: ["basic", "standard", "premium", "custom"] },
    { key: "price", label: "Price (per unit)", type: "number", section: "Basic Information", sortOrder: 3, required: true, placeholder: "0", unit: "/unit" },
    { key: "description", label: "Description", type: "textarea", section: "Basic Information", sortOrder: 4, placeholder: "Describe the item and rental terms...", span: 2 },
    { key: "images", label: "Photos (up to 10)", type: "images", section: "Basic Information", sortOrder: 5, maxImages: 10, span: 2 },
    // Details
    { key: "rentalCategory", label: "Rental Category", type: "chips", section: "Product Details", sortOrder: 10, staticOptions: ["Furniture", "Stage", "Photo Booth", "Tent & Canopy", "Tableware", "Lighting", "Sound Equipment", "Power Equipment", "Linen"], span: 2 },
    { key: "material", label: "Material", type: "chips", section: "Product Details", sortOrder: 11, staticOptions: ["Wood", "Metal", "Plastic", "Fabric", "Glass", "Acrylic"], span: 2 },
    { key: "colour", label: "Colour", type: "chips", section: "Product Details", sortOrder: 12, filterGroupName: "Colour", span: 2 },
    { key: "quantityAvailable", label: "Quantity Available", type: "number", section: "Product Details", sortOrder: 13, placeholder: "100" },
    { key: "minRental", label: "Minimum Rental Quantity", type: "number", section: "Product Details", sortOrder: 14, placeholder: "10" },
    { key: "rentalDuration", label: "Rental Duration", type: "select", section: "Product Details", sortOrder: 15, staticOptions: ["Per day", "Per event", "Weekend", "Weekly"], placeholder: "Select" },
    { key: "setupIncluded", label: "Setup & Teardown Included", type: "toggle", section: "Product Details", sortOrder: 16 },
    { key: "occasion", label: "Occasion", type: "chips", section: "Product Details", sortOrder: 17, filterGroupName: "Occasion", span: 2 },
    // Prep
    { key: "leadTime", label: "Booking Lead Time", type: "number", section: "Preparation & Delivery", sortOrder: 1, unit: "days", placeholder: "3" },
    { key: "deliveryAvailable", label: "Delivery Available", type: "toggle", section: "Preparation & Delivery", sortOrder: 2 },
    { key: "pickupAvailable", label: "Pickup Available", type: "toggle", section: "Preparation & Delivery", sortOrder: 3 },
    { key: "serviceArea", label: "Delivery Area", type: "number", section: "Preparation & Delivery", sortOrder: 4, unit: "km", placeholder: "25" },
    { key: "depositRequired", label: "Security Deposit Required", type: "toggle", section: "Preparation & Delivery", sortOrder: 5 },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// 8. PARTY SUPPLIES TEMPLATE
//    Used by: Party Supplies, Party Stores
// ────────────────────────────────────────────────────────────────────────────

const PARTY_SUPPLIES_TEMPLATE: TemplateDef = {
  slug: "party-supplies",
  name: "Party Supplies Template",
  description: "Balloons, decorations, tableware, party props, and celebration accessories.",
  ecosystem: "PIMPMYPARTY",
  icon: "PartyPopper",
  sections: [BASIC_SECTION, DETAILS_SECTION, PREP_SECTION],
  fields: [
    { key: "name", label: "Product name", type: "text", section: "Basic Information", sortOrder: 1, required: true, placeholder: "e.g. Balloon Arch Kit" },
    { key: "packageType", label: "Package type", type: "select", section: "Basic Information", sortOrder: 2, staticOptions: ["basic", "standard", "premium", "custom"] },
    { key: "price", label: "Price", type: "number", section: "Basic Information", sortOrder: 3, required: true, placeholder: "0" },
    { key: "description", label: "Description", type: "textarea", section: "Basic Information", sortOrder: 4, placeholder: "Describe the product...", span: 2 },
    { key: "images", label: "Product Photos (up to 10)", type: "images", section: "Basic Information", sortOrder: 5, maxImages: 10, span: 2 },
    // Details
    { key: "brand", label: "Brand", type: "text", section: "Product Details", sortOrder: 10, placeholder: "e.g. PartyCo" },
    { key: "material", label: "Material", type: "chips", section: "Product Details", sortOrder: 11, staticOptions: ["Paper", "Plastic", "Foil", "Latex", "Wood", "Eco-Friendly"], span: 2 },
    { key: "packSize", label: "Pack Size", type: "text", section: "Product Details", sortOrder: 12, placeholder: "e.g. Pack of 12" },
    { key: "quantity", label: "Quantity in Pack", type: "number", section: "Product Details", sortOrder: 13, placeholder: "12" },
    { key: "theme", label: "Theme", type: "chips", section: "Product Details", sortOrder: 14, filterGroupName: "Party Theme", span: 2 },
    { key: "colour", label: "Colour", type: "chips", section: "Product Details", sortOrder: 15, filterGroupName: "Colour", span: 2 },
    { key: "personalization", label: "Personalization Available", type: "chips", section: "Product Details", sortOrder: 16, staticOptions: ["Custom Name", "Photo Printing", "Logo Printing"], span: 2 },
    { key: "occasion", label: "Occasion", type: "chips", section: "Product Details", sortOrder: 17, filterGroupName: "Occasion", span: 2 },
    // Prep
    { key: "leadTime", label: "Lead Time", type: "number", section: "Preparation & Delivery", sortOrder: 1, unit: "days", placeholder: "2" },
    { key: "minOrder", label: "Minimum Order", type: "number", section: "Preparation & Delivery", sortOrder: 2, placeholder: "1" },
    { key: "deliveryAvailable", label: "Delivery Available", type: "toggle", section: "Preparation & Delivery", sortOrder: 3 },
    { key: "pickupAvailable", label: "Pickup Available", type: "toggle", section: "Preparation & Delivery", sortOrder: 4 },
    { key: "nationwideShipping", label: "Nationwide Shipping", type: "toggle", section: "Preparation & Delivery", sortOrder: 5 },
    { key: "inStock", label: "In Stock", type: "toggle", section: "Preparation & Delivery", sortOrder: 6 },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// 9. RETURN GIFT TEMPLATE
//    Used by: Return Gifts, Corporate Gifts, Party Favours
// ────────────────────────────────────────────────────────────────────────────

const RETURN_GIFT_TEMPLATE: TemplateDef = {
  slug: "return-gift",
  name: "Return Gift Template",
  description: "Return gifts, corporate gifts, party favours, and goodie bags.",
  ecosystem: "PIMPMYPARTY",
  icon: "Gift",
  sections: [BASIC_SECTION, DETAILS_SECTION, PREP_SECTION],
  fields: [
    { key: "name", label: "Gift name", type: "text", section: "Basic Information", sortOrder: 1, required: true, placeholder: "e.g. Personalized Mug Gift Set" },
    { key: "packageType", label: "Package type", type: "select", section: "Basic Information", sortOrder: 2, staticOptions: ["basic", "standard", "premium", "custom"] },
    { key: "price", label: "Price (per unit)", type: "number", section: "Basic Information", sortOrder: 3, required: true, placeholder: "0", unit: "/unit" },
    { key: "description", label: "Description", type: "textarea", section: "Basic Information", sortOrder: 4, placeholder: "Describe the gift...", span: 2 },
    { key: "images", label: "Photos (up to 10)", type: "images", section: "Basic Information", sortOrder: 5, maxImages: 10, span: 2 },
    // Details
    { key: "giftCategory", label: "Gift Category", type: "chips", section: "Product Details", sortOrder: 10, staticOptions: ["Mugs", "Candles", "Stationery", "Sweets & Chocolates", "Plants", "Home Decor", "Tech Accessories", "Custom Hampers"], span: 2 },
    { key: "material", label: "Material", type: "chips", section: "Product Details", sortOrder: 11, staticOptions: ["Ceramic", "Glass", "Wood", "Metal", "Fabric", "Plastic", "Eco-Friendly"], span: 2 },
    { key: "personalization", label: "Personalization", type: "chips", section: "Product Details", sortOrder: 12, staticOptions: ["Custom Name", "Photo Printing", "Logo Printing", "Custom Message", "Gift Wrapping"], span: 2 },
    { key: "packSize", label: "Pack Size", type: "text", section: "Product Details", sortOrder: 13, placeholder: "e.g. Set of 10" },
    { key: "minOrder", label: "Minimum Order Quantity", type: "number", section: "Product Details", sortOrder: 14, placeholder: "10" },
    { key: "giftWrapping", label: "Gift Wrapping Included", type: "toggle", section: "Product Details", sortOrder: 15 },
    { key: "occasion", label: "Occasion", type: "chips", section: "Product Details", sortOrder: 16, filterGroupName: "Occasion", span: 2 },
    // Prep
    { key: "leadTime", label: "Lead Time", type: "number", section: "Preparation & Delivery", sortOrder: 1, unit: "days", placeholder: "5" },
    { key: "deliveryAvailable", label: "Delivery Available", type: "toggle", section: "Preparation & Delivery", sortOrder: 2 },
    { key: "nationwideShipping", label: "Nationwide Shipping", type: "toggle", section: "Preparation & Delivery", sortOrder: 3 },
    { key: "bulkDiscount", label: "Bulk Discount Available", type: "toggle", section: "Preparation & Delivery", sortOrder: 4 },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// 10. FLORIST TEMPLATE
//     Used by: Florists, Floral Designers
// ────────────────────────────────────────────────────────────────────────────

const FLORIST_TEMPLATE: TemplateDef = {
  slug: "florist",
  name: "Florist Template",
  description: "Wedding flowers, bouquets, centerpieces, and floral installations.",
  ecosystem: "PIMPMYPARTY",
  icon: "Flower2",
  sections: [BASIC_SECTION, DETAILS_SECTION, PREP_SECTION],
  fields: [
    { key: "name", label: "Package name", type: "text", section: "Basic Information", sortOrder: 1, required: true, placeholder: "e.g. Bridal Bouquet + Centerpieces" },
    { key: "packageType", label: "Package type", type: "select", section: "Basic Information", sortOrder: 2, staticOptions: ["basic", "standard", "premium", "custom"] },
    { key: "price", label: "Price", type: "number", section: "Basic Information", sortOrder: 3, required: true, placeholder: "0" },
    { key: "description", label: "Description", type: "textarea", section: "Basic Information", sortOrder: 4, placeholder: "Describe the floral arrangement...", span: 2 },
    { key: "images", label: "Photos (up to 10)", type: "images", section: "Basic Information", sortOrder: 5, maxImages: 10, span: 2 },
    // Details
    { key: "floralType", label: "Arrangement Type", type: "chips", section: "Product Details", sortOrder: 10, staticOptions: ["Bridal Bouquet", "Bridesmaid Bouquets", "Buttonholes", "Centerpieces", "Ceremony Arch", "Aisle Decor", "Flower Wall", "Table Garlands", "Wrist Corsages"], span: 2 },
    { key: "flowerType", label: "Flower Types", type: "chips", section: "Product Details", sortOrder: 11, filterGroupName: "Flower Type", staticOptions: ["Roses", "Lilies", "Peonies", "Orchids", "Carnations", "Tulips", "Sunflowers", "Hydrangeas", "Mixed Seasonal"], span: 2 },
    { key: "colour", label: "Colour Scheme", type: "chips", section: "Product Details", sortOrder: 12, filterGroupName: "Colour", span: 2 },
    { key: "arrangementStyle", label: "Style", type: "chips_single", section: "Product Details", sortOrder: 13, staticOptions: ["Classic", "Modern", "Rustic", "Bohemian", "Garden", "Luxury"] },
    { key: "freshnessGuarantee", label: "Freshness Guarantee", type: "toggle", section: "Product Details", sortOrder: 14 },
    { key: "occasion", label: "Occasion", type: "chips", section: "Product Details", sortOrder: 15, filterGroupName: "Occasion", span: 2 },
    // Prep
    { key: "leadTime", label: "Order Lead Time", type: "number", section: "Preparation & Delivery", sortOrder: 1, unit: "days", placeholder: "3" },
    { key: "deliveryAvailable", label: "Delivery Available", type: "toggle", section: "Preparation & Delivery", sortOrder: 2 },
    { key: "setupAvailable", label: "On-site Setup Available", type: "toggle", section: "Preparation & Delivery", sortOrder: 3 },
    { key: "serviceArea", label: "Service Area", type: "number", section: "Preparation & Delivery", sortOrder: 4, unit: "km", placeholder: "20" },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// 11. BEAUTY TEMPLATE
//     Used by: Hair Stylists, Makeup Artists, Henna Artists
// ────────────────────────────────────────────────────────────────────────────

const BEAUTY_TEMPLATE: TemplateDef = {
  slug: "beauty",
  name: "Beauty Template",
  description: "Hair styling, makeup, mehndi/henna, and beauty services for events.",
  ecosystem: "PIMPMYPARTY",
  icon: "Sparkles",
  sections: [BASIC_SECTION, DETAILS_SECTION, PREP_SECTION],
  fields: [
    { key: "name", label: "Service / Package name", type: "text", section: "Basic Information", sortOrder: 1, required: true, placeholder: "e.g. Bridal Makeup Package" },
    { key: "packageType", label: "Package type", type: "select", section: "Basic Information", sortOrder: 2, staticOptions: ["basic", "standard", "premium", "custom"] },
    { key: "price", label: "Price", type: "number", section: "Basic Information", sortOrder: 3, required: true, placeholder: "0" },
    { key: "description", label: "Description", type: "textarea", section: "Basic Information", sortOrder: 4, placeholder: "Describe the service...", span: 2 },
    { key: "images", label: "Portfolio Photos (up to 10)", type: "images", section: "Basic Information", sortOrder: 5, maxImages: 10, span: 2 },
    // Details
    { key: "serviceType", label: "Service Type", type: "chips", section: "Product Details", sortOrder: 10, staticOptions: ["Bridal Makeup", "Party Makeup", "HD Makeup", "Airbrush Makeup", "Hair Styling", "Hair Coloring", "Mehndi / Henna", "Nail Art", "Pre-bridal Package"], span: 2 },
    { key: "productsUsed", label: "Products Used", type: "chips", section: "Product Details", sortOrder: 11, staticOptions: ["MAC", "Huda Beauty", "NARS", "Bobbi Brown", "Kryolan", "PAC", "Maybelline", "Lakme"], span: 2 },
    { key: "trialAvailable", label: "Trial Session Available", type: "toggle", section: "Product Details", sortOrder: 12 },
    { key: "homeService", label: "Home / Venue Service", type: "toggle", section: "Product Details", sortOrder: 13 },
    { key: "groupBooking", label: "Group Booking Available", type: "toggle", section: "Product Details", sortOrder: 14 },
    { key: "duration", label: "Service Duration", type: "number", section: "Product Details", sortOrder: 15, unit: "hours", placeholder: "2" },
    { key: "occasion", label: "Occasion", type: "chips", section: "Product Details", sortOrder: 16, filterGroupName: "Occasion", span: 2 },
    // Prep
    { key: "leadTime", label: "Booking Lead Time", type: "number", section: "Preparation & Delivery", sortOrder: 1, unit: "days", placeholder: "7" },
    { key: "serviceArea", label: "Travel Distance", type: "number", section: "Preparation & Delivery", sortOrder: 2, unit: "km", placeholder: "15" },
    { key: "travelCost", label: "Travel Cost", type: "toggle_group", section: "Preparation & Delivery", sortOrder: 3, toggleOptions: ["Included", "Extra", "Varies"] },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// 12. STAFFING TEMPLATE
//     Used by: Waiters, Bartenders, Hosts, Hostesses, Event Staff
// ────────────────────────────────────────────────────────────────────────────

const STAFFING_TEMPLATE: TemplateDef = {
  slug: "staffing",
  name: "Staffing Template",
  description: "Waiters, bartenders, hosts, hostesses, and event staff.",
  ecosystem: "PIMPMYPARTY",
  icon: "Users",
  sections: [BASIC_SECTION, DETAILS_SECTION, PREP_SECTION],
  fields: [
    { key: "name", label: "Service name", type: "text", section: "Basic Information", sortOrder: 1, required: true, placeholder: "e.g. Professional Waiter Service" },
    { key: "packageType", label: "Package type", type: "select", section: "Basic Information", sortOrder: 2, staticOptions: ["basic", "standard", "premium", "custom"] },
    { key: "price", label: "Price (per staff per hour)", type: "number", section: "Basic Information", sortOrder: 3, required: true, placeholder: "0", unit: "/staff/hr" },
    { key: "description", label: "Description", type: "textarea", section: "Basic Information", sortOrder: 4, placeholder: "Describe the service...", span: 2 },
    { key: "images", label: "Photos (up to 10)", type: "images", section: "Basic Information", sortOrder: 5, maxImages: 10, span: 2 },
    // Details
    { key: "staffRole", label: "Staff Role", type: "chips", section: "Product Details", sortOrder: 10, staticOptions: ["Waiter", "Waitress", "Bartender", "Mixologist", "Host", "Hostess", "Event Manager", "Kitchen Assistant", "Cleaner", "Security", "Valet"], span: 2 },
    { key: "staffCount", label: "Staff Available", type: "number", section: "Product Details", sortOrder: 11, placeholder: "20" },
    { key: "minBooking", label: "Minimum Booking Hours", type: "number", section: "Product Details", sortOrder: 12, unit: "hours", placeholder: "4" },
    { key: "uniformProvided", label: "Uniform Provided", type: "toggle", section: "Product Details", sortOrder: 13 },
    { key: "trained", label: "Professionally Trained", type: "toggle", section: "Product Details", sortOrder: 14 },
    { key: "languageSkills", label: "Language Skills", type: "chips", section: "Product Details", sortOrder: 15, staticOptions: ["English", "Hindi", "Arabic", "Spanish", "French", "Mandarin"], span: 2 },
    { key: "occasion", label: "Occasion", type: "chips", section: "Product Details", sortOrder: 16, filterGroupName: "Occasion", span: 2 },
    // Prep
    { key: "leadTime", label: "Booking Lead Time", type: "number", section: "Preparation & Delivery", sortOrder: 1, unit: "days", placeholder: "2" },
    { key: "serviceArea", label: "Service Area", type: "number", section: "Preparation & Delivery", sortOrder: 2, unit: "km", placeholder: "30" },
    { key: "travelCost", label: "Travel Cost", type: "toggle_group", section: "Preparation & Delivery", sortOrder: 3, toggleOptions: ["Included", "Extra", "Varies"] },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// 13. PRINTING TEMPLATE
//     Used by: Invitations, Banners, Stickers, Signage
// ────────────────────────────────────────────────────────────────────────────

const PRINTING_TEMPLATE: TemplateDef = {
  slug: "printing",
  name: "Printing Template",
  description: "Invitations, banners, stickers, signage, and custom printing.",
  ecosystem: "PIMPMYPARTY",
  icon: "Printer",
  sections: [BASIC_SECTION, DETAILS_SECTION, PREP_SECTION],
  fields: [
    { key: "name", label: "Product name", type: "text", section: "Basic Information", sortOrder: 1, required: true, placeholder: "e.g. Custom Wedding Invitations" },
    { key: "packageType", label: "Package type", type: "select", section: "Basic Information", sortOrder: 2, staticOptions: ["basic", "standard", "premium", "custom"] },
    { key: "price", label: "Price (per piece)", type: "number", section: "Basic Information", sortOrder: 3, required: true, placeholder: "0", unit: "/piece" },
    { key: "description", label: "Description", type: "textarea", section: "Basic Information", sortOrder: 4, placeholder: "Describe the product...", span: 2 },
    { key: "images", label: "Sample Photos (up to 10)", type: "images", section: "Basic Information", sortOrder: 5, maxImages: 10, span: 2 },
    // Details
    { key: "printCategory", label: "Print Category", type: "chips", section: "Product Details", sortOrder: 10, staticOptions: ["Wedding Invitations", "Birthday Cards", "Corporate Stationery", "Digital Invites", "Save the Dates", "Banners", "Stickers", "Signage", "Menus", "Thank You Cards"], span: 2 },
    { key: "material", label: "Material", type: "chips", section: "Product Details", sortOrder: 11, staticOptions: ["Cardstock", "Glossy Paper", "Matte Paper", "Recycled Paper", "Vinyl", "Fabric", "Acrylic", "Wood"], span: 2 },
    { key: "printSize", label: "Size Options", type: "chips", section: "Product Details", sortOrder: 12, staticOptions: ["A5", "A4", "A6", "5x7", "4x6", "Custom Size"], span: 2 },
    { key: "printTechnique", label: "Print Technique", type: "chips", section: "Product Details", sortOrder: 13, staticOptions: ["Digital Print", "Offset Print", "Letterpress", "Foil Stamping", "Embossing", "Thermography"], span: 2 },
    { key: "personalization", label: "Personalization", type: "chips", section: "Product Details", sortOrder: 14, staticOptions: ["Custom Names", "Custom Date", "Custom Message", "Photo Printing", "Logo Printing", "Custom Design"], span: 2 },
    { key: "minOrder", label: "Minimum Order Quantity", type: "number", section: "Product Details", sortOrder: 15, placeholder: "50" },
    { key: "occasion", label: "Occasion", type: "chips", section: "Product Details", sortOrder: 16, filterGroupName: "Occasion", span: 2 },
    // Prep
    { key: "leadTime", label: "Production Lead Time", type: "number", section: "Preparation & Delivery", sortOrder: 1, unit: "days", placeholder: "5" },
    { key: "deliveryAvailable", label: "Delivery Available", type: "toggle", section: "Preparation & Delivery", sortOrder: 2 },
    { key: "nationwideShipping", label: "Nationwide Shipping", type: "toggle", section: "Preparation & Delivery", sortOrder: 3 },
    { key: "designService", label: "Design Service Included", type: "toggle", section: "Preparation & Delivery", sortOrder: 4 },
    { key: "sampleAvailable", label: "Sample Available", type: "toggle", section: "Preparation & Delivery", sortOrder: 5 },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// 14. TRANSPORT TEMPLATE
//     Used by: Wedding Cars, Limousines, Luxury Transport
// ────────────────────────────────────────────────────────────────────────────

const TRANSPORT_TEMPLATE: TemplateDef = {
  slug: "transport",
  name: "Transport Template",
  description: "Wedding cars, limousines, luxury transport, and guest shuttles.",
  ecosystem: "PIMPMYPARTY",
  icon: "Car",
  sections: [BASIC_SECTION, DETAILS_SECTION, PREP_SECTION],
  fields: [
    { key: "name", label: "Vehicle / Package name", type: "text", section: "Basic Information", sortOrder: 1, required: true, placeholder: "e.g. Vintage Wedding Car Hire" },
    { key: "packageType", label: "Package type", type: "select", section: "Basic Information", sortOrder: 2, staticOptions: ["basic", "standard", "premium", "custom"] },
    { key: "price", label: "Price", type: "number", section: "Basic Information", sortOrder: 3, required: true, placeholder: "0" },
    { key: "description", label: "Description", type: "textarea", section: "Basic Information", sortOrder: 4, placeholder: "Describe the vehicle and package...", span: 2 },
    { key: "images", label: "Vehicle Photos (up to 10)", type: "images", section: "Basic Information", sortOrder: 5, maxImages: 10, span: 2 },
    // Details
    { key: "vehicleType", label: "Vehicle Type", type: "chips", section: "Product Details", sortOrder: 10, staticOptions: ["Vintage Car", "Luxury Sedan", "Limousine", "Party Bus", "Guest Shuttle", "Sports Car", "Convertible", "Horse Carriage"], span: 2 },
    { key: "vehicleBrand", label: "Brand", type: "text", section: "Product Details", sortOrder: 11, placeholder: "e.g. Rolls Royce" },
    { key: "capacity", label: "Passenger Capacity", type: "number", section: "Product Details", sortOrder: 12, unit: "seats", placeholder: "4" },
    { key: "rentalDuration", label: "Rental Duration", type: "select", section: "Product Details", sortOrder: 13, staticOptions: ["Per hour", "Half day (4 hrs)", "Full day (8 hrs)", "Point to point", "Multi-day"], placeholder: "Select" },
    { key: "decorIncluded", label: "Flower Decoration Included", type: "toggle", section: "Product Details", sortOrder: 14 },
    { key: "chauffeurIncluded", label: "Chauffeur Included", type: "toggle", section: "Product Details", sortOrder: 15 },
    { key: "amenities", label: "Amenities", type: "chips", section: "Product Details", sortOrder: 16, staticOptions: ["AC", "Music System", "Mini Bar", "LED Lighting", "Privacy Partition", "Sunroof", "WiFi"], span: 2 },
    { key: "occasion", label: "Occasion", type: "chips", section: "Product Details", sortOrder: 17, filterGroupName: "Occasion", span: 2 },
    // Prep
    { key: "leadTime", label: "Booking Lead Time", type: "number", section: "Preparation & Delivery", sortOrder: 1, unit: "days", placeholder: "7" },
    { key: "serviceArea", label: "Service Area", type: "number", section: "Preparation & Delivery", sortOrder: 2, unit: "km", placeholder: "50" },
    { key: "driverBata", label: "Driver Bata Included", type: "toggle", section: "Preparation & Delivery", sortOrder: 3 },
    { key: "fuelIncluded", label: "Fuel Included", type: "toggle", section: "Preparation & Delivery", sortOrder: 4 },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// ALL TEMPLATES REGISTRY
// ────────────────────────────────────────────────────────────────────────────

export const ALL_TEMPLATES: TemplateDef[] = [
  CAKE_BAKERY_TEMPLATE,
  DECORATION_TEMPLATE,
  PHOTOGRAPHY_TEMPLATE,
  ENTERTAINMENT_TEMPLATE,
  VENUE_TEMPLATE,
  CATERING_TEMPLATE,
  RENTAL_TEMPLATE,
  PARTY_SUPPLIES_TEMPLATE,
  RETURN_GIFT_TEMPLATE,
  FLORIST_TEMPLATE,
  BEAUTY_TEMPLATE,
  STAFFING_TEMPLATE,
  PRINTING_TEMPLATE,
  TRANSPORT_TEMPLATE,
];

export function getTemplateBySlug(slug: string): TemplateDef | undefined {
  return ALL_TEMPLATES.find((t) => t.slug === slug);
}

// ────────────────────────────────────────────────────────────────────────────
// CATEGORY → TEMPLATE MAPPING
// This is the seed mapping. Admins can override via the DB (TemplateMapping).
// Resolution: subcategory-specific → category-level → ecosystem default.
// ────────────────────────────────────────────────────────────────────────────

export interface TemplateMappingSeed {
  categoryId: string;
  subcategory?: string;
  templateSlug: string;
}

export const TEMPLATE_MAPPINGS: TemplateMappingSeed[] = [
  // ── FINDMYBITES ──
  // All bakery categories → CakeBakeryTemplate
  { categoryId: "bakers-bakery", templateSlug: "cake-bakery" },
  { categoryId: "bakers-bakery", subcategory: "Wedding Cakes", templateSlug: "cake-bakery" },
  { categoryId: "bakers-bakery", subcategory: "Birthday Cakes", templateSlug: "cake-bakery" },
  { categoryId: "bakers-bakery", subcategory: "Custom Cakes", templateSlug: "cake-bakery" },
  { categoryId: "bakers-bakery", subcategory: "Cupcakes", templateSlug: "cake-bakery" },
  { categoryId: "bakers-bakery", subcategory: "Chocolates", templateSlug: "cake-bakery" },
  { categoryId: "bakers-bakery", subcategory: "Desserts", templateSlug: "cake-bakery" },
  // Backward compat: old category slugs
  { categoryId: "cake-artists", templateSlug: "cake-bakery" },
  { categoryId: "bakers", templateSlug: "cake-bakery" },
  { categoryId: "cupcake-specialists", templateSlug: "cake-bakery" },
  { categoryId: "chocolatiers", templateSlug: "cake-bakery" },
  { categoryId: "dessert-makers", templateSlug: "cake-bakery" },
  // Catering → CateringTemplate
  { categoryId: "caterers", templateSlug: "catering" },
  { categoryId: "catering", templateSlug: "catering" },
  // Chef & staff → StaffingTemplate (for service staff) or CateringTemplate
  { categoryId: "chef-staff", templateSlug: "staffing" },
  { categoryId: "private-chefs", templateSlug: "catering" },
  // Food trucks → CateringTemplate
  { categoryId: "food-trucks", templateSlug: "catering" },
  // Beverage specialists → CateringTemplate
  { categoryId: "beverage-specialists", templateSlug: "catering" },
  // Specialty food → CateringTemplate
  { categoryId: "specialty-food", templateSlug: "catering" },
  { categoryId: "specialty-foods", templateSlug: "catering" },

  // ── PIMPMYPARTY ──
  // Decorators → DecorationTemplate
  { categoryId: "decorators", templateSlug: "decoration" },
  // Photographers → PhotographyTemplate
  { categoryId: "photographers", templateSlug: "photography" },
  // Videographers → PhotographyTemplate
  { categoryId: "videographers", templateSlug: "photography" },
  // DJs → EntertainmentTemplate
  { categoryId: "djs", templateSlug: "entertainment" },
  // Entertainers → EntertainmentTemplate
  { categoryId: "entertainers", templateSlug: "entertainment" },
  // Venues → VenueTemplate
  { categoryId: "venues", templateSlug: "venue" },
  // Florists → FloristTemplate
  { categoryId: "florists", templateSlug: "florist" },
  // Rental services → RentalTemplate
  { categoryId: "rental-services", templateSlug: "rental" },
  // Makeup artists → BeautyTemplate
  { categoryId: "makeup-artists", templateSlug: "beauty" },
  // Beauty services → BeautyTemplate
  { categoryId: "beauty-services", templateSlug: "beauty" },
  // Transportation → TransportTemplate
  { categoryId: "transportation", templateSlug: "transport" },
  // Invitation & printing → PrintingTemplate
  { categoryId: "invitation-printing", templateSlug: "printing" },
  // Kids party services → EntertainmentTemplate
  { categoryId: "kids-party-services", templateSlug: "entertainment" },
  // Audio visual services → RentalTemplate
  { categoryId: "audio-visual-services", templateSlug: "rental" },
  // Party supplies → PartySuppliesTemplate
  { categoryId: "party-supplies", templateSlug: "party-supplies" },
  // Event planners → EntertainmentTemplate (planning packages)
  { categoryId: "event-planners", templateSlug: "entertainment" },
];

/**
 * Resolve which template slug to use for a given category + subcategory.
 * Checks subcategory-specific mappings first, then category-level.
 * Falls back to null if no mapping found.
 */
export function resolveTemplateSlug(
  category: string,
  subcategory?: string | null
): string | null {
  // 1. Subcategory-specific
  if (subcategory) {
    const sub = TEMPLATE_MAPPINGS.find(
      (m) => m.categoryId === category && m.subcategory === subcategory
    );
    if (sub) return sub.templateSlug;
  }
  // 2. Category-level
  const cat = TEMPLATE_MAPPINGS.find(
    (m) => m.categoryId === category && !m.subcategory
  );
  if (cat) return cat.templateSlug;
  // 3. No mapping
  return null;
}
