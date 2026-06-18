import { PrismaClient } from "@prisma/client";
import { slugify } from "../src/lib/format";
import { ensureSearchSchema, rebuildSearchIndex } from "../src/lib/search";

const db = new PrismaClient();

interface SeedVendor {
  name: string;
  ecosystem: "FINDMYBITES" | "PIMPMYPARTY";
  category: string;
  tagline: string;
  description: string;
  city: string;
  country: string;
  countryCode: string;
  continent: string;
  currency: string;
  priceRange: string;
  basePrice: number;
  rating: number;
  reviewCount: number;
  heroImage: string;
  tags: string[];
  featured: boolean;
  responseTime: string;
  yearsActive: number;
  completedBookings: number;
  reviews: { author: string; avatar: string; rating: number; comment: string; eventDate: string }[];
  // optional contact + location enrichment
  subcategory?: string;
  address?: string;
  zipCode?: string;
  instagram?: string;
  website?: string;
  whatsapp?: string;
}

const vendors: SeedVendor[] = [
  // ===================== FINDMYBITES =====================
  {
    name: "Maison Levain",
    ecosystem: "FINDMYBITES",
    category: "bakers",
    tagline: "Parisian sourdough & viennoiserie, baked on stone hearths since 1998.",
    description:
      "Maison Levain is a family-run artisan bakery in the heart of Paris crafting naturally leavened sourdough, croissants, and seasonal patisserie. We supply weddings, hotels, and corporate breakfasts across Île-de-France with bread baked fresh each morning.",
    city: "Paris",
    country: "France",
    countryCode: "FR",
    continent: "Europe",
    currency: "EUR",
    priceRange: "$$",
    basePrice: 45,
    rating: 4.9,
    reviewCount: 128,
    heroImage: "/vendors/baker.png",
    tags: ["sourdough", "croissants", "wedding bread", "corporate", "gluten-friendly"],
    featured: true,
    responseTime: "under 1 hour",
    yearsActive: 26,
    completedBookings: 640,
    subcategory: "Sourdough",
    address: "18 Rue des Martyrs, 9th arrondissement",
    zipCode: "75009",
    instagram: "maisonlevain",
    website: "https://maisonlevain.fr",
    whatsapp: "33142856390",
    reviews: [
      { author: "Camille R.", avatar: "CR", rating: 5, comment: "The sourdough for our wedding was unreal. Guests are still talking about the bread table.", eventDate: "2024-06-15" },
      { author: "Olivier P.", avatar: "OP", rating: 5, comment: "Corporate breakfast for 80 — punctual, warm, delicious croissants. Will rebook.", eventDate: "2024-09-02" },
      { author: "Sophie M.", avatar: "SM", rating: 4, comment: "Lovely bread, slightly late delivery but worth the wait.", eventDate: "2024-03-21" },
    ],
  },
  {
    name: "Brooklyn Sourdough Co.",
    ecosystem: "FINDMYBITES",
    category: "bakers",
    tagline: "New York's cult bakery for country loaves and seeded bagels.",
    description:
      "Born in a Williamsburg storefront, Brooklyn Sourdough Co. ferments each loaf for 36 hours for an open, custardy crumb. We cater film sets, brunches, and brand pop-ups across NYC and the Tri-State area.",
    city: "New York",
    country: "United States",
    countryCode: "US",
    continent: "North America",
    currency: "USD",
    priceRange: "$$",
    basePrice: 60,
    rating: 4.8,
    reviewCount: 96,
    heroImage: "/vendors/baker.png",
    tags: ["sourdough", "bagels", "film sets", "pop-ups"],
    featured: false,
    responseTime: "under 2 hours",
    yearsActive: 9,
    completedBookings: 312,
    reviews: [
      { author: "Dana K.", avatar: "DK", rating: 5, comment: "Catered our film crew for a week. The seeded bagels disappeared by 9am every day.", eventDate: "2024-07-10" },
      { author: "Marcus T.", avatar: "MT", rating: 4, comment: "Great bread, the crumb is everything. Wish they offered more pastry variety.", eventDate: "2024-05-18" },
    ],
  },
  {
    name: "Saffron & Sage Catering",
    ecosystem: "FINDMYBITES",
    category: "catering",
    tagline: "Modern British catering with a spice-route twist.",
    description:
      "Saffron & Sage is a London-based catering house blending seasonal British produce with global spice-route flavours. From intimate dinners to 500-guest galas, our team designs menus, staffing, and full service.",
    city: "London",
    country: "United Kingdom",
    countryCode: "GB",
    continent: "Europe",
    currency: "GBP",
    priceRange: "$$$",
    basePrice: 85,
    rating: 4.9,
    reviewCount: 214,
    heroImage: "/vendors/catering.png",
    tags: ["fine dining", "galas", "vegan", "canapes", "full service"],
    featured: true,
    responseTime: "under 1 hour",
    yearsActive: 14,
    completedBookings: 1180,
    subcategory: "Wedding Catering",
    address: "The Roundhouse, Chalk Farm Road, Camden",
    zipCode: "NW1 8EH",
    instagram: "saffronandsageuk",
    website: "https://saffronandsage.co.uk",
    whatsapp: "447700900123",
    reviews: [
      { author: "Eleanor W.", avatar: "EW", rating: 5, comment: "Catered our charity gala for 400. Flawless service and the lamb was perfect.", eventDate: "2024-10-05" },
      { author: "James B.", avatar: "JB", rating: 5, comment: "Vegan menu was a revelation. Even the meat-eaters wanted seconds.", eventDate: "2024-08-22" },
      { author: "Priya S.", avatar: "PS", rating: 4, comment: "Beautiful food, premium pricing but you get what you pay for.", eventDate: "2024-04-11" },
    ],
  },
  {
    name: "Harambe Feast Co.",
    ecosystem: "FINDMYBITES",
    category: "catering",
    tagline: "Pan-African feasts and nyama choma for celebrations across East Africa.",
    description:
      "Harambe Feast Co. brings the soul of East African cooking to weddings, corporate events, and community gatherings. Smoky nyama choma, fragrant pilau, and vibrant kachumbari — cooked on-site for an unforgettable experience.",
    city: "Nairobi",
    country: "Kenya",
    countryCode: "KE",
    continent: "Africa",
    currency: "USD",
    priceRange: "$$",
    basePrice: 35,
    rating: 4.8,
    reviewCount: 87,
    heroImage: "/vendors/catering.png",
    tags: ["nyama choma", "pilau", "weddings", "on-site grill", "halal"],
    featured: false,
    responseTime: "under 3 hours",
    yearsActive: 7,
    completedBookings: 240,
    reviews: [
      { author: "Wanjiru N.", avatar: "WN", rating: 5, comment: "Our wedding feast was legendary. The team cooked live and guests loved it.", eventDate: "2024-06-29" },
      { author: "David O.", avatar: "DO", rating: 5, comment: "Corporate event for 200. Generous portions, incredible flavour.", eventDate: "2024-02-14" },
    ],
  },
  {
    name: "Dolce Vita Sweets",
    ecosystem: "FINDMYBITES",
    category: "desserts",
    tagline: "Roman pasticceria crafting tiramisu, cannoli, and dessert tables.",
    description:
      "Three generations of Roman pastry-making in every bite. Dolce Vita Sweets designs dessert tables, sweet favors, and signature tiramisu towers for weddings and brand launches across Italy and Europe.",
    city: "Rome",
    country: "Italy",
    countryCode: "IT",
    continent: "Europe",
    currency: "EUR",
    priceRange: "$$",
    basePrice: 50,
    rating: 4.7,
    reviewCount: 142,
    heroImage: "/vendors/desserts.png",
    tags: ["tiramisu", "cannoli", "dessert table", "weddings", "gelato bar"],
    featured: true,
    responseTime: "under 2 hours",
    yearsActive: 22,
    completedBookings: 540,
    reviews: [
      { author: "Giulia F.", avatar: "GF", rating: 5, comment: "The tiramisu tower was a centerpiece. Nonna approved!", eventDate: "2024-09-14" },
      { author: "Marco D.", avatar: "MD", rating: 4, comment: "Cannoli were crisp and creamy. Delivery ran a touch late.", eventDate: "2024-01-30" },
    ],
  },
  {
    name: "Matcha & Co.",
    ecosystem: "FINDMYBITES",
    category: "desserts",
    tagline: "Kyoto-style matcha sweets, mochi, and ceremonial dessert bars.",
    description:
      "Matcha & Co. sources ceremonial-grade matcha direct from Uji farmers and crafts minimalist Japanese desserts — mochi, warabi mochi, and interactive matcha dessert bars for events across Asia.",
    city: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    continent: "Asia",
    currency: "JPY",
    priceRange: "$$$",
    basePrice: 12000,
    rating: 4.9,
    reviewCount: 76,
    heroImage: "/vendors/desserts.png",
    tags: ["matcha", "mochi", "dessert bar", "vegan", "corporate"],
    featured: false,
    responseTime: "under 4 hours",
    yearsActive: 6,
    completedBookings: 180,
    reviews: [
      { author: "Yuki T.", avatar: "YT", rating: 5, comment: "The matcha bar at our product launch was a hit. Beautiful and delicious.", eventDate: "2024-07-25" },
      { author: "Haruka N.", avatar: "HN", rating: 5, comment: "Mochi so soft it melts. Will book again for our wedding.", eventDate: "2024-05-03" },
    ],
  },
  {
    name: "Velvet Canvas Cakes",
    ecosystem: "FINDMYBITES",
    category: "cake-artists",
    tagline: "Sculptural celebration cakes that look like art and taste like home.",
    description:
      "Velvet Canvas Cakes is a LA studio pushing the boundaries of cake design — hand-painted florals, gravity-defying structures, and sugar architecture. Each cake is a one-of-a-kind commission.",
    city: "Los Angeles",
    country: "United States",
    countryCode: "US",
    continent: "North America",
    currency: "USD",
    priceRange: "$$$$",
    basePrice: 450,
    rating: 5.0,
    reviewCount: 168,
    heroImage: "/vendors/cake-artist.png",
    tags: ["sculptural", "painted florals", "weddings", "celebrity", "custom"],
    featured: true,
    responseTime: "under 6 hours",
    yearsActive: 11,
    completedBookings: 430,
    reviews: [
      { author: "Alicia G.", avatar: "AG", rating: 5, comment: "Our wedding cake was a sculptural masterpiece. People gasped when it came out.", eventDate: "2024-10-12" },
      { author: "Vanessa R.", avatar: "VR", rating: 5, comment: "Worth every penny. The hand-painted flowers were unreal.", eventDate: "2024-03-08" },
    ],
  },
  {
    name: "Sugar Atelier",
    ecosystem: "FINDMYBITES",
    category: "cake-artists",
    tagline: "Singapore's atelier for modern minimal cakes and sugar florals.",
    description:
      "Sugar Atelier designs clean, modern cakes with exquisite sugar florals and contemporary finishes. We ship across Southeast Asia and design for luxury weddings and brand collaborations.",
    city: "Singapore",
    country: "Singapore",
    countryCode: "SG",
    continent: "Asia",
    currency: "SGD",
    priceRange: "$$$$",
    basePrice: 680,
    rating: 4.9,
    reviewCount: 92,
    heroImage: "/vendors/cake-artist.png",
    tags: ["minimal", "sugar florals", "luxury", "brand collabs"],
    featured: false,
    responseTime: "under 8 hours",
    yearsActive: 8,
    completedBookings: 210,
    reviews: [
      { author: "Mei Ling C.", avatar: "MC", rating: 5, comment: "Elegant, modern, and the sugar peonies were indistinguishable from real ones.", eventDate: "2024-08-19" },
      { author: "Aaron L.", avatar: "AL", rating: 4, comment: "Stunning design. Lead time is long so book early.", eventDate: "2024-02-02" },
    ],
  },
  {
    name: "El Tigre Tacos",
    ecosystem: "FINDMYBITES",
    category: "food-trucks",
    tagline: "Mexico City street tacos, al pastor spit, and mezcal on wheels.",
    description:
      "El Tigre Tacos rolls up with a real al pastor trompo, fresh tortillas, and a mezcel bar. We cater street-food weddings, festivals, and corporate parties across Mexico and the southern US.",
    city: "Mexico City",
    country: "Mexico",
    countryCode: "MX",
    continent: "North America",
    currency: "USD",
    priceRange: "$",
    basePrice: 12,
    rating: 4.8,
    reviewCount: 203,
    heroImage: "/vendors/food-truck.png",
    tags: ["tacos", "al pastor", "mezcal", "festivals", "street food"],
    featured: true,
    responseTime: "under 2 hours",
    yearsActive: 10,
    completedBookings: 760,
    subcategory: "Tacos & Mexican",
    address: "Av. Álvaro Obregón 64, Roma Norte, Cuauhtémoc",
    zipCode: "06700",
    instagram: "eltigretacos",
    website: "https://eltigretacos.mx",
    whatsapp: "525512345678",
    reviews: [
      { author: "Carlos M.", avatar: "CM", rating: 5, comment: "The al pastor trompo at our wedding was the highlight. Line was 50 deep.", eventDate: "2024-09-28" },
      { author: "Bianca V.", avatar: "BV", rating: 5, comment: "Best tacos outside a taquería. Mezcal pairing was a nice touch.", eventDate: "2024-04-20" },
    ],
  },
  {
    name: "Curry Express Truck",
    ecosystem: "FINDMYBITES",
    category: "food-trucks",
    tagline: "Mumbai chaat, biryani, and live dosa station on the move.",
    description:
      "Curry Express Truck brings the energy of Mumbai street food to your event — live dosa stations, chaat counters, and dum biryani cooked in sealed pots. Perfect for weddings and corporate days.",
    city: "Mumbai",
    country: "India",
    countryCode: "IN",
    continent: "Asia",
    currency: "INR",
    priceRange: "$",
    basePrice: 4500,
    rating: 4.7,
    reviewCount: 156,
    heroImage: "/vendors/food-truck.png",
    tags: ["chaat", "dosa", "biryani", "weddings", "vegetarian"],
    featured: false,
    responseTime: "under 3 hours",
    yearsActive: 8,
    completedBookings: 420,
    reviews: [
      { author: "Rohan P.", avatar: "RP", rating: 5, comment: "Live dosa station stole the show at our sangeet. Crowd loved it.", eventDate: "2024-11-02" },
      { author: "Anjali K.", avatar: "AK", rating: 4, comment: "Flavours of Mumbai in the heart of the city. Generous portions.", eventDate: "2024-06-08" },
    ],
  },
  {
    name: "Chef Omar Private Kitchen",
    ecosystem: "FINDMYBITES",
    category: "private-chefs",
    tagline: "Modern Levantine fine dining in your villa or yacht.",
    description:
      "Chef Omar brings a Michelin-trained background to private dining across the Gulf. Tasting menus reimagining Levantine cuisine, served in homes, villas, and yachts from Dubai to the Maldives.",
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    continent: "Middle East",
    currency: "AED",
    priceRange: "$$$$",
    basePrice: 1200,
    rating: 5.0,
    reviewCount: 64,
    heroImage: "/vendors/private-chef.png",
    tags: ["tasting menu", "levantine", "yacht", "villa", "halal"],
    featured: true,
    responseTime: "under 5 hours",
    yearsActive: 9,
    completedBookings: 150,
    reviews: [
      { author: "Layla A.", avatar: "LA", rating: 5, comment: "A 9-course tasting menu on our yacht. Best meal of our lives.", eventDate: "2024-08-30" },
      { author: "Faisal M.", avatar: "FM", rating: 5, comment: "Chef Omar reimagined dishes from my childhood. Deeply moving and delicious.", eventDate: "2024-05-17" },
    ],
  },
  {
    name: "Outback Fire Kitchen",
    ecosystem: "FINDMYBITES",
    category: "private-chefs",
    tagline: "Fire-cooked native Australian menus under the southern stars.",
    description:
      "Outback Fire Kitchen cooks over native hardwood coals, blending Indigenous Australian ingredients with modern technique. Private dining, bush banquets, and outdoor weddings across Australia.",
    city: "Sydney",
    country: "Australia",
    countryCode: "AU",
    continent: "Oceania",
    currency: "AUD",
    priceRange: "$$$",
    basePrice: 280,
    rating: 4.8,
    reviewCount: 58,
    heroImage: "/vendors/private-chef.png",
    tags: ["fire cooking", "native ingredients", "outdoor", "weddings"],
    featured: false,
    responseTime: "under 6 hours",
    yearsActive: 5,
    completedBookings: 95,
    reviews: [
      { author: "Chloe H.", avatar: "CH", rating: 5, comment: "Bush banquet under the stars was magical. The kangaroo was cooked perfectly.", eventDate: "2024-10-01" },
      { author: "Tom W.", avatar: "TW", rating: 4, comment: "Unique flavours and a great story behind each dish.", eventDate: "2024-03-25" },
    ],
  },

  // ===================== PIMPMYPARTY =====================
  {
    name: "Soirée Studio",
    ecosystem: "PIMPMYPARTY",
    category: "event-planners",
    tagline: "Milan-based planners for design-led weddings and brand activations.",
    description:
      "Soirée Studio plans and produces design-forward weddings, product launches, and brand activations across Europe. Full-service planning, design, vendor curation, and on-the-day production.",
    city: "Milan",
    country: "Italy",
    countryCode: "IT",
    continent: "Europe",
    currency: "EUR",
    priceRange: "$$$$",
    basePrice: 9500,
    rating: 4.9,
    reviewCount: 118,
    heroImage: "/vendors/event-planner.png",
    tags: ["weddings", "brand launches", "design-led", "full-service", "destination"],
    featured: true,
    responseTime: "under 4 hours",
    yearsActive: 12,
    completedBookings: 320,
    subcategory: "Weddings",
    address: "Via Tortona 27, Navigli district",
    zipCode: "20144",
    instagram: "soiree.studio",
    website: "https://soireestudio.it",
    whatsapp: "393331234567",
    reviews: [
      { author: "Francesca B.", avatar: "FB", rating: 5, comment: "They planned our Lake Como wedding flawlessly. Every detail was intentional.", eventDate: "2024-07-20" },
      { author: "Luca R.", avatar: "LR", rating: 5, comment: "Brand launch for 600 guests. On brief, on budget, on time.", eventDate: "2024-09-09" },
    ],
  },
  {
    name: "Blossom Events",
    ecosystem: "PIMPMYPARTY",
    category: "event-planners",
    tagline: "Toronto planners for South Asian weddings and multicultural celebrations.",
    description:
      "Blossom Events specializes in large-scale multicultural and South Asian weddings across North America — multi-day celebrations, baraat logistics, and seamless fusion events.",
    city: "Toronto",
    country: "Canada",
    countryCode: "CA",
    continent: "North America",
    currency: "CAD",
    priceRange: "$$$",
    basePrice: 8500,
    rating: 4.8,
    reviewCount: 94,
    heroImage: "/vendors/event-planner.png",
    tags: ["south asian", "multi-day", "baraat", "fusion", "weddings"],
    featured: false,
    responseTime: "under 3 hours",
    yearsActive: 9,
    completedBookings: 210,
    reviews: [
      { author: "Simran D.", avatar: "SD", rating: 5, comment: "3-day wedding, zero stress. They handled the baraat like pros.", eventDate: "2024-08-11" },
      { author: "Arjun P.", avatar: "AP", rating: 4, comment: "Great coordination across multiple venues. Highly recommend.", eventDate: "2024-05-25" },
    ],
  },
  {
    name: "Balloon & Bloom",
    ecosystem: "PIMPMYPARTY",
    category: "decorators",
    tagline: "Immersive balloon installations and floral walls in São Paulo.",
    description:
      "Balloon & Bloom creates show-stopping organic balloon arches, floral walls, and full event styling. From baby showers to corporate galas, we transform any space with colour and scale.",
    city: "São Paulo",
    country: "Brazil",
    countryCode: "BR",
    continent: "South America",
    currency: "BRL",
    priceRange: "$$",
    basePrice: 1800,
    rating: 4.9,
    reviewCount: 132,
    heroImage: "/vendors/decorator.png",
    tags: ["balloons", "floral walls", "styling", "baby shower", "galas"],
    featured: true,
    responseTime: "under 2 hours",
    yearsActive: 7,
    completedBookings: 380,
    reviews: [
      { author: "Beatriz S.", avatar: "BS", rating: 5, comment: "Our baby shower balloon arch was a dream. Photos went viral.", eventDate: "2024-06-30" },
      { author: "Rafael C.", avatar: "RC", rating: 5, comment: "Corporate gala styling was world-class. Huge impact.", eventDate: "2024-10-18" },
    ],
  },
  {
    name: "Petals & Props Dubai",
    ecosystem: "PIMPMYPARTY",
    category: "decorators",
    tagline: "Luxury floral design and bespoke props for Gulf celebrations.",
    description:
      "Petals & Props Dubai designs extravagant floral installations, ceiling florals, and custom props for weddings, royal celebrations, and brand events across the GCC.",
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    continent: "Middle East",
    currency: "AED",
    priceRange: "$$$$",
    basePrice: 25000,
    rating: 4.9,
    reviewCount: 71,
    heroImage: "/vendors/decorator.png",
    tags: ["luxury florals", "ceiling installations", "custom props", "royal", "weddings"],
    featured: true,
    responseTime: "under 5 hours",
    yearsActive: 10,
    completedBookings: 160,
    reviews: [
      { author: "Noor A.", avatar: "NA", rating: 5, comment: "The ceiling floral installation took our breath away. Pure luxury.", eventDate: "2024-09-21" },
      { author: "Khalid R.", avatar: "KR", rating: 5, comment: "Custom props were built to perfection. Professional team.", eventDate: "2024-04-14" },
    ],
  },
  {
    name: "Wonder Circus Co.",
    ecosystem: "PIMPMYPARTY",
    category: "entertainers",
    tagline: "Berlin's roving circus acts, stilt walkers, and fire performers.",
    description:
      "Wonder Circus Co. brings theatrical variety entertainment — aerialists, stilt walkers, fire performers, and living statues — to festivals, brand events, and private parties across Europe.",
    city: "Berlin",
    country: "Germany",
    countryCode: "DE",
    continent: "Europe",
    currency: "EUR",
    priceRange: "$$",
    basePrice: 600,
    rating: 4.8,
    reviewCount: 89,
    heroImage: "/vendors/entertainer.png",
    tags: ["aerialists", "stilt walkers", "fire", "festivals", "living statues"],
    featured: false,
    responseTime: "under 3 hours",
    yearsActive: 8,
    completedBookings: 260,
    reviews: [
      { author: "Hannah W.", avatar: "HW", rating: 5, comment: "Fire performers at our festival were jaw-dropping. Crowd went wild.", eventDate: "2024-07-13" },
      { author: "Felix S.", avatar: "FS", rating: 4, comment: "Stilt walkers were a hit with the kids. Great energy.", eventDate: "2024-05-04" },
    ],
  },
  {
    name: "Lagos Live Acts",
    ecosystem: "PIMPMYPARTY",
    category: "entertainers",
    tagline: "Afrobeats live bands, hype MCs, and cultural dance troupes.",
    description:
      "Lagos Live Acts delivers high-energy Afrobeats bands, talking drummers, and cultural dance troupes for weddings, owambe parties, and corporate events across West Africa.",
    city: "Lagos",
    country: "Nigeria",
    countryCode: "NG",
    continent: "Africa",
    currency: "NGN",
    priceRange: "$$",
    basePrice: 850000,
    rating: 4.9,
    reviewCount: 76,
    heroImage: "/vendors/entertainer.png",
    tags: ["afrobeats", "owambe", "talking drum", "dance troupes", "weddings"],
    featured: true,
    responseTime: "under 4 hours",
    yearsActive: 6,
    completedBookings: 190,
    reviews: [
      { author: "Chioma E.", avatar: "CE", rating: 5, comment: "Our owambe was the party of the year. The band kept everyone dancing till dawn.", eventDate: "2024-08-17" },
      { author: "Tunde A.", avatar: "TA", rating: 5, comment: "Talking drummers brought the tradition alive. Incredible.", eventDate: "2024-03-29" },
    ],
  },
  {
    name: "Neon Pulse DJs",
    ecosystem: "PIMPMYPARTY",
    category: "djs",
    tagline: "Amsterdam open-format DJs with custom light & visual shows.",
    description:
      "Neon Pulse DJs are open-format specialists blending house, afro, latin, and classics. Full sound, lighting, and LED visual setups for clubs, weddings, and corporate events across Europe.",
    city: "Amsterdam",
    country: "Netherlands",
    countryCode: "NL",
    continent: "Europe",
    currency: "EUR",
    priceRange: "$$$",
    basePrice: 1400,
    rating: 4.9,
    reviewCount: 112,
    heroImage: "/vendors/dj.png",
    tags: ["open-format", "LED visuals", "weddings", "clubs", "corporate"],
    featured: true,
    responseTime: "under 2 hours",
    yearsActive: 9,
    completedBookings: 540,
    subcategory: "Open-Format",
    address: "Westerpark Studios, Haarlemmerweg 8",
    zipCode: "1014 BE",
    instagram: "neonpulsedjs",
    website: "https://neonpulse.nl",
    whatsapp: "31612345678",
    reviews: [
      { author: "Sofie J.", avatar: "SJ", rating: 5, comment: "Our wedding dance floor never emptied. The LED wall was stunning.", eventDate: "2024-09-07" },
      { author: "Daan V.", avatar: "DV", rating: 5, comment: "Corporate party for 800. Read the crowd perfectly all night.", eventDate: "2024-12-20" },
    ],
  },
  {
    name: "Bollywood Beats",
    ecosystem: "PIMPMYPARTY",
    category: "djs",
    tagline: "Delhi's Bollywood & Punjabi DJ crew for high-energy celebrations.",
    description:
      "Bollywood Beats delivers the soundtrack to Indian celebrations — Bollywood classics, Punjabi bangers, and fusion sets with dhol players and live percussion for weddings and sangeets.",
    city: "Delhi",
    country: "India",
    countryCode: "IN",
    continent: "Asia",
    currency: "INR",
    priceRange: "$$",
    basePrice: 65000,
    rating: 4.8,
    reviewCount: 98,
    heroImage: "/vendors/dj.png",
    tags: ["bollywood", "punjabi", "dhol", "sangeet", "weddings"],
    featured: false,
    responseTime: "under 3 hours",
    yearsActive: 7,
    completedBookings: 310,
    reviews: [
      { author: "Neha G.", avatar: "NG", rating: 5, comment: "Sangeet night was electric. Dhol player took it to another level.", eventDate: "2024-11-09" },
      { author: "Rahul V.", avatar: "RV", rating: 4, comment: "Great mixes, kept the floor packed. Would book again.", eventDate: "2024-02-26" },
    ],
  },
  {
    name: "Lumière Lens",
    ecosystem: "PIMPMYPARTY",
    category: "photographers",
    tagline: "Cape Town wedding & editorial photography with cinematic film.",
    description:
      "Lumière Lens captures weddings and brand stories with a cinematic eye — blending photo, Super 8 film, and drone across South Africa and destination weddings worldwide.",
    city: "Cape Town",
    country: "South Africa",
    countryCode: "ZA",
    continent: "Africa",
    currency: "ZAR",
    priceRange: "$$$",
    basePrice: 28000,
    rating: 4.9,
    reviewCount: 84,
    heroImage: "/vendors/photographer.png",
    tags: ["weddings", "editorial", "super 8 film", "drone", "destination"],
    featured: true,
    responseTime: "under 6 hours",
    yearsActive: 10,
    completedBookings: 220,
    subcategory: "Weddings",
    address: "Studio 5, The Old Biscuit Mill, Woodstock",
    zipCode: "7925",
    instagram: "lumiere.lens",
    website: "https://lumierelens.co.za",
    whatsapp: "27821234567",
    reviews: [
      { author: "Thandi M.", avatar: "TM", rating: 5, comment: "Our Winelands wedding photos are cinematic masterpieces. Super 8 film is pure magic.", eventDate: "2024-04-06" },
      { author: "Johan B.", avatar: "JB", rating: 5, comment: "Drone shots of the venue were breathtaking. True artist.", eventDate: "2024-10-26" },
    ],
  },
  {
    name: "Frame & Story",
    ecosystem: "PIMPMYPARTY",
    category: "photographers",
    tagline: "Melbourne documentary wedding photography & Same-day edits.",
    description:
      "Frame & Story shoots authentic, documentary-style weddings with a same-day-edit film option. Modern storytelling for couples who want real moments, not posed portraits.",
    city: "Melbourne",
    country: "Australia",
    countryCode: "AU",
    continent: "Oceania",
    currency: "AUD",
    priceRange: "$$",
    basePrice: 4200,
    rating: 4.8,
    reviewCount: 67,
    heroImage: "/vendors/photographer.png",
    tags: ["documentary", "same-day edit", "weddings", "couples"],
    featured: false,
    responseTime: "under 5 hours",
    yearsActive: 6,
    completedBookings: 140,
    reviews: [
      { author: "Olivia F.", avatar: "OF", rating: 5, comment: "Same-day edit at our reception made everyone cry. Real moments captured.", eventDate: "2024-03-16" },
      { author: "Liam K.", avatar: "LK", rating: 4, comment: "Documentary style suited us perfectly. Unobtrusive and warm.", eventDate: "2024-07-01" },
    ],
  },
  {
    name: "Skyline Rooftop Hall",
    ecosystem: "PIMPMYPARTY",
    category: "venues",
    tagline: "Manhattan rooftop venue with skyline views for 300 guests.",
    description:
      "Skyline Rooftop Hall is a 6,000 sq ft open-air rooftop in Midtown Manhattan with panoramic skyline views, retractable glass, and in-house production. Ideal for weddings, galas, and launches.",
    city: "New York",
    country: "United States",
    countryCode: "US",
    continent: "North America",
    currency: "USD",
    priceRange: "$$$$",
    basePrice: 18000,
    rating: 4.8,
    reviewCount: 145,
    heroImage: "/vendors/venue.png",
    tags: ["rooftop", "skyline", "galas", "weddings", "in-house production"],
    featured: true,
    responseTime: "under 4 hours",
    yearsActive: 8,
    completedBookings: 410,
    reviews: [
      { author: "Grace L.", avatar: "GL", rating: 5, comment: "Sunset over the skyline during our vows. Unforgettable venue.", eventDate: "2024-09-15" },
      { author: "Daniel W.", avatar: "DW", rating: 4, comment: "Stunning space, premium pricing. Production team is top-notch.", eventDate: "2024-05-22" },
    ],
  },
  {
    name: "Mediterranean Cliffs Venue",
    ecosystem: "PIMPMYPARTY",
    category: "venues",
    tagline: "Lisbon clifftop venue with ocean terraces for destination weddings.",
    description:
      "Mediterranean Cliffs Venue is a restored clifftop estate outside Lisbon with cascading ocean terraces, an olive grove ceremony space, and a 200-guest banquet hall for destination weddings.",
    city: "Lisbon",
    country: "Portugal",
    countryCode: "PT",
    continent: "Europe",
    currency: "EUR",
    priceRange: "$$$",
    basePrice: 14000,
    rating: 4.9,
    reviewCount: 88,
    heroImage: "/vendors/venue.png",
    tags: ["clifftop", "destination", "ocean view", "olive grove", "weddings"],
    featured: false,
    responseTime: "under 6 hours",
    yearsActive: 11,
    completedBookings: 230,
    reviews: [
      { author: "Isabela C.", avatar: "IC", rating: 5, comment: "Getting married among the olive trees with the ocean below was surreal.", eventDate: "2024-06-12" },
      { author: "Pedro M.", avatar: "PM", rating: 5, comment: "Venue of dreams. The team made our destination wedding effortless.", eventDate: "2024-08-03" },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding FindMyBites × PimpMyParty marketplace...");

  // Set up the FTS5 search index + sync triggers BEFORE the wipe, because
  // the Vendor delete triggers reference vendor_fts (which may have been
  // dropped by a `prisma db push` since the last seed). ensureSearchSchema()
  // is idempotent so this is safe to call every run.
  await ensureSearchSchema();

  // wipe
  await db.review.deleteMany();
  await db.booking.deleteMany();
  await db.vendor.deleteMany();

  // Triggers don't fire on the FTS table for already-existing rows; clear any
  // stale index entries from previous seeds.
  await db.$executeRawUnsafe(`DELETE FROM vendor_fts`);

  for (const v of vendors) {
    const slug = slugify(`${v.name}-${v.city}`);
    const created = await db.vendor.create({
      data: {
        name: v.name,
        slug,
        ecosystem: v.ecosystem,
        category: v.category,
        tagline: v.tagline,
        description: v.description,
        city: v.city,
        country: v.country,
        countryCode: v.countryCode,
        continent: v.continent,
        currency: v.currency,
        priceRange: v.priceRange,
        basePrice: v.basePrice,
        rating: v.rating,
        reviewCount: v.reviewCount,
        heroImage: v.heroImage,
        avatarImage: v.heroImage,
        gallery: JSON.stringify([v.heroImage]),
        tags: JSON.stringify(v.tags),
        featured: v.featured,
        verified: true,
        responseTime: v.responseTime,
        yearsActive: v.yearsActive,
        completedBookings: v.completedBookings,
        subcategory: v.subcategory ?? null,
        address: v.address ?? null,
        zipCode: v.zipCode ?? null,
        instagram: v.instagram ?? null,
        website: v.website ?? null,
        whatsapp: v.whatsapp ?? null,
        reviews: {
          create: v.reviews.map((r) => ({
            author: r.author,
            avatar: r.avatar,
            rating: r.rating,
            comment: r.comment,
            eventDate: r.eventDate,
          })),
        },
      },
    });
    console.log(`  ✓ ${v.ecosystem.padEnd(12)} ${v.name} (${v.city}, ${v.country})`);
    void created;
  }

  const counts = {
    vendors: await db.vendor.count(),
    reviews: await db.review.count(),
    findmybites: await db.vendor.count({ where: { ecosystem: "FINDMYBITES" } }),
    pimpmpyparty: await db.vendor.count({ where: { ecosystem: "PIMPMYPARTY" } }),
  };

  // Rebuild the FTS search index from scratch (safety net in case any insert
  // bypassed the triggers). Cheap and idempotent.
  await rebuildSearchIndex();
  const ftsCount = await db.$queryRawUnsafe<{ c: number }[]>(
    `SELECT COUNT(*) AS c FROM vendor_fts`
  );
  console.log("✅ Seed complete:", counts, {
    ftsIndexed: ftsCount[0]?.c ?? 0,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
