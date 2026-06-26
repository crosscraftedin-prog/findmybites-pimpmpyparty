import type { Ecosystem } from "./types";

export interface ProductTemplate {
  name: string;
  packageType: "basic" | "standard" | "premium";
  description: string;
  suggestedPrice: number;
  capacity?: number;
  duration?: string;
  includes: string[];
  dietaryTags?: string[];
}

const TEMPLATES: Record<string, ProductTemplate[]> = {
  // ── FINDMYBITES ──
  "bakers-bakery": [
    { name: "Custom Wedding Cake", packageType: "premium", description: "3-tier custom wedding cake, feeds 80 guests. Your choice of flavours and design.", suggestedPrice: 850, capacity: 80, includes: ["3 tiers", "Custom design", "Tasting session", "Delivery included"] },
    { name: "Birthday Cake", packageType: "standard", description: "Custom birthday cake design, feeds 20 guests.", suggestedPrice: 120, capacity: 20, includes: ["Custom design", "Choice of flavours", "Candles included"] },
    { name: "Cupcake Tower", packageType: "standard", description: "50 assorted cupcakes with decorative display.", suggestedPrice: 150, capacity: 50, includes: ["50 cupcakes", "Assorted flavours", "Display stand", "Decorative toppings"] },
  ],
  "caterers": [
    { name: "Wedding Buffet Package", packageType: "standard", description: "Per head buffet catering, minimum 50 guests.", suggestedPrice: 45, capacity: 50, includes: ["3-course buffet", "Serving staff", "Setup and cleanup", "Customizable menu"] },
    { name: "Corporate Lunch Box", packageType: "basic", description: "Per person lunch box delivery, minimum 20.", suggestedPrice: 15, capacity: 20, includes: ["Main course", "Side dish", "Dessert", "Delivered to office"] },
    { name: "Full Wedding Catering", packageType: "premium", description: "Complete wedding catering with starter, main and dessert.", suggestedPrice: 85, capacity: 200, includes: ["5-course meal", "Welcome drinks", "Live stations", "Dessert table", "Full staff"] },
  ],
  "chef-staff": [
    { name: "Private Dinner Experience", packageType: "premium", description: "3-course private dinner for 2-8 guests in your home.", suggestedPrice: 250, capacity: 8, includes: ["3-course menu", "Ingredient sourcing", "Cooking on-site", "Cleanup"] },
    { name: "Cooking Class for Groups", packageType: "standard", description: "Interactive cooking class for up to 10 people.", suggestedPrice: 80, capacity: 10, includes: ["Hands-on cooking", "All ingredients", "Recipe cards", "Take home what you cook"] },
    { name: "Private Chef for Events", packageType: "premium", description: "Full event catering for up to 50 guests.", suggestedPrice: 500, capacity: 50, includes: ["Custom menu", "Full service", "All equipment", "Staff included"] },
  ],
  "food-trucks": [
    { name: "2-Hour Street Food Service", packageType: "basic", description: "Food truck service for up to 50 guests, 2 hours.", suggestedPrice: 400, capacity: 50, duration: "2 hours", includes: ["Street food menu", "Food truck", "Server", "Biodegradable packaging"] },
    { name: "Half Day Event Package", packageType: "standard", description: "4-hour food truck service for up to 100 guests.", suggestedPrice: 800, capacity: 100, duration: "4 hours", includes: ["Extended menu", "2 servers", "Drinks station", "Setup included"] },
    { name: "Full Day Festival Package", packageType: "premium", description: "8-hour food truck for festivals, up to 200 guests.", suggestedPrice: 1500, capacity: 200, duration: "8 hours", includes: ["Full menu", "3 staff members", "Drinks and dessert", "Power generator"] },
  ],
  // ── PIMPMYPARTY ──
  "event-planners": [
    { name: "Full Wedding Planning Package", packageType: "premium", description: "12 months of full wedding planning support.", suggestedPrice: 5000, duration: "12 months", includes: ["Venue sourcing", "Vendor coordination", "Timeline management", "Day-of coordination", "Budget planning"] },
    { name: "Day-of Coordination Package", packageType: "standard", description: "Coordination on the day of your event.", suggestedPrice: 800, duration: "1 day", includes: ["Timeline management", "Vendor liaison", "Setup oversight", "Emergency kit"] },
    { name: "Birthday Party Planning", packageType: "standard", description: "Full service birthday party planning.", suggestedPrice: 600, includes: ["Theme concept", "Vendor booking", "Decor coordination", "Day-of management"] },
  ],
  "decorators": [
    { name: "Basic Room Decoration", packageType: "basic", description: "Standard room decoration for small events.", suggestedPrice: 300, includes: ["Balloon arch", "Table centerpieces", "Backdrop", "Lighting"] },
    { name: "Standard Wedding Decoration", packageType: "standard", description: "Ceremony and reception decoration.", suggestedPrice: 1500, includes: ["Ceremony arch", "Reception centerpieces", "Lighting design", "Table setup", "Chair covers"] },
    { name: "Premium Full Venue Transformation", packageType: "premium", description: "Complete venue transformation for luxury events.", suggestedPrice: 5000, includes: ["Full venue design", "Custom floral arrangements", "Premium lighting", "Lounge furniture", "Dance floor decor"] },
  ],
  "photographers": [
    { name: "2-Hour Event Photography", packageType: "basic", description: "2 hours of event coverage with 50 edited photos.", suggestedPrice: 300, duration: "2 hours", includes: ["2-hour coverage", "50 edited photos", "Online gallery", "Print release"] },
    { name: "Half Day Coverage", packageType: "standard", description: "4 hours coverage with 100 edited photos.", suggestedPrice: 600, duration: "4 hours", includes: ["4-hour coverage", "100 edited photos", "Online gallery", "Print release", "Second shooter"] },
    { name: "Full Day Wedding Photography", packageType: "premium", description: "8 hours coverage with album.", suggestedPrice: 1200, duration: "8 hours", includes: ["8-hour coverage", "300+ edited photos", "Premium album", "Online gallery", "Second shooter", "Engagement session"] },
  ],
  "djs": [
    { name: "3-Hour Party DJ Package", packageType: "basic", description: "3-hour DJ set with equipment included.", suggestedPrice: 400, duration: "3 hours", includes: ["3-hour DJ set", "Sound system", "Lighting", "Microphone"] },
    { name: "Wedding DJ Package", packageType: "premium", description: "6-hour DJ with MC services.", suggestedPrice: 900, duration: "6 hours", includes: ["6-hour DJ set", "MC services", "Premium sound system", "Dance floor lighting", "Custom playlist"] },
    { name: "Corporate Event DJ", packageType: "standard", description: "4-hour professional DJ for corporate events.", suggestedPrice: 600, duration: "4 hours", includes: ["4-hour DJ set", "Professional sound system", "Background music during breaks", "Microphone for speeches"] },
  ],
  "venues": [
    { name: "Half Day Venue Hire", packageType: "basic", description: "Half day venue for up to 50 guests.", suggestedPrice: 800, capacity: 50, duration: "4 hours", includes: ["4-hour venue hire", "Tables and chairs", "Basic AV equipment", "Parking"] },
    { name: "Full Day Venue Hire", packageType: "standard", description: "Full day venue for up to 100 guests.", suggestedPrice: 1500, capacity: 100, duration: "8 hours", includes: ["8-hour venue hire", "Tables and chairs", "Full AV equipment", "Kitchen access", "Dedicated coordinator"] },
    { name: "Weekend Wedding Package", packageType: "premium", description: "Full weekend venue for ceremony and reception.", suggestedPrice: 5000, capacity: 150, duration: "Weekend", includes: ["2-day venue hire", "Ceremony and reception spaces", "Bridal suite", "Full AV equipment", "On-site coordinator", "Setup and cleanup"] },
  ],
  "florists": [
    { name: "Bridal Bouquet + Buttonholes", packageType: "basic", description: "Bridal bouquet with matching buttonholes.", suggestedPrice: 250, includes: ["Bridal bouquet", "5 buttonholes", "2 bridesmaid bouquets", "Ribbon and wrapping"] },
    { name: "Wedding Ceremony Flowers", packageType: "standard", description: "Complete ceremony flower package.", suggestedPrice: 800, includes: ["Ceremony arch flowers", "Aisle decorations", "Table centerpieces", "Bridal bouquet"] },
    { name: "Full Wedding Flowers", packageType: "premium", description: "Complete wedding flowers for ceremony and reception.", suggestedPrice: 2000, includes: ["Ceremony and reception flowers", "Bridal party bouquets", "Table centerpieces", "Flower wall", "Cake flowers"] },
  ],
  "videographers": [
    { name: "2-Hour Event Video", packageType: "basic", description: "2-hour event coverage with highlight reel.", suggestedPrice: 400, duration: "2 hours", includes: ["2-hour coverage", "3-minute highlight reel", "Digital delivery", "Background music"] },
    { name: "Full Day Wedding Video", packageType: "premium", description: "Full day wedding videography with edited film.", suggestedPrice: 1500, duration: "8 hours", includes: ["8-hour coverage", "10-minute wedding film", "Highlight reel", "Raw footage", "Drone shots"] },
    { name: "Corporate Promo Video", packageType: "standard", description: "1-minute professionally edited promo video.", suggestedPrice: 600, includes: ["Half-day shoot", "1-minute edited video", "Background music", "2 rounds of revisions"] },
  ],
  "entertainers": [
    { name: "1-Hour Magic Show", packageType: "basic", description: "Interactive magic show for up to 30 kids.", suggestedPrice: 200, capacity: 30, duration: "1 hour", includes: ["1-hour magic show", "Audience participation", "Balloon animals", "Photo opportunity"] },
    { name: "Face Painting Session", packageType: "basic", description: "2-hour face painting for up to 40 kids.", suggestedPrice: 180, capacity: 40, duration: "2 hours", includes: ["2-hour face painting", "30+ designs", "Hypoallergenic paint", "Glitter tattoos"] },
    { name: "Full Kids Party Package", packageType: "premium", description: "Complete kids party with entertainer, decor and activities.", suggestedPrice: 600, capacity: 30, duration: "3 hours", includes: ["3-hour entertainment", "Magic show", "Face painting", "Balloon twisting", "Party games", "Small decor package"] },
  ],
};

export function getTemplates(ecosystem: Ecosystem, category: string): ProductTemplate[] {
  return TEMPLATES[category] ?? [];
}

export function getAllTemplates(): Record<string, ProductTemplate[]> {
  return TEMPLATES;
}
