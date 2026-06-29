export type Ecosystem = "FINDMYBITES" | "PIMPMYPARTY";

export interface Vendor {
  id: string;
  name: string;
  slug: string;
  ecosystem: Ecosystem;
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
  avatarImage: string;
  gallery: string[];
  tags: string[];
  featured: boolean;
  verified: boolean;
  approved: boolean;
  responseTime: string;
  yearsActive: number;
  completedBookings: number;
  subcategory?: string | null;
  state?: string | null;
  address?: string | null;
  zipCode?: string | null;
  instagram?: string | null;
  website?: string | null;
  whatsapp?: string | null;
  // social media (additional)
  facebook?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
  snapchat?: string | null;
  // India-specific
  fssaiNumber?: string | null;
  // listing settings
  settingsLocked?: boolean;
  // business settings
  openHours?: string | null;
  deliveryAvailable?: boolean;
  pickupAvailable?: boolean;
  serviceAreas?: string | null;
  // SEO
  metaTitle?: string | null;
  metaDescription?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  serviceRadiusKm?: number | null;
  userEmail?: string | null;
  owner_user_id?: string | null;
  ownership_status?: string | null;
  planExpiresAt?: string | null;
  createdAt: string;
}

/** Vendor with computed distance from the user (Near Me results). */
export interface VendorWithDistance extends Vendor {
  /** straight-line distance in km from the user's location */
  distance: number;
}

/** Product / service offered by a vendor within their business listing. */
export interface Product {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  image?: string | null;
  productType?: string | null;
  sizes?: string | null;
  flavours?: string | null;
  weight?: string | null;
  prepTime?: string | null;
  deliveryAvailable: boolean;
  minGuests?: number | null;
  pricePerHead?: number | null;
  images?: string[] | null;
  // enhanced fields
  videoUrl?: string | null;
  pricingTiers?: { label: string; price: number }[] | null;
  servings?: string | null;
  shape?: string | null;
  eggless?: boolean;
  sameDay?: boolean;
  customOrder?: boolean;
  pickupAvailable?: boolean;
  featured?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  availableCountries?: string | null;
  availableStates?: string | null;
  availableCities?: string | null;
  inStock?: boolean;
  stockCount?: number | null;
  extraFields?: Record<string, string> | null;
  createdAt: string;
}

export interface Review {
  id: string;
  vendorId: string;
  author: string;
  avatar: string;
  rating: number;
  comment: string;
  eventDate?: string | null;
  createdAt: string;
}

export interface Booking {
  id: string;
  vendorId: string;
  name: string;
  email: string;
  eventType: string;
  eventDate: string;
  eventCity: string;
  guests: number;
  budget: string;
  message: string;
  status: "pending" | "confirmed" | "declined";
  createdAt: string;
}

export interface VendorWithRelations extends Vendor {
  reviews: Review[];
}

export interface VendorFilters {
  ecosystem?: Ecosystem;
  category?: string | null;
  continent?: string | null;
  search?: string | null;
  priceRange?: string | null;
  minRating?: number;
  sort?: string;
  featured?: boolean;
  limit?: number;
}

export interface PlatformStats {
  totalVendors: number;
  totalReviews: number;
  totalBookings: number;
  countries: number;
  findmybitesCount: number;
  pimpmpypartyCount: number;
  avgRating: number;
  continents: { continent: string; count: number }[];
  categories: { ecosystem: string; category: string; count: number }[];
}
