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
  Review,
  Vendor,
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
