"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  ExternalLink,
  Link2,
  Check,
  X,
  Loader2,
  Store,
  CheckCircle2,
  Clock,
  Eye,
  Copy,
  Send,
} from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { useCategoryLabels } from "@/hooks/use-category-labels";
import type { Ecosystem } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────

export interface AdminVendor {
  id: string;
  name: string;
  slug: string;
  category: string;
  city: string;
  country: string;
  phone: string | null;
  userEmail: string | null;
  avatarImage: string | null;
  heroImage: string | null;
  listingStatus: string | null;
  ownership_status: string | null;
  inviteStatus: string | null;
  adminCreated: boolean;
  businessSource: string | null;
  createdAt: string;
  claimedAt: string | null;
  claimToken: string | null;
  inviteSentAt: string | null;
}

interface DuplicateMatch {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  reason?: string;
}

interface BusinessFormState {
  name: string;
  category: string;
  ecosystem: Ecosystem;
  city: string;
  country: string;
  countryCode: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  instagram: string;
  description: string;
  priceRange: string;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  tagline: string;
  address: string;
}

const EMPTY_FORM: BusinessFormState = {
  name: "",
  category: "",
  ecosystem: "FINDMYBITES",
  city: "",
  country: "",
  countryCode: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
  instagram: "",
  description: "",
  priceRange: "$$",
  deliveryAvailable: false,
  pickupAvailable: false,
  tagline: "",
  address: "",
};

const PRICE_RANGES = [
  { value: "$", label: "$ — Affordable" },
  { value: "$$", label: "$$ — Moderate" },
  { value: "$$$", label: "$$$ — Premium" },
  { value: "$$$$", label: "$$$$ — Luxury" },
];

const LISTING_STATUS_OPTIONS = [
  { value: "all", label: "All listing statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "claimed", label: "Claimed" },
  { value: "hidden", label: "Hidden" },
  { value: "rejected", label: "Rejected" },
];

const OWNERSHIP_STATUS_OPTIONS = [
  { value: "all", label: "All ownership" },
  { value: "unclaimed", label: "Unclaimed" },
  { value: "pending", label: "Pending claim" },
  { value: "claimed", label: "Claimed" },
];

// ── Helpers ───────────────────────────────────────────────────────────────

function timeAgo(date: string): string {
  try {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "yesterday";
    if (days < 30) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  } catch {
    return "—";
  }
}

function copyToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

// ── Status badges ─────────────────────────────────────────────────────────

const LISTING_BADGE: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  draft: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  claimed: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-900",
  hidden: "bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  rejected: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
};

const OWNERSHIP_BADGE: Record<string, string> = {
  unclaimed: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  pending: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-900",
  claimed: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
};

const INVITE_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  opened: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-900",
  claimed: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  expired: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
};

function StatusBadge({ kind, value }: { kind: "listing" | "ownership" | "invite"; value: string | null }) {
  const v = (value ?? "").toLowerCase();
  const map =
    kind === "listing" ? LISTING_BADGE : kind === "ownership" ? OWNERSHIP_BADGE : INVITE_BADGE;
  const cls = map[v] ?? "bg-muted text-muted-foreground border-border";
  const label = v ? v.charAt(0).toUpperCase() + v.slice(1) : "—";
  return (
    <Badge variant="outline" className={cls}>
      {label}
    </Badge>
  );
}

// ── Component ─────────────────────────────────────────────────────────────

export function AdminBusinesses() {
  const { getLabel } = useCategoryLabels();

  // List state
  const [vendors, setVendors] = React.useState<AdminVendor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [ownershipFilter, setOwnershipFilter] = React.useState("all");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = React.useState(false);

  // Dialog state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminVendor | null>(null);
  const [claimLinkOpen, setClaimLinkOpen] = React.useState(false);
  const [claimLinkUrl, setClaimLinkUrl] = React.useState("");
  const [claimLinkLoading, setClaimLinkLoading] = React.useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectingId, setRejectingId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [rejectLoading, setRejectLoading] = React.useState(false);
  const [hideLoading, setHideLoading] = React.useState<string | null>(null);
  const [approveLoading, setApproveLoading] = React.useState<string | null>(null);

  // Form state
  const [form, setForm] = React.useState<BusinessFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = React.useState(false);
  const [duplicateWarning, setDuplicateWarning] = React.useState<DuplicateMatch[] | null>(null);

  // ── Fetch list ──────────────────────────────────────────────────────────
  const fetchVendors = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (ownershipFilter !== "all") params.set("ownership", ownershipFilter);
      if (search.trim()) params.set("q", search.trim());
      params.set("adminOnly", "true");
      params.set("limit", "100");

      const res = await fetch(`/api/admin/businesses?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to load businesses");
        setVendors([]);
        return;
      }
      const data = await res.json();
      setVendors(Array.isArray(data.vendors) ? data.vendors : []);
    } catch {
      toast.error("Network error loading businesses");
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, ownershipFilter, search]);

  React.useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => {
      fetchVendors();
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── Selection ───────────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (prev.size === vendors.length && vendors.length > 0) return new Set();
      return new Set(vendors.map((v) => v.id));
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // ── Form helpers ────────────────────────────────────────────────────────
  const updateForm = (field: keyof BusinessFormState, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDuplicateWarning(null);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setDuplicateWarning(null);
  };

  // Filter categories by selected ecosystem
  const categoryOptions = React.useMemo(
    () => CATEGORIES.filter((c) => c.ecosystem === form.ecosystem),
    [form.ecosystem]
  );

  // When ecosystem changes, reset category if invalid
  React.useEffect(() => {
    if (form.category && !categoryOptions.some((c) => c.id === form.category)) {
      setForm((prev) => ({ ...prev, category: "" }));
    }
  }, [form.ecosystem, categoryOptions, form.category]);

  // ── Create ──────────────────────────────────────────────────────────────
  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    if (!form.name.trim() || !form.category || !form.city.trim()) {
      toast.error("Name, category, and city are required");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        ecosystem: form.ecosystem,
        city: form.city.trim(),
        country: form.country.trim(),
        countryCode: form.countryCode.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim(),
        userEmail: form.email.trim(),
        email: form.email.trim(),
        website: form.website.trim(),
        instagram: form.instagram.trim(),
        description: form.description.trim(),
        priceRange: form.priceRange,
        deliveryAvailable: form.deliveryAvailable,
        pickupAvailable: form.pickupAvailable,
        tagline: form.tagline.trim(),
        address: form.address.trim(),
        businessSource: "admin",
        listingStatus: "draft",
      };

      const res = await fetch("/api/admin/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        setDuplicateWarning(Array.isArray(data.duplicates) ? data.duplicates : []);
        toast.error("Duplicate business detected", {
          description: "A business with the same name, phone, or email already exists.",
        });
        return;
      }
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create business");
        return;
      }

      toast.success("Business created", {
        description: data.slug ? `Slug: ${data.slug}` : undefined,
      });
      setCreateOpen(false);
      resetForm();
      fetchVendors();
    } catch {
      toast.error("Network error while creating business");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────────
  const openEdit = async (vendor: AdminVendor) => {
    setEditing(vendor);
    setForm({
      name: vendor.name ?? "",
      category: vendor.category ?? "",
      ecosystem: (vendor.businessSource === "PIMPMYPARTY" ? "PIMPMYPARTY" : "FINDMYBITES") as Ecosystem,
      city: vendor.city ?? "",
      country: vendor.country ?? "",
      countryCode: "",
      phone: vendor.phone ?? "",
      whatsapp: "",
      email: vendor.userEmail ?? "",
      website: "",
      instagram: "",
      description: "",
      priceRange: "$$",
      deliveryAvailable: false,
      pickupAvailable: false,
      tagline: "",
      address: "",
    });
    setDuplicateWarning(null);

    // Fetch full vendor details for richer edit form
    try {
      const res = await fetch(`/api/admin/businesses/${vendor.id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const v = data.vendor;
        if (v) {
          setForm((prev) => ({
            ...prev,
            name: v.name ?? prev.name,
            category: v.category ?? prev.category,
            ecosystem: (v.ecosystem ?? prev.ecosystem) as Ecosystem,
            city: v.city ?? prev.city,
            country: v.country ?? prev.country,
            countryCode: v.countryCode ?? "",
            phone: v.phone ?? prev.phone,
            whatsapp: v.whatsapp ?? "",
            email: v.userEmail ?? v.email ?? prev.email,
            website: v.website ?? "",
            instagram: v.instagram ?? "",
            description: v.description ?? "",
            priceRange: v.priceRange ?? "$$",
            deliveryAvailable: !!v.deliveryAvailable,
            pickupAvailable: !!v.pickupAvailable,
            tagline: v.tagline ?? "",
            address: v.address ?? "",
          }));
        }
      }
    } catch {
      // ignore — fall back to list-row data
    }

    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editing) return;
    if (!form.name.trim() || !form.category || !form.city.trim()) {
      toast.error("Name, category, and city are required");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        ecosystem: form.ecosystem,
        city: form.city.trim(),
        country: form.country.trim(),
        countryCode: form.countryCode.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim(),
        userEmail: form.email.trim(),
        website: form.website.trim(),
        instagram: form.instagram.trim(),
        description: form.description.trim(),
        priceRange: form.priceRange,
        deliveryAvailable: form.deliveryAvailable,
        pickupAvailable: form.pickupAvailable,
        tagline: form.tagline.trim(),
        address: form.address.trim(),
      };

      const res = await fetch(`/api/admin/businesses/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update business");
        return;
      }
      toast.success("Business updated");
      setEditOpen(false);
      setEditing(null);
      fetchVendors();
    } catch {
      toast.error("Network error while updating business");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Claim link ──────────────────────────────────────────────────────────
  const handleGenerateClaimLink = async (vendor: AdminVendor) => {
    setClaimLinkLoading(vendor.id);
    try {
      const res = await fetch(
        `/api/admin/businesses/${vendor.id}?action=generate-claim-link`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Failed to generate claim link");
        return;
      }
      const url = data.claimUrl
        ? `${typeof window !== "undefined" ? window.location.origin : ""}${data.claimUrl}`
        : "";
      setClaimLinkUrl(url);
      setClaimLinkOpen(true);
      toast.success("Claim link generated");
    } catch {
      toast.error("Network error while generating claim link");
    } finally {
      setClaimLinkLoading(null);
    }
  };

  // ── Approve claim ───────────────────────────────────────────────────────
  const handleApproveClaim = async (vendor: AdminVendor) => {
    setApproveLoading(vendor.id);
    try {
      const res = await fetch(
        `/api/admin/businesses/${vendor.id}?action=approve-claim`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Failed to approve claim");
        return;
      }
      toast.success("Claim approved", { description: vendor.name });
      fetchVendors();
    } catch {
      toast.error("Network error while approving claim");
    } finally {
      setApproveLoading(null);
    }
  };

  // ── Reject claim ────────────────────────────────────────────────────────
  const openReject = (vendor: AdminVendor) => {
    setRejectingId(vendor.id);
    setRejectReason("");
    setRejectOpen(true);
  };

  const submitReject = async () => {
    if (!rejectingId) return;
    setRejectLoading(true);
    try {
      const res = await fetch(
        `/api/admin/businesses/${rejectingId}?action=reject-claim`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason.trim() || undefined }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Failed to reject claim");
        return;
      }
      toast.success("Claim rejected");
      setRejectOpen(false);
      setRejectingId(null);
      setRejectReason("");
      fetchVendors();
    } catch {
      toast.error("Network error while rejecting claim");
    } finally {
      setRejectLoading(false);
    }
  };

  // ── Hide (soft delete) ──────────────────────────────────────────────────
  const handleHide = async (vendor: AdminVendor) => {
    if (!confirm(`Hide "${vendor.name}"? It will be removed from public listings.`)) return;
    setHideLoading(vendor.id);
    try {
      const res = await fetch(`/api/admin/businesses/${vendor.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Failed to hide business");
        return;
      }
      toast.success("Business hidden", { description: vendor.name });
      // Remove from selection if present
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(vendor.id);
        return next;
      });
      fetchVendors();
    } catch {
      toast.error("Network error while hiding business");
    } finally {
      setHideLoading(null);
    }
  };

  // ── Bulk actions ────────────────────────────────────────────────────────
  const runBulk = async (action: "publish" | "hide" | "invite") => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/businesses/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, vendorIds: ids }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? `Bulk ${action} failed`);
        return;
      }
      const verb =
        action === "publish" ? "published" : action === "hide" ? "hidden" : "invited";
      toast.success(`${ids.length} business${ids.length === 1 ? "" : "es"} ${verb}`);
      clearSelection();
      fetchVendors();
    } catch {
      toast.error(`Network error during bulk ${action}`);
    } finally {
      setBulkLoading(false);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────
  const allSelected = vendors.length > 0 && selectedIds.size === vendors.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < vendors.length;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Store className="size-5" />
            Admin-Created Businesses
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage business listings created by admins, invite vendors to claim them, and approve/reject ownership claims.
          </p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="size-4" />
          Create Business
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search name, city, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Listing status" />
          </SelectTrigger>
          <SelectContent>
            {LISTING_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ownershipFilter} onValueChange={setOwnershipFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Ownership status" />
          </SelectTrigger>
          <SelectContent>
            {OWNERSHIP_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(statusFilter !== "all" || ownershipFilter !== "all" || search) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusFilter("all");
              setOwnershipFilter("all");
              setSearch("");
            }}
          >
            <X className="size-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border bg-muted/40 p-3">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span className="font-medium">{selectedIds.size} selected</span>
            <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7">
              Clear
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => runBulk("publish")}
              disabled={bulkLoading}
            >
              {bulkLoading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Publish
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => runBulk("hide")}
              disabled={bulkLoading}
            >
              {bulkLoading ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Hide
            </Button>
            <Button
              size="sm"
              onClick={() => runBulk("invite")}
              disabled={bulkLoading}
            >
              {bulkLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Send Invites
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin mr-2" />
          Loading businesses…
        </div>
      ) : vendors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Store className="size-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm font-medium text-foreground">No businesses found</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {search || statusFilter !== "all" || ownershipFilter !== "all"
              ? "Try adjusting your filters or search."
              : "Create your first admin business listing to get started."}
          </p>
          {!search && statusFilter === "all" && ownershipFilter === "all" && (
            <Button onClick={openCreate} className="mt-4" size="sm">
              <Plus className="size-4" />
              Create Business
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr className="text-left">
                    <th className="w-10 px-3 py-2.5">
                      <Checkbox
                        checked={allSelected ? true : someSelected ? "indeterminate" : false}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </th>
                    <th className="px-3 py-2.5 font-medium">Business</th>
                    <th className="px-3 py-2.5 font-medium">Category</th>
                    <th className="px-3 py-2.5 font-medium">City</th>
                    <th className="px-3 py-2.5 font-medium">Listing</th>
                    <th className="px-3 py-2.5 font-medium">Ownership</th>
                    <th className="px-3 py-2.5 font-medium">Invite</th>
                    <th className="px-3 py-2.5 font-medium">Created</th>
                    <th className="px-3 py-2.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v) => {
                    const isPending = (v.ownership_status ?? "").toLowerCase() === "pending";
                    return (
                      <tr
                        key={v.id}
                        className="border-t border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-3 py-2.5">
                          <Checkbox
                            checked={selectedIds.has(v.id)}
                            onCheckedChange={() => toggleSelect(v.id)}
                            aria-label={`Select ${v.name}`}
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="size-9 rounded-md bg-muted overflow-hidden flex items-center justify-center shrink-0">
                              {v.avatarImage ? (
                                <img
                                  src={v.avatarImage}
                                  alt={v.name}
                                  className="size-full object-cover"
                                />
                              ) : (
                                <Store className="size-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-foreground truncate max-w-[220px]">
                                {v.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                                {v.phone ?? v.userEmail ?? v.slug}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {getLabel(v.category) ?? v.category ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {v.city ?? "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge kind="listing" value={v.listingStatus} />
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge kind="ownership" value={v.ownership_status} />
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge kind="invite" value={v.inviteStatus} />
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                          {v.createdAt ? timeAgo(v.createdAt) : "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <RowActions
                            vendor={v}
                            isPending={isPending}
                            onEdit={() => openEdit(v)}
                            onClaimLink={() => handleGenerateClaimLink(v)}
                            onApprove={() => handleApproveClaim(v)}
                            onReject={() => openReject(v)}
                            onHide={() => handleHide(v)}
                            claimLinkLoading={claimLinkLoading === v.id}
                            approveLoading={approveLoading === v.id}
                            hideLoading={hideLoading === v.id}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {vendors.map((v) => {
              const isPending = (v.ownership_status ?? "").toLowerCase() === "pending";
              return (
                <div
                  key={v.id}
                  className="rounded-lg border border-border bg-background p-3 space-y-3"
                >
                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      checked={selectedIds.has(v.id)}
                      onCheckedChange={() => toggleSelect(v.id)}
                      aria-label={`Select ${v.name}`}
                      className="mt-1"
                    />
                    <div className="size-10 rounded-md bg-muted overflow-hidden flex items-center justify-center shrink-0">
                      {v.avatarImage ? (
                        <img
                          src={v.avatarImage}
                          alt={v.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <Store className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground truncate">{v.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {getLabel(v.category) ?? v.category ?? "—"} · {v.city ?? "—"}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge kind="listing" value={v.listingStatus} />
                    <StatusBadge kind="ownership" value={v.ownership_status} />
                    <StatusBadge kind="invite" value={v.inviteStatus} />
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" />
                    {v.createdAt ? timeAgo(v.createdAt) : "—"}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border">
                    <RowActions
                      vendor={v}
                      isPending={isPending}
                      onEdit={() => openEdit(v)}
                      onClaimLink={() => handleGenerateClaimLink(v)}
                      onApprove={() => handleApproveClaim(v)}
                      onReject={() => openReject(v)}
                      onHide={() => handleHide(v)}
                      claimLinkLoading={claimLinkLoading === v.id}
                      approveLoading={approveLoading === v.id}
                      hideLoading={hideLoading === v.id}
                      compact
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Create dialog */}
      <BusinessFormDialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) resetForm();
        }}
        title="Create New Business"
        description="Add a new business listing. The business will start as a draft and can be published or claimed later."
        form={form}
        updateForm={updateForm}
        categoryOptions={categoryOptions}
        submitting={submitting}
        duplicateWarning={duplicateWarning}
        onSubmit={submitCreate}
        submitLabel="Create Business"
      />

      {/* Edit dialog */}
      <BusinessFormDialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) {
            setEditing(null);
            resetForm();
          }
        }}
        title="Edit Business"
        description="Update the business listing details."
        form={form}
        updateForm={updateForm}
        categoryOptions={categoryOptions}
        submitting={submitting}
        duplicateWarning={duplicateWarning}
        onSubmit={submitEdit}
        submitLabel="Save Changes"
      />

      {/* Claim link dialog */}
      <Dialog open={claimLinkOpen} onOpenChange={setClaimLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="size-4" />
              Claim Link
            </DialogTitle>
            <DialogDescription>
              Share this URL with the business owner. They can use it to claim ownership of this listing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="claim-url">Claim URL</Label>
            <div className="flex gap-2">
              <Input id="claim-url" readOnly value={claimLinkUrl} className="font-mono text-xs" />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => {
                  copyToClipboard(claimLinkUrl);
                  toast.success("Link copied to clipboard");
                }}
              >
                <Copy className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This link is unique and tied to a single-use claim token. Generating a new link will
              invalidate any previous unclaimed links.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClaimLinkOpen(false)}>
              Close
            </Button>
            <Button asChild>
              <a href={claimLinkUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                Open Link
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject claim dialog */}
      <Dialog open={rejectOpen} onOpenChange={(o) => {
        setRejectOpen(o);
        if (!o) {
          setRejectingId(null);
          setRejectReason("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="size-4" />
              Reject Ownership Claim
            </DialogTitle>
            <DialogDescription>
              The business owner will be notified that their claim was rejected. Provide an optional reason below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason (optional)</Label>
            <Textarea
              id="reject-reason"
              placeholder="e.g. Could not verify business ownership documents."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={submitReject}
              disabled={rejectLoading}
            >
              {rejectLoading ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
              Reject Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Row actions ───────────────────────────────────────────────────────────

interface RowActionsProps {
  vendor: AdminVendor;
  isPending: boolean;
  onEdit: () => void;
  onClaimLink: () => void;
  onApprove: () => void;
  onReject: () => void;
  onHide: () => void;
  claimLinkLoading: boolean;
  approveLoading: boolean;
  hideLoading: boolean;
  compact?: boolean;
}

function RowActions({
  vendor,
  isPending,
  onEdit,
  onClaimLink,
  onApprove,
  onReject,
  onHide,
  claimLinkLoading,
  approveLoading,
  hideLoading,
  compact,
}: RowActionsProps) {
  const btnCls = compact ? "h-8 px-2 text-xs" : "h-8 px-2.5 text-xs";
  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        className={btnCls}
        onClick={onEdit}
        title="Edit"
      >
        <Pencil className="size-3.5" />
        <span className="hidden lg:inline">Edit</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={btnCls}
        onClick={onClaimLink}
        disabled={claimLinkLoading}
        title="Generate claim link"
      >
        {claimLinkLoading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Link2 className="size-3.5" />
        )}
        <span className="hidden lg:inline">Claim Link</span>
      </Button>
      {isPending && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className={`${btnCls} text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950`}
            onClick={onApprove}
            disabled={approveLoading}
            title="Approve claim"
          >
            {approveLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            <span className="hidden lg:inline">Approve</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`${btnCls} text-red-700 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950`}
            onClick={onReject}
            title="Reject claim"
          >
            <X className="size-3.5" />
            <span className="hidden lg:inline">Reject</span>
          </Button>
        </>
      )}
      <Button asChild variant="ghost" size="sm" className={btnCls} title="View public page">
        <a href={`/vendor/${vendor.slug}`} target="_blank" rel="noopener noreferrer">
          <Eye className="size-3.5" />
          <span className="hidden lg:inline">View</span>
        </a>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`${btnCls} text-red-700 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950`}
        onClick={onHide}
        disabled={hideLoading}
        title="Hide (soft delete)"
      >
        {hideLoading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Trash2 className="size-3.5" />
        )}
        <span className="hidden lg:inline">Hide</span>
      </Button>
    </div>
  );
}

// ── Business form dialog ──────────────────────────────────────────────────

interface BusinessFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  form: BusinessFormState;
  updateForm: (field: keyof BusinessFormState, value: any) => void;
  categoryOptions: { id: string; ecosystem: Ecosystem }[];
  submitting: boolean;
  duplicateWarning: DuplicateMatch[] | null;
  onSubmit: () => void;
  submitLabel: string;
}

function BusinessFormDialog({
  open,
  onOpenChange,
  title,
  description,
  form,
  updateForm,
  categoryOptions,
  submitting,
  duplicateWarning,
  onSubmit,
  submitLabel,
}: BusinessFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="size-4" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Duplicate warning */}
        {duplicateWarning && duplicateWarning.length > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-200">
              <CheckCircle2 className="size-4" />
              Possible duplicate detected
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              A business with matching details already exists. Review the matches below before submitting again.
            </p>
            <ul className="space-y-1 max-h-32 overflow-y-auto">
              {duplicateWarning.map((d, i) => (
                <li
                  key={d.id ?? i}
                  className="text-xs bg-background/60 rounded px-2 py-1 border border-amber-200 dark:border-amber-900"
                >
                  <span className="font-medium">{d.name ?? "Unnamed"}</span>
                  {d.phone && <span className="text-muted-foreground"> · {d.phone}</span>}
                  {d.email && <span className="text-muted-foreground"> · {d.email}</span>}
                  {d.reason && (
                    <span className="text-muted-foreground italic"> — {d.reason}</span>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              You can still submit if you confirm this is a different business.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Name */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bf-name">
              Business Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bf-name"
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
              placeholder="e.g. Sweet Dreams Bakery"
            />
          </div>

          {/* Ecosystem */}
          <div className="space-y-1.5">
            <Label htmlFor="bf-ecosystem">Ecosystem</Label>
            <Select
              value={form.ecosystem}
              onValueChange={(v) => updateForm("ecosystem", v as Ecosystem)}
            >
              <SelectTrigger id="bf-ecosystem">
                <SelectValue placeholder="Select ecosystem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FINDMYBITES">FindMyBites</SelectItem>
                <SelectItem value="PIMPMYPARTY">PimpMyParty</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="bf-category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.category}
              onValueChange={(v) => updateForm("category", v)}
            >
              <SelectTrigger id="bf-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {categoryOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div className="space-y-1.5">
            <Label htmlFor="bf-city">
              City <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bf-city"
              value={form.city}
              onChange={(e) => updateForm("city", e.target.value)}
              placeholder="e.g. Mumbai"
            />
          </div>

          {/* Country */}
          <div className="space-y-1.5">
            <Label htmlFor="bf-country">Country</Label>
            <Input
              id="bf-country"
              value={form.country}
              onChange={(e) => updateForm("country", e.target.value)}
              placeholder="e.g. India"
            />
          </div>

          {/* Country code */}
          <div className="space-y-1.5">
            <Label htmlFor="bf-country-code">Country Code</Label>
            <Input
              id="bf-country-code"
              value={form.countryCode}
              onChange={(e) => updateForm("countryCode", e.target.value)}
              placeholder="e.g. +91"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="bf-phone">Phone</Label>
            <Input
              id="bf-phone"
              value={form.phone}
              onChange={(e) => updateForm("phone", e.target.value)}
              placeholder="e.g. 9876543210"
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-1.5">
            <Label htmlFor="bf-whatsapp">WhatsApp</Label>
            <Input
              id="bf-whatsapp"
              value={form.whatsapp}
              onChange={(e) => updateForm("whatsapp", e.target.value)}
              placeholder="e.g. 9876543210"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="bf-email">Email</Label>
            <Input
              id="bf-email"
              type="email"
              value={form.email}
              onChange={(e) => updateForm("email", e.target.value)}
              placeholder="owner@example.com"
            />
          </div>

          {/* Website */}
          <div className="space-y-1.5">
            <Label htmlFor="bf-website">Website</Label>
            <Input
              id="bf-website"
              value={form.website}
              onChange={(e) => updateForm("website", e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          {/* Instagram */}
          <div className="space-y-1.5">
            <Label htmlFor="bf-instagram">Instagram</Label>
            <Input
              id="bf-instagram"
              value={form.instagram}
              onChange={(e) => updateForm("instagram", e.target.value)}
              placeholder="@handle or URL"
            />
          </div>

          {/* Price range */}
          <div className="space-y-1.5">
            <Label htmlFor="bf-price">Price Range</Label>
            <Select
              value={form.priceRange}
              onValueChange={(v) => updateForm("priceRange", v)}
            >
              <SelectTrigger id="bf-price">
                <SelectValue placeholder="Select price range" />
              </SelectTrigger>
              <SelectContent>
                {PRICE_RANGES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tagline */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bf-tagline">Tagline</Label>
            <Input
              id="bf-tagline"
              value={form.tagline}
              onChange={(e) => updateForm("tagline", e.target.value)}
              placeholder="Short one-line tagline"
              maxLength={120}
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bf-address">Address</Label>
            <Input
              id="bf-address"
              value={form.address}
              onChange={(e) => updateForm("address", e.target.value)}
              placeholder="Street address, area, landmark"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bf-description">Description</Label>
            <Textarea
              id="bf-description"
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              placeholder="Describe the business, services, specialties…"
              rows={4}
            />
          </div>

          {/* Toggles */}
          <div className="space-y-1.5">
            <Label>Availability</Label>
            <div className="flex flex-col gap-2 pt-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={form.deliveryAvailable}
                  onCheckedChange={(c) => updateForm("deliveryAvailable", c === true)}
                />
                Delivery available
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={form.pickupAvailable}
                  onCheckedChange={(c) => updateForm("pickupAvailable", c === true)}
                />
                Pickup available
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AdminBusinesses;
