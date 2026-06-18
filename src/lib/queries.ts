"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useVendorQueryParams } from "@/lib/store";
import type {
  Booking,
  Ecosystem,
  PlatformStats,
  Product,
  Review,
  Vendor,
  VendorWithDistance,
  VendorWithRelations,
} from "@/lib/types";

export interface CreateReviewInput {
  vendorId: string;
  author: string;
  avatar: string;
  rating: number;
  comment: string;
  eventDate?: string;
}

export interface CreateBookingInput {
  vendorId: string;
  name: string;
  email: string;
  eventType: string;
  eventDate: string;
  eventCity: string;
  guests: number;
  budget: string;
  message: string;
}

export interface CategoryWithCount {
  id: string;
  ecosystem: Ecosystem;
  label: string;
  description: string;
  icon: string;
  image: string;
  accent: string;
  count: number;
}

export interface VendorsResponse {
  vendors: Vendor[];
  total: number;
}

export interface CategoriesResponse {
  categories: CategoryWithCount[];
}

export interface ReviewsResponse {
  reviews: Review[];
}

export interface BookingsResponse {
  bookings: Booking[];
}

export interface CreateReviewResponse {
  review: Review;
  rating: number;
  reviewCount: number;
}

export interface CreateBookingResponse {
  booking: Booking;
}

export interface CreateVendorInput {
  name: string;
  ecosystem: Ecosystem;
  category: string;
  tagline: string;
  description: string;
  city: string;
  countryCode: string;
  currency: string;
  priceRange: string;
  basePrice: number;
  tags: string[];
  responseTime: string;
  yearsActive: number;
  logoUrl?: string;
  bannerUrl?: string;
  subcategory?: string;
  state?: string;
  address?: string;
  zipCode?: string;
  instagram?: string;
  website?: string;
  whatsapp?: string;
  serviceRadiusKm?: number;
}

export interface CreateVendorResponse {
  vendor: Vendor;
}

/** Fields a vendor can update after listing. Excludes ecosystem + slug (immutable). */
export type UpdateVendorInput = Omit<CreateVendorInput, "ecosystem">;

export interface UpdateVendorResponse {
  vendor: Vendor;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export function useVendors(): UseQueryResult<VendorsResponse, Error> {
  const params = useVendorQueryParams();
  return useQuery({
    queryKey: ["vendors", params],
    queryFn: () => fetchJson<VendorsResponse>(`/api/vendors?${params}`),
  });
}

export function useFeaturedVendors(
  ecosystem: Ecosystem
): UseQueryResult<VendorsResponse, Error> {
  return useQuery({
    queryKey: ["vendors", "featured", ecosystem],
    queryFn: () =>
      fetchJson<VendorsResponse>(
        `/api/vendors?ecosystem=${ecosystem}&featured=true&limit=8&sort=rating`
      ),
  });
}

export function useVendor(
  slug: string | null
): UseQueryResult<VendorWithRelations, Error> {
  return useQuery({
    queryKey: ["vendor", slug],
    enabled: !!slug,
    queryFn: () => fetchJson<VendorWithRelations>(`/api/vendors/${slug}`),
  });
}

export function useCategories(
  ecosystem: Ecosystem
): UseQueryResult<CategoriesResponse, Error> {
  return useQuery({
    queryKey: ["categories", ecosystem],
    queryFn: () =>
      fetchJson<CategoriesResponse>(`/api/categories?ecosystem=${ecosystem}`),
  });
}

export function useReviews(
  vendorId: string | null
): UseQueryResult<ReviewsResponse, Error> {
  return useQuery({
    queryKey: ["reviews", vendorId],
    enabled: !!vendorId,
    queryFn: () => fetchJson<ReviewsResponse>(`/api/reviews?vendorId=${vendorId}`),
  });
}

export function useStats(): UseQueryResult<PlatformStats, Error> {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => fetchJson<PlatformStats>(`/api/stats`),
  });
}

export function useCreateReview(): UseMutationResult<
  CreateReviewResponse,
  Error,
  CreateReviewInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        throw new Error("Failed to submit review");
      }
      return (await res.json()) as CreateReviewResponse;
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        // invalidate any vendor detail query (keyed by slug) so reviewCount/rating refresh
        qc.invalidateQueries({ queryKey: ["vendor"] }),
        qc.invalidateQueries({ queryKey: ["reviews", variables.vendorId] }),
        qc.invalidateQueries({ queryKey: ["vendors"] }),
        qc.invalidateQueries({ queryKey: ["stats"] }),
      ]);
    },
  });
}

export function useCreateBooking(): UseMutationResult<
  CreateBookingResponse,
  Error,
  CreateBookingInput
> {
  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        throw new Error("Failed to submit booking");
      }
      return (await res.json()) as CreateBookingResponse;
    },
  });
}

export function useCreateVendor(): UseMutationResult<
  CreateVendorResponse,
  Error,
  CreateVendorInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateVendorInput) => {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? "Failed to list your business"
        );
      }
      return (await res.json()) as CreateVendorResponse;
    },
    onSuccess: async () => {
      // refresh vendor lists, category counts, and platform stats
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["vendors"] }),
        qc.invalidateQueries({ queryKey: ["categories"] }),
        qc.invalidateQueries({ queryKey: ["stats"] }),
      ]);
    },
  });
}

export function useUpdateVendor(): UseMutationResult<
  UpdateVendorResponse,
  Error,
  { slug: string; input: UpdateVendorInput }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, input }) => {
      const res = await fetch(`/api/vendors/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? "Failed to update listing"
        );
      }
      return (await res.json()) as UpdateVendorResponse;
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["vendor", variables.slug] }),
        qc.invalidateQueries({ queryKey: ["vendors"] }),
        qc.invalidateQueries({ queryKey: ["categories"] }),
        qc.invalidateQueries({ queryKey: ["stats"] }),
      ]);
    },
  });
}

export interface NearVendorsResponse {
  vendors: VendorWithDistance[];
  total: number;
  center: { lat: number; lng: number };
  radius: number;
}

/** Vendors near a lat/lng, sorted by distance (closest first). */
export function useNearVendors(
  lat: number | null,
  lng: number | null,
  radius: number,
  ecosystem: Ecosystem,
  enabled = true
): UseQueryResult<NearVendorsResponse, Error> {
  return useQuery({
    queryKey: ["vendors", "near", lat, lng, radius, ecosystem],
    enabled: enabled && lat != null && lng != null,
    queryFn: async () => {
      const url = `/api/vendors/near?lat=${lat}&lng=${lng}&radius=${radius}&ecosystem=${ecosystem}&limit=50`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch nearby vendors");
      return (await res.json()) as NearVendorsResponse;
    },
    staleTime: 60 * 1000,
  });
}

/** Geocode a free-text address into lat/lng (for the vendor form preview). */
export function useGeocode(address: string, enabled = true) {
  return useQuery<{ lat: number; lng: number } | null>({
    queryKey: ["geocode", address],
    enabled: enabled && address.trim().length > 5,
    queryFn: async () => {
      const res = await fetch(
        `/api/geocode?address=${encodeURIComponent(address)}`
      );
      if (!res.ok) return null;
      return (await res.json()) as { lat: number; lng: number };
    },
    staleTime: Infinity, // addresses don't move — cache forever
  });
}

// ── Admin hooks ────────────────────────────────────────────────────────────

export type AdminVendor = Vendor;
export interface AdminVendorsResponse {
  vendors: AdminVendor[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useAdminVendors(params: {
  ecosystem?: string;
  search?: string;
  featured?: "true" | "false";
  verified?: "true" | "false";
  approved?: "true" | "false";
  page?: number;
  pageSize?: number;
}): UseQueryResult<AdminVendorsResponse, Error> {
  const qs = new URLSearchParams();
  if (params.ecosystem) qs.set("ecosystem", params.ecosystem);
  if (params.search) qs.set("search", params.search);
  if (params.featured) qs.set("featured", params.featured);
  if (params.verified) qs.set("verified", params.verified);
  if (params.approved) qs.set("approved", params.approved);
  qs.set("page", String(params.page ?? 1));
  qs.set("pageSize", String(params.pageSize ?? 20));
  const url = `/api/admin/vendors?${qs.toString()}`;
  return useQuery({
    queryKey: ["admin", "vendors", qs.toString()],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return (await res.json()) as AdminVendorsResponse;
    },
    staleTime: 15 * 1000,
  });
}

export function useDeleteVendor(): UseMutationResult<
  { ok: boolean },
  Error,
  string
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string) => {
      const res = await fetch(`/api/vendors/${slug}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? "Failed to delete vendor"
        );
      }
      return (await res.json()) as { ok: boolean };
    },
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "vendors"] }),
        qc.invalidateQueries({ queryKey: ["vendors"] }),
        qc.invalidateQueries({ queryKey: ["categories"] }),
        qc.invalidateQueries({ queryKey: ["stats"] }),
        qc.invalidateQueries({ queryKey: ["admin", "stats"] }),
      ]),
  });
}

export function useToggleVendorFlag(): UseMutationResult<
  { vendor: Vendor },
  Error,
  { slug: string; featured?: boolean; verified?: boolean; approved?: boolean }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, featured, verified, approved }) => {
      const res = await fetch(`/api/vendors/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured, verified, approved }),
      });
      if (!res.ok) throw new Error("Failed to update vendor");
      return (await res.json()) as { vendor: Vendor };
    },
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "vendors"] }),
        qc.invalidateQueries({ queryKey: ["vendors"] }),
        qc.invalidateQueries({ queryKey: ["vendor"] }),
      ]),
  });
}

export interface AdminBooking extends Booking {
  vendorName: string;
  vendorCity: string;
}
export interface AdminBookingsResponse {
  bookings: AdminBooking[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useAdminBookings(params: {
  status?: string;
  page?: number;
  pageSize?: number;
}): UseQueryResult<AdminBookingsResponse, Error> {
  const qs = new URLSearchParams();
  if (params.status && params.status !== "all")
    qs.set("status", params.status);
  qs.set("page", String(params.page ?? 1));
  qs.set("pageSize", String(params.pageSize ?? 25));
  return useQuery({
    queryKey: ["admin", "bookings", qs.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/admin/bookings?${qs.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return (await res.json()) as AdminBookingsResponse;
    },
    staleTime: 15 * 1000,
  });
}

export function useUpdateBookingStatus(): UseMutationResult<
  { id: string; status: string },
  Error,
  { id: string; status: "pending" | "confirmed" | "declined" }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update booking");
      return (await res.json()) as { id: string; status: string };
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "bookings"] }),
  });
}

export function useDeleteBooking(): UseMutationResult<
  { ok: boolean },
  Error,
  string
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete booking");
      return (await res.json()) as { ok: boolean };
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "bookings"] }),
  });
}

export interface AdminReview extends Review {
  vendorName: string;
}
export interface AdminReviewsResponse {
  reviews: AdminReview[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useAdminReviews(params: {
  rating?: string;
  page?: number;
  pageSize?: number;
}): UseQueryResult<AdminReviewsResponse, Error> {
  const qs = new URLSearchParams();
  if (params.rating && params.rating !== "all")
    qs.set("rating", params.rating);
  qs.set("page", String(params.page ?? 1));
  qs.set("pageSize", String(params.pageSize ?? 25));
  return useQuery({
    queryKey: ["admin", "reviews", qs.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reviews?${qs.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return (await res.json()) as AdminReviewsResponse;
    },
    staleTime: 15 * 1000,
  });
}

export function useDeleteReview(): UseMutationResult<
  { ok: boolean; rating: number; reviewCount: number },
  Error,
  string
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete review");
      return (await res.json()) as {
        ok: boolean;
        rating: number;
        reviewCount: number;
      };
    },
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "reviews"] }),
        qc.invalidateQueries({ queryKey: ["reviews"] }),
        qc.invalidateQueries({ queryKey: ["vendor"] }),
        qc.invalidateQueries({ queryKey: ["admin", "stats"] }),
      ]),
  });
}

export interface AdminStats {
  totals: {
    vendors: number;
    reviews: number;
    bookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    avgRating: number;
  };
  vendorsByEcosystem: { ecosystem: string; count: number }[];
  vendorsByContinent: { continent: string; count: number }[];
  vendorsByCategory: { category: string; count: number }[];
  bookingsByStatus: { status: string; count: number }[];
  recentBookings: {
    id: string;
    name: string;
    eventType: string;
    eventDate: string;
    status: string;
    createdAt: string;
    vendorName: string;
  }[];
  recentVendors: {
    id: string;
    name: string;
    slug: string;
    ecosystem: string;
    city: string;
    country: string;
    createdAt: string;
  }[];
}

export function useAdminStats(): UseQueryResult<AdminStats, Error> {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch admin stats");
      return (await res.json()) as AdminStats;
    },
    staleTime: 30 * 1000,
  });
}

// ── Vendor Dashboard hooks ─────────────────────────────────────────────────

export interface VendorDashboardData {
  vendors: Vendor[];
  bookings: (Booking & { vendorName: string })[];
  reviews: (Review & { vendorName: string })[];
  stats: {
    totalListings: number;
    pending: number;
    approved: number;
    totalBookings: number;
    pendingBookings: number;
    avgRating: number;
  };
}

export function useVendorDashboard(enabled = true) {
  return useQuery({
    queryKey: ["vendor", "dashboard"],
    enabled,
    queryFn: async () => {
      const res = await fetch("/api/vendor/me");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return (await res.json()) as VendorDashboardData;
    },
    staleTime: 15 * 1000,
  });
}

// ── Product hooks ───────────────────────────────────────────────────────────

export function useProducts(vendorId: string | null) {
  return useQuery({
    queryKey: ["products", vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      const res = await fetch(`/api/products?vendorId=${vendorId}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return (await res.json()) as { products: Product[] };
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      vendorId: string;
      name: string;
      description?: string;
      price: number;
      image?: string;
      productType?: string;
      sizes?: string;
      flavours?: string;
      weight?: string;
      prepTime?: string;
      deliveryAvailable?: boolean;
      minGuests?: number;
      pricePerHead?: number;
      images?: string[];
    }) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create product");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["products", variables.vendorId] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vendorId }: { id: string; vendorId: string }) => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      return { vendorId };
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["products", variables.vendorId] });
    },
  });
}
