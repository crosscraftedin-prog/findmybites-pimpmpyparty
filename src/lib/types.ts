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
  responseTime: string;
  yearsActive: number;
  completedBookings: number;
  subcategory?: string | null;
  address?: string | null;
  zipCode?: string | null;
  instagram?: string | null;
  website?: string | null;
  whatsapp?: string | null;
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
