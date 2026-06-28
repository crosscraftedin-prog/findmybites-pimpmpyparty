import type { Metadata } from "next";
import { db } from "./db";

/**
 * Dubai & UAE cake keyword landing pages — dedicated SSR SEO pages targeting
 * high-intent cake searches in Dubai, Abu Dhabi, and the wider UAE.
 *
 * Each entry maps a URL slug → a keyword + location + FAQs + price guide +
 * related searches, rendered via the shared CakeLanding server component.
 */

export interface CakePriceRow {
  type: string;
  range: string;
  includes: string;
}

export interface CakePage {
  slug: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  subtitle: string;
  /** Display location, e.g. "Dubai" | "Abu Dhabi" | "the UAE" */
  location: string;
  /** "city" (Dubai/Abu Dhabi) or "country" (UAE-wide) */
  locationScope: "city" | "country";
  /** City name used to filter vendors in the DB (case-insensitive) */
  city?: string;
  /** Short category label for headings, e.g. "Wedding Cakes" */
  categoryLabel: string;
  /** Lowercase keyword used in body copy, e.g. "wedding cakes" */
  keyword: string;
  /** Search bar placeholder */
  searchPlaceholder: string;
  faqs: { q: string; a: string }[];
  prices: CakePriceRow[];
  related: { label: string; slug: string }[];
}

/** AED price guide shared across most Dubai cake pages. */
const DUBAI_CAKE_PRICES: CakePriceRow[] = [
  { type: "Simple birthday cake", range: "AED 150 – 300", includes: "Basic design, 1 tier, standard flavours" },
  { type: "Custom wedding cake", range: "AED 800 – 3,000", includes: "3 tiers, custom design, fondant finish" },
  { type: "Smash cake set", range: "AED 200 – 400", includes: "Smash cake + photo props" },
  { type: "Cupcake tower (50)", range: "AED 300 – 600", includes: "Assorted flavours, display stand" },
];

const ABU_DHABI_CAKE_PRICES: CakePriceRow[] = [
  { type: "Simple birthday cake", range: "AED 150 – 280", includes: "Basic design, 1 tier, standard flavours" },
  { type: "Custom wedding cake", range: "AED 700 – 2,500", includes: "3 tiers, custom design, fondant finish" },
  { type: "Smash cake set", range: "AED 180 – 380", includes: "Smash cake + photo props" },
  { type: "Cupcake tower (50)", range: "AED 280 – 550", includes: "Assorted flavours, display stand" },
];

const UAE_CAKE_PRICES: CakePriceRow[] = [
  { type: "Simple birthday cake", range: "AED 150 – 300", includes: "Basic design, 1 tier, standard flavours" },
  { type: "Custom wedding cake", range: "AED 700 – 3,000", includes: "3 tiers, custom design, fondant finish" },
  { type: "Smash cake set", range: "AED 180 – 400", includes: "Smash cake + photo props" },
  { type: "Cupcake tower (50)", range: "AED 280 – 600", includes: "Assorted flavours, display stand" },
];

export const CAKE_PAGES: CakePage[] = [
  {
    slug: "wedding-cakes-dubai",
    h1: "Wedding Cake Makers in Dubai",
    metaTitle: "Wedding Cakes Dubai — Custom & Luxury | FindMyBites",
    metaDescription:
      "Find the best wedding cake makers in Dubai. Browse verified bakers, compare prices from AED 800, and enquire for free. Halal options available.",
    subtitle:
      "From elegant tiered cakes to floral masterpieces — find Dubai's finest wedding cake artists",
    location: "Dubai",
    locationScope: "city",
    city: "Dubai",
    categoryLabel: "Wedding Cakes",
    keyword: "wedding cakes",
    searchPlaceholder: "Search wedding cake makers in Dubai…",
    faqs: [
      {
        q: "How much does a wedding cake cost in Dubai?",
        a: "Wedding cakes in Dubai typically cost between AED 800–3,000 depending on size, tiers, and design complexity. Custom fondant cakes and sugar flowers cost more. Most bakers offer free tastings — ask when you enquire.",
      },
      {
        q: "How far in advance should I order a wedding cake in Dubai?",
        a: "Most Dubai wedding cake makers recommend booking 2–3 months in advance, especially for peak wedding season (October–April). Custom designs may require more lead time.",
      },
      {
        q: "Are there Halal wedding cake options in Dubai?",
        a: "Yes — all cake makers on FindMyBites in Dubai offer Halal-certified ingredients. You can filter by Halal when browsing.",
      },
      {
        q: "Can I get a free tasting before ordering?",
        a: "Many Dubai cake makers offer complimentary tasting sessions. Ask about this when you send your enquiry through FindMyBites.",
      },
      {
        q: "What wedding cake styles are popular in Dubai?",
        a: "Popular styles in Dubai include luxury fondant cakes, fresh floral designs, Arabic-inspired gold leaf cakes, and minimalist buttercream designs.",
      },
    ],
    prices: DUBAI_CAKE_PRICES,
    related: [
      { label: "Birthday Cakes Dubai", slug: "birthday-cakes-dubai" },
      { label: "Smash Cakes Dubai", slug: "smash-cakes-dubai" },
      { label: "Custom Cakes Dubai", slug: "custom-cakes-dubai" },
      { label: "Halal Cakes Dubai", slug: "halal-cakes-dubai" },
    ],
  },
  {
    slug: "wedding-cakes-abu-dhabi",
    h1: "Wedding Cake Makers in Abu Dhabi",
    metaTitle: "Wedding Cakes Abu Dhabi — Custom Luxury | FindMyBites",
    metaDescription:
      "Find wedding cake makers in Abu Dhabi. Custom designs, Halal certified, delivery across Abu Dhabi. Compare prices and enquire free on FindMyBites.",
    subtitle:
      "Abu Dhabi's finest wedding cake artists — from traditional to contemporary designs",
    location: "Abu Dhabi",
    locationScope: "city",
    city: "Abu Dhabi",
    categoryLabel: "Wedding Cakes",
    keyword: "wedding cakes",
    searchPlaceholder: "Search wedding cake makers in Abu Dhabi…",
    faqs: [
      {
        q: "How much does a wedding cake cost in Abu Dhabi?",
        a: "Wedding cakes in Abu Dhabi range from AED 700–2,500 depending on design complexity and number of tiers. Custom fondant work and sugar flowers increase the price.",
      },
      {
        q: "Do wedding cake makers in Abu Dhabi deliver to Yas Island or Saadiyat Island?",
        a: "Yes — most Abu Dhabi cake makers deliver to all areas including Yas Island, Saadiyat Island, Al Reem Island and beyond.",
      },
      {
        q: "Are there wedding cake makers in Abu Dhabi who specialise in Arabic designs?",
        a: "Yes — many Abu Dhabi cake makers create stunning Arabic-inspired wedding cakes featuring gold leaf, Arabic calligraphy and traditional patterns.",
      },
      {
        q: "How far in advance should I order a wedding cake in Abu Dhabi?",
        a: "Book 2–3 months in advance for peak season (October–April). Custom designs may need 4+ weeks lead time.",
      },
      {
        q: "Are Halal wedding cakes available in Abu Dhabi?",
        a: "Yes — all cake vendors on FindMyBites in Abu Dhabi use Halal-certified ingredients.",
      },
    ],
    prices: ABU_DHABI_CAKE_PRICES,
    related: [
      { label: "Birthday Cakes Abu Dhabi", slug: "birthday-cakes-abu-dhabi" },
      { label: "Wedding Cakes Dubai", slug: "wedding-cakes-dubai" },
      { label: "Wedding Cakes UAE", slug: "wedding-cakes-uae" },
      { label: "Custom Cakes Dubai", slug: "custom-cakes-dubai" },
    ],
  },
  {
    slug: "wedding-cakes-uae",
    h1: "Wedding Cake Makers in the UAE",
    metaTitle: "Wedding Cakes UAE — Dubai, Abu Dhabi & Beyond | FindMyBites",
    metaDescription:
      "Find wedding cake makers across the UAE. Browse verified bakers in Dubai, Abu Dhabi, Sharjah. Custom designs, Halal certified. Free enquiry on FindMyBites.",
    subtitle:
      "The UAE's most trusted wedding cake directory — Dubai, Abu Dhabi, Sharjah and beyond",
    location: "the UAE",
    locationScope: "country",
    categoryLabel: "Wedding Cakes",
    keyword: "wedding cakes",
    searchPlaceholder: "Search wedding cake makers in the UAE…",
    faqs: [
      {
        q: "How much does a wedding cake cost in the UAE?",
        a: "Wedding cakes in the UAE range from AED 700–3,000 depending on city, size, tiers, and design. Dubai tends to be at the higher end; Sharjah and the Northern Emirates are often more affordable.",
      },
      {
        q: "Do UAE cake makers deliver between emirates?",
        a: "Many UAE cake makers deliver between Dubai, Abu Dhabi, and Sharjah for a fee. Confirm delivery areas and charges when you enquire.",
      },
      {
        q: "Are all wedding cakes in the UAE Halal?",
        a: "All cake vendors on FindMyBites in the UAE use Halal-certified ingredients. Look for the Halal badge on each vendor profile.",
      },
      {
        q: "Which cities does FindMyBites cover for wedding cakes?",
        a: "We list verified wedding cake makers across Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain.",
      },
    ],
    prices: UAE_CAKE_PRICES,
    related: [
      { label: "Wedding Cakes Dubai", slug: "wedding-cakes-dubai" },
      { label: "Wedding Cakes Abu Dhabi", slug: "wedding-cakes-abu-dhabi" },
      { label: "Birthday Cakes Dubai", slug: "birthday-cakes-dubai" },
      { label: "Custom Cakes Dubai", slug: "custom-cakes-dubai" },
    ],
  },
  {
    slug: "birthday-cakes-dubai",
    h1: "Birthday Cake Makers in Dubai",
    metaTitle: "Birthday Cakes Dubai — Custom & Delivered | FindMyBites",
    metaDescription:
      "Order custom birthday cakes in Dubai. Browse verified bakers from AED 150, kids themes, adult designs, same-day options. Free enquiry, no commission.",
    subtitle:
      "Custom birthday cakes for every age — from kids' themed cakes to luxury adult designs",
    location: "Dubai",
    locationScope: "city",
    city: "Dubai",
    categoryLabel: "Birthday Cakes",
    keyword: "birthday cakes",
    searchPlaceholder: "Search birthday cake makers in Dubai…",
    faqs: [
      {
        q: "How much does a birthday cake cost in Dubai?",
        a: "Birthday cakes in Dubai range from AED 150 for simple designs to AED 800+ for elaborate custom creations. Kids themed cakes typically cost AED 200–500.",
      },
      {
        q: "Can I order a birthday cake with same-day delivery in Dubai?",
        a: "Some Dubai cake makers offer same-day or next-day delivery for standard designs. Custom cakes need 3–7 days notice. Check each vendor's lead time when enquiring.",
      },
      {
        q: "What are popular birthday cake themes for kids in Dubai?",
        a: "Popular kids cake themes in Dubai include superheroes, princesses, dinosaurs, unicorns, cartoon characters, and sports themes.",
      },
      {
        q: "Do cake makers in Dubai deliver to hotels?",
        a: "Yes — most Dubai cake makers deliver to hotels, villas, and event venues across Dubai, Abu Dhabi, and Sharjah.",
      },
      {
        q: "Can I get a birthday cake with Arabic writing in Dubai?",
        a: "Absolutely — many Dubai bakers specialise in cakes with Arabic calligraphy and traditional Arabic design elements.",
      },
    ],
    prices: DUBAI_CAKE_PRICES,
    related: [
      { label: "Smash Cakes Dubai", slug: "smash-cakes-dubai" },
      { label: "Birthday Cake Delivery Dubai", slug: "birthday-cake-delivery-dubai" },
      { label: "Wedding Cakes Dubai", slug: "wedding-cakes-dubai" },
      { label: "Custom Cakes Dubai", slug: "custom-cakes-dubai" },
    ],
  },
  {
    slug: "birthday-cakes-abu-dhabi",
    h1: "Birthday Cake Makers in Abu Dhabi",
    metaTitle: "Birthday Cakes Abu Dhabi — Custom & Delivered | FindMyBites",
    metaDescription:
      "Order custom birthday cakes in Abu Dhabi. Kids themes, adult designs, Halal options. Prices from AED 150. Browse verified bakers on FindMyBites.",
    subtitle:
      "Custom birthday cakes for every celebration across Abu Dhabi — from kids' themes to elegant adult designs",
    location: "Abu Dhabi",
    locationScope: "city",
    city: "Abu Dhabi",
    categoryLabel: "Birthday Cakes",
    keyword: "birthday cakes",
    searchPlaceholder: "Search birthday cake makers in Abu Dhabi…",
    faqs: [
      {
        q: "How much does a birthday cake cost in Abu Dhabi?",
        a: "Birthday cakes in Abu Dhabi range from AED 150 for simple designs to AED 700+ for custom creations. Kids themed cakes typically cost AED 200–450.",
      },
      {
        q: "Can I get same-day birthday cake delivery in Abu Dhabi?",
        a: "Some Abu Dhabi cake makers offer same-day or next-day delivery for standard designs. Custom cakes need 3–7 days notice.",
      },
      {
        q: "Do Abu Dhabi cake makers deliver to Yas Island and Saadiyat?",
        a: "Yes — most Abu Dhabi bakers deliver to Yas Island, Saadiyat Island, Al Reem Island, and the wider emirate.",
      },
      {
        q: "Are Halal birthday cakes available in Abu Dhabi?",
        a: "Yes — all cake vendors on FindMyBites in Abu Dhabi use Halal-certified ingredients.",
      },
      {
        q: "What kids cake themes are popular in Abu Dhabi?",
        a: "Popular themes include princesses, superheroes, unicorns, dinosaurs, football, and cartoon characters.",
      },
    ],
    prices: ABU_DHABI_CAKE_PRICES,
    related: [
      { label: "Wedding Cakes Abu Dhabi", slug: "wedding-cakes-abu-dhabi" },
      { label: "Birthday Cakes Dubai", slug: "birthday-cakes-dubai" },
      { label: "Custom Cakes Dubai", slug: "custom-cakes-dubai" },
      { label: "Halal Cakes Dubai", slug: "halal-cakes-dubai" },
    ],
  },
  {
    slug: "smash-cakes-dubai",
    h1: "Smash Cake Makers in Dubai",
    metaTitle: "Smash Cakes Dubai — Baby's First Birthday | FindMyBites",
    metaDescription:
      "Find smash cake makers in Dubai for your baby's first birthday. Custom designs from AED 150. Includes photo-ready cakes for your smash cake session.",
    subtitle:
      "Make your baby's first birthday unforgettable with a beautiful smash cake",
    location: "Dubai",
    locationScope: "city",
    city: "Dubai",
    categoryLabel: "Smash Cakes",
    keyword: "smash cakes",
    searchPlaceholder: "Search smash cake makers in Dubai…",
    faqs: [
      {
        q: "What is a smash cake?",
        a: "A smash cake is a small individual cake made for babies at their first birthday photoshoot. The baby is encouraged to dig into and smash the cake while photos are taken — creating adorable and memorable images.",
      },
      {
        q: "How much does a smash cake cost in Dubai?",
        a: "Smash cakes in Dubai typically cost AED 150–400. Many cake makers offer smash cake sets that include a matching large cake for the party guests.",
      },
      {
        q: "Do I need a photographer for a smash cake session?",
        a: "A photographer is recommended to capture the moment. Many Dubai photographers offer smash cake session packages — browse on FindMyBites under Photography.",
      },
      {
        q: "What flavours are popular for smash cakes in Dubai?",
        a: "Popular smash cake flavours include vanilla, strawberry, chocolate, and lemon. Most Dubai cake makers can accommodate Halal and egg-free requirements on request.",
      },
      {
        q: "How far in advance should I order a smash cake in Dubai?",
        a: "Order your smash cake at least 5–7 days in advance. For decorated or themed smash cakes, allow 1–2 weeks.",
      },
    ],
    prices: DUBAI_CAKE_PRICES,
    related: [
      { label: "Birthday Cakes Dubai", slug: "birthday-cakes-dubai" },
      { label: "Custom Cakes Dubai", slug: "custom-cakes-dubai" },
      { label: "Birthday Cake Delivery Dubai", slug: "birthday-cake-delivery-dubai" },
      { label: "Vegan Cakes Dubai", slug: "vegan-cakes-dubai" },
    ],
  },
  {
    slug: "custom-cakes-dubai",
    h1: "Custom Cake Makers in Dubai",
    metaTitle: "Custom Cakes Dubai — Made to Order | FindMyBites",
    metaDescription:
      "Order custom cakes in Dubai for any occasion. Weddings, birthdays, corporate events. Verified bakers, prices from AED 150. Enquire free on FindMyBites.",
    subtitle: "Any occasion, any design — Dubai's best custom cake makers",
    location: "Dubai",
    locationScope: "city",
    city: "Dubai",
    categoryLabel: "Custom Cakes",
    keyword: "custom cakes",
    searchPlaceholder: "Search custom cake makers in Dubai…",
    faqs: [
      {
        q: "How much do custom cakes cost in Dubai?",
        a: "Custom cakes in Dubai start from AED 150 for simple designs and can exceed AED 3,000 for elaborate wedding and corporate creations. Price depends on size, design complexity, and ingredients.",
      },
      {
        q: "How much notice does a custom cake need in Dubai?",
        a: "Most Dubai custom cake makers need 3–7 days for bespoke designs, and 2–4 weeks for large wedding cakes. Always check lead times when enquiring.",
      },
      {
        q: "Can Dubai bakers make corporate and branded cakes?",
        a: "Yes — many Dubai cake makers specialise in corporate cakes including logo cakes, branded cupcakes, and edible-print designs for product launches and events.",
      },
      {
        q: "Do custom cake makers in Dubai offer Halal and vegan options?",
        a: "Yes. All vendors use Halal-certified ingredients, and several offer vegan, eggless, and gluten-free custom cakes on request.",
      },
      {
        q: "Do custom cake makers in Dubai deliver?",
        a: "Most deliver across Dubai, Abu Dhabi, and Sharjah. Delivery fees vary by area — confirm when you enquire.",
      },
    ],
    prices: DUBAI_CAKE_PRICES,
    related: [
      { label: "Wedding Cakes Dubai", slug: "wedding-cakes-dubai" },
      { label: "Birthday Cakes Dubai", slug: "birthday-cakes-dubai" },
      { label: "Cake Delivery Dubai", slug: "cake-delivery-dubai" },
      { label: "Vegan Cakes Dubai", slug: "vegan-cakes-dubai" },
    ],
  },
  {
    slug: "cake-delivery-dubai",
    h1: "Cake Delivery in Dubai",
    metaTitle: "Cake Delivery Dubai — Same Day & Next Day | FindMyBites",
    metaDescription:
      "Order cake delivery in Dubai. Birthday, wedding and celebration cakes delivered to your door. Compare bakers, prices from AED 150. Free enquiry.",
    subtitle:
      "Fresh custom cakes delivered across Dubai — same day and next day options available",
    location: "Dubai",
    locationScope: "city",
    city: "Dubai",
    categoryLabel: "Cake Delivery",
    keyword: "cake delivery",
    searchPlaceholder: "Search cake delivery in Dubai…",
    faqs: [
      {
        q: "Is same-day cake delivery available in Dubai?",
        a: "Yes — several Dubai cake makers offer same-day delivery on standard designs, subject to availability. Custom cakes typically need 1–3 days notice.",
      },
      {
        q: "How much does cake delivery cost in Dubai?",
        a: "Delivery within Dubai usually costs AED 25–60 depending on area. Many bakers offer free delivery on orders above a certain value. Delivery to Abu Dhabi or Sharjah costs more.",
      },
      {
        q: "Do Dubai cake makers deliver to hotels and venues?",
        a: "Yes — most deliver to hotels, restaurants, villas, and event venues across Dubai. Some venues require delivery coordination — mention your venue when enquiring.",
      },
      {
        q: "What areas of Dubai do cake makers deliver to?",
        a: "Most deliver across all Dubai areas including Downtown, Marina, JBR, Business Bay, JLT, Palm Jumeirah, Arabian Ranches, and Dubai Hills.",
      },
      {
        q: "Can I schedule a specific delivery time in Dubai?",
        a: "Many Dubai bakers allow you to choose a delivery date and time window. Confirm scheduling options when you send your enquiry.",
      },
    ],
    prices: DUBAI_CAKE_PRICES,
    related: [
      { label: "Birthday Cake Delivery Dubai", slug: "birthday-cake-delivery-dubai" },
      { label: "Birthday Cakes Dubai", slug: "birthday-cakes-dubai" },
      { label: "Custom Cakes Dubai", slug: "custom-cakes-dubai" },
      { label: "Wedding Cakes Dubai", slug: "wedding-cakes-dubai" },
    ],
  },
  {
    slug: "wedding-cake-maker-dubai",
    h1: "Wedding Cake Makers in Dubai",
    metaTitle: "Wedding Cake Maker Dubai — Custom Luxury Cakes | FindMyBites",
    metaDescription:
      "Find a wedding cake maker in Dubai. Custom luxury cakes, Halal certified, from AED 800. Browse verified bakers and enquire free on FindMyBites.",
    subtitle:
      "Dubai's specialist wedding cake makers — bespoke designs for your big day",
    location: "Dubai",
    locationScope: "city",
    city: "Dubai",
    categoryLabel: "Wedding Cake Makers",
    keyword: "wedding cake maker",
    searchPlaceholder: "Search wedding cake makers in Dubai…",
    faqs: [
      {
        q: "How do I find the right wedding cake maker in Dubai?",
        a: "Browse verified wedding cake makers in Dubai on FindMyBites. Compare galleries, read reviews, check pricing, and message bakers directly via WhatsApp — no commission.",
      },
      {
        q: "How much does a wedding cake maker charge in Dubai?",
        a: "Dubai wedding cake makers typically charge AED 800–3,000 depending on tiers, design, and servings. Bespoke sugar-flower work and gold leaf detailing costs more.",
      },
      {
        q: "Do Dubai wedding cake makers offer tastings?",
        a: "Many do — some offer complimentary tastings, others charge a small fee that's credited toward your order. Ask about tastings when you enquire.",
      },
      {
        q: "Can a Dubai wedding cake maker replicate a design I found online?",
        a: "Most Dubai cake makers can recreate inspiration designs, adapting them to your colours, flavours, and budget. Share your reference images when enquiring.",
      },
      {
        q: "Are Dubai wedding cake makers Halal-certified?",
        a: "Yes — all wedding cake makers on FindMyBites in Dubai use Halal-certified ingredients.",
      },
    ],
    prices: DUBAI_CAKE_PRICES,
    related: [
      { label: "Wedding Cakes Dubai", slug: "wedding-cakes-dubai" },
      { label: "Custom Cakes Dubai", slug: "custom-cakes-dubai" },
      { label: "Birthday Cakes Dubai", slug: "birthday-cakes-dubai" },
      { label: "Halal Cakes Dubai", slug: "halal-cakes-dubai" },
    ],
  },
  {
    slug: "birthday-cake-delivery-dubai",
    h1: "Birthday Cake Delivery in Dubai",
    metaTitle: "Birthday Cake Delivery Dubai — Custom & Fresh | FindMyBites",
    metaDescription:
      "Order birthday cake delivery in Dubai. Custom designs for kids and adults, delivered fresh. Prices from AED 150. Browse verified bakers on FindMyBites.",
    subtitle:
      "Fresh, custom birthday cakes delivered across Dubai — for kids and adults alike",
    location: "Dubai",
    locationScope: "city",
    city: "Dubai",
    categoryLabel: "Birthday Cake Delivery",
    keyword: "birthday cake delivery",
    searchPlaceholder: "Search birthday cake delivery in Dubai…",
    faqs: [
      {
        q: "Can I get a birthday cake delivered same-day in Dubai?",
        a: "Yes — several Dubai bakers offer same-day birthday cake delivery on standard designs. Custom themed cakes usually need 2–5 days notice.",
      },
      {
        q: "How much is birthday cake delivery in Dubai?",
        a: "Delivery within Dubai typically costs AED 25–60 depending on the area. Some bakers offer free delivery on larger orders.",
      },
      {
        q: "Do Dubai bakers deliver birthday cakes to hotels and party venues?",
        a: "Yes — most deliver to hotels, villas, party halls, and parks across Dubai. Mention your venue when enquiring so the baker can coordinate timing.",
      },
      {
        q: "Can I add a name or message to a delivered birthday cake?",
        a: "Absolutely — most Dubai bakers include a name and short message free of charge. Arabic and English writing are both widely available.",
      },
      {
        q: "Are Halal birthday cakes available for delivery in Dubai?",
        a: "Yes — all birthday cake vendors on FindMyBites in Dubai use Halal-certified ingredients.",
      },
    ],
    prices: DUBAI_CAKE_PRICES,
    related: [
      { label: "Birthday Cakes Dubai", slug: "birthday-cakes-dubai" },
      { label: "Cake Delivery Dubai", slug: "cake-delivery-dubai" },
      { label: "Smash Cakes Dubai", slug: "smash-cakes-dubai" },
      { label: "Custom Cakes Dubai", slug: "custom-cakes-dubai" },
    ],
  },
  {
    slug: "halal-cakes-dubai",
    h1: "Halal Cake Makers in Dubai",
    metaTitle: "Halal Cakes Dubai — Certified & Custom | FindMyBites",
    metaDescription:
      "Find Halal certified cake makers in Dubai. All ingredients Halal certified. Custom wedding, birthday and celebration cakes. Browse and enquire free.",
    subtitle:
      "100% Halal certified cake makers in Dubai — because celebrations should never compromise on faith",
    location: "Dubai",
    locationScope: "city",
    city: "Dubai",
    categoryLabel: "Halal Cakes",
    keyword: "halal cakes",
    searchPlaceholder: "Search Halal cake makers in Dubai…",
    faqs: [
      {
        q: "Are all cakes on FindMyBites in Dubai Halal?",
        a: "All cake vendors on FindMyBites in Dubai use Halal-certified ingredients. Look for the Halal badge on vendor profiles.",
      },
      {
        q: "What makes a cake Halal in Dubai?",
        a: "Halal cakes use no alcohol in extracts or flavourings, no gelatin from non-Halal sources, and Halal-certified food colourings.",
      },
      {
        q: "Can I get a Halal wedding cake in Dubai?",
        a: "Yes — every wedding cake maker on FindMyBites in Dubai produces Halal-certified cakes, from simple buttercream to luxury fondant designs.",
      },
      {
        q: "Are Halal cakes more expensive in Dubai?",
        a: "No — Halal certification doesn't typically increase price. Costs depend on size, design, and ingredients, the same as any custom cake.",
      },
      {
        q: "Do Halal cake makers in Dubai also offer eggless and vegan options?",
        a: "Many do. Ask about eggless, vegan, or gluten-free Halal cakes when you enquire — most Dubai bakers accommodate these requests.",
      },
    ],
    prices: DUBAI_CAKE_PRICES,
    related: [
      { label: "Vegan Cakes Dubai", slug: "vegan-cakes-dubai" },
      { label: "Wedding Cakes Dubai", slug: "wedding-cakes-dubai" },
      { label: "Birthday Cakes Dubai", slug: "birthday-cakes-dubai" },
      { label: "Custom Cakes Dubai", slug: "custom-cakes-dubai" },
    ],
  },
  {
    slug: "vegan-cakes-dubai",
    h1: "Vegan Cake Makers in Dubai",
    metaTitle: "Vegan Cakes Dubai — Plant-Based Custom Cakes | FindMyBites",
    metaDescription:
      "Find vegan cake makers in Dubai. 100% plant-based wedding, birthday and celebration cakes. Custom designs, dairy-free options. Enquire free on FindMyBites.",
    subtitle:
      "100% plant-based cake makers in Dubai — dairy-free, egg-free, and delicious",
    location: "Dubai",
    locationScope: "city",
    city: "Dubai",
    categoryLabel: "Vegan Cakes",
    keyword: "vegan cakes",
    searchPlaceholder: "Search vegan cake makers in Dubai…",
    faqs: [
      {
        q: "Are vegan cakes in Dubai also Halal?",
        a: "Most vegan cakes in Dubai are Halal-friendly since they contain no animal-derived gelatin or alcohol. Confirm Halal certification with the baker when enquiring.",
      },
      {
        q: "How much do vegan cakes cost in Dubai?",
        a: "Vegan cakes in Dubai typically cost AED 180–800 depending on size and design, similar to conventional custom cakes. Specialty ingredients may add a small premium.",
      },
      {
        q: "Can I get a vegan wedding cake in Dubai?",
        a: "Yes — several Dubai cake makers specialise in multi-tier vegan wedding cakes using plant-based buttercream and dairy-free fondant.",
      },
      {
        q: "Do Dubai vegan bakers also offer gluten-free options?",
        a: "Many do. Ask about gluten-free vegan cakes when you enquire — most Dubai vegan bakers accommodate combined dietary requirements.",
      },
      {
        q: "What flavours are popular for vegan cakes in Dubai?",
        a: "Popular vegan cake flavours include chocolate avocado, vanilla coconut, carrot, lemon drizzle, and red velvet made with plant-based ingredients.",
      },
    ],
    prices: DUBAI_CAKE_PRICES,
    related: [
      { label: "Halal Cakes Dubai", slug: "halal-cakes-dubai" },
      { label: "Custom Cakes Dubai", slug: "custom-cakes-dubai" },
      { label: "Birthday Cakes Dubai", slug: "birthday-cakes-dubai" },
      { label: "Wedding Cakes Dubai", slug: "wedding-cakes-dubai" },
    ],
  },
];

const CAKE_PAGE_MAP = new Map(CAKE_PAGES.map((p) => [p.slug, p]));

export function getCakePage(slug: string): CakePage | undefined {
  return CAKE_PAGE_MAP.get(slug);
}

export function generateCakeMetadata(page: CakePage): Metadata {
  const url = `https://www.findmybites.com/${page.slug}`;
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: page.h1,
      description: page.metaDescription,
      url,
      siteName: "FindMyBites × PimpMyParty",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: page.h1,
      description: page.metaDescription,
    },
    other: {
      robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    },
  };
}

export interface CakeVendor {
  id: string;
  name: string;
  slug: string;
  ecosystem: string;
  category: string;
  city: string;
  state: string | null;
  country: string;
  countryCode: string;
  rating: number;
  reviewCount: number;
  heroImage: string;
  tagline: string;
  basePrice: number;
  currency: string;
  whatsapp: string | null;
  featured: boolean;
  verified: boolean;
}

/**
 * Fetch UAE cake vendors matching a page's location scope.
 * Mirrors the SQL intent in the brief: approved FINDMYBITES vendors whose
 * category/tags match cake/baker/dessert AND who are in the UAE (Dubai /
 * Abu Dhabi / Sharjah / countryCode AE). Scoped by page.city when set.
 */
export async function fetchCakeVendors(
  page: CakePage
): Promise<{ vendors: CakeVendor[]; total: number }> {
  try {
    // City filter (only for city-scoped pages). Country-scoped pages match
    // any UAE city.
    const cityFilter = page.city
      ? { city: { contains: page.city, mode: "insensitive" as const } }
      : undefined;

    const where = {
      ecosystem: "FINDMYBITES",
      approved: true,
      ...(page.locationScope === "country"
        ? {
            // UAE-wide: match by country name or code
            OR: [
              { countryCode: "AE" },
              { country: { contains: "Emirates", mode: "insensitive" as const } },
              { country: { contains: "UAE", mode: "insensitive" as const } },
            ],
          }
        : {
            AND: [
              {
                OR: [
                  { countryCode: "AE" },
                  { country: { contains: "Emirates", mode: "insensitive" as const } },
                ],
              },
              ...(cityFilter ? [cityFilter] : []),
            ],
          }),
      OR: [
        { category: "bakers-bakery" },
        { category: "cake-artists" },
        { category: "bakers" },
        { category: "cupcake-specialists" },
        { category: "dessert-makers" },
      ],
    } as any;

    const [vendors, total] = await Promise.all([
      db.vendor.findMany({
        where,
        take: 12,
        orderBy: [{ featured: "desc" }, { rating: "desc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          ecosystem: true,
          category: true,
          city: true,
          state: true,
          country: true,
          countryCode: true,
          rating: true,
          reviewCount: true,
          heroImage: true,
          tagline: true,
          basePrice: true,
          currency: true,
          whatsapp: true,
          featured: true,
          verified: true,
        },
      }),
      db.vendor.count({ where }),
    ]);

    return { vendors: vendors as CakeVendor[], total };
  } catch {
    // DB unavailable — return empty so the page still renders with FAQ + content
    return { vendors: [], total: 0 };
  }
}

/** Build all JSON-LD blocks for a cake landing page. */
export function buildCakeJsonLd(
  page: CakePage,
  vendors: CakeVendor[]
): Record<string, any>[] {
  const url = `https://www.findmybites.com/${page.slug}`;
  const region =
    page.locationScope === "country" ? "UAE" : page.location;

  const out: Record<string, any>[] = [];

  // BreadcrumbList: Home > FindMyBites > UAE > [City] > [Category]
  const crumbs = [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.findmybites.com" },
    { "@type": "ListItem", position: 2, name: "FindMyBites", item: "https://www.findmybites.com/findmybites" },
    { "@type": "ListItem", position: 3, name: "UAE", item: "https://www.findmybites.com/findmybites/united-arab-emirates" },
  ];
  if (page.locationScope === "city") {
    crumbs.push({
      "@type": "ListItem",
      position: 4,
      name: page.location,
      item: `https://www.findmybites.com/findmybites/united-arab-emirates/${page.location.toLowerCase().replace(/ /g, "-")}`,
    });
    crumbs.push({ "@type": "ListItem", position: 5, name: page.categoryLabel, item: url });
  } else {
    crumbs.push({ "@type": "ListItem", position: 4, name: page.categoryLabel, item: url });
  }
  out.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs,
  });

  // ItemList of FoodEstablishment vendors
  if (vendors.length > 0) {
    out.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${page.categoryLabel} in ${page.location}`,
      itemListElement: vendors.slice(0, 12).map((v, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "FoodEstablishment",
          name: v.name,
          url: `https://www.findmybites.com/vendor/${v.slug}`,
          image: v.heroImage || undefined,
          telephone: v.whatsapp || undefined,
          address: {
            "@type": "PostalAddress",
            addressLocality: v.city,
            addressCountry: "AE",
          },
          aggregateRating:
            v.reviewCount > 0
              ? {
                  "@type": "AggregateRating",
                  ratingValue: v.rating,
                  reviewCount: v.reviewCount,
                }
              : undefined,
        },
      })),
    });
  }

  // FAQPage
  out.push({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  });

  return out;
}

/** Title-case a location for display ("dubai" → "Dubai"). */
export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
