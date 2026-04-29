"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, CircleAlert, Search, Ticket } from "lucide-react";
import StatCard from "@/components/UI/StatCard";

type OfferLifecycle = "ACTIVE" | "PENDING" | "EXPIRED" | "REJECTED";

type Offer = {
  _id: string;
  title: string;
  description: string;
  offerType: "bogo" | "percentage" | "flat";
  discountValue: number;
  imageUrl: string;
  validUntil: string;
  createdAt: string;
  approvedAt?: string;
  reviewNote?: string;
  location?: string;
  redemptionLimit?: string;
  activeDays?: string[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  lifecycle: OfferLifecycle;
  vendor?: {
    _id?: string;
    name?: string;
    email?: string;
    vendorInfo?: {
      businessName?: string;
    };
  };
};

type OfferStats = {
  total: number;
  active: number;
  expired: number;
  pending: number;
  rejected: number;
};

type OffersResponse = {
  success?: boolean;
  message?: string;
  offers?: Offer[];
  stats?: OfferStats;
};

type FilterKey = "ALL" | OfferLifecycle;

const emptyStats: OfferStats = {
  total: 0,
  active: 0,
  expired: 0,
  pending: 0,
  rejected: 0,
};

const getAuthHeaders = (): Headers => {
  const headers = new Headers();
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

const formatDays = (days?: string[]) => {
  if (!days || days.length === 0) return "-";
  return days.map((day) => day.charAt(0).toUpperCase() + day.slice(1)).join(", ");
};

const lifecycleStyles: Record<OfferLifecycle, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  EXPIRED: "bg-red-100 text-red-700",
  REJECTED: "bg-slate-200 text-slate-700",
};

export default function OfferManagement() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [stats, setStats] = useState<OfferStats>(emptyStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [query, setQuery] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  const fetchOffers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offers/admin/all`,
        {
          headers: getAuthHeaders(),
        },
      );
      const data = (await response.json()) as OffersResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load offers");
      }

      setOffers(data.offers || []);
      setStats(data.stats || emptyStats);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load offers",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOffers();
  }, []);

  const approve = async (id: string) => {
    setActiveId(id);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offers/approve/${id}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        },
      );
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to approve offer");
      }

      await fetchOffers();
    } catch (approveError) {
      setError(
        approveError instanceof Error
          ? approveError.message
          : "Failed to approve offer",
      );
    } finally {
      setActiveId(null);
    }
  };

  const reject = async (id: string) => {
    const reason = window.prompt("Enter rejection reason")?.trim() || "";
    if (!reason) return;

    setActiveId(id);
    setError(null);

    try {
      const headers = getAuthHeaders();
      headers.set("Content-Type", "application/json");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offers/reject/${id}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ reason }),
        },
      );
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to reject offer");
      }

      await fetchOffers();
    } catch (rejectError) {
      setError(
        rejectError instanceof Error
          ? rejectError.message
          : "Failed to reject offer",
      );
    } finally {
      setActiveId(null);
    }
  };

  const deleteOffer = async (id: string) => {
    const confirmed = window.confirm("Delete this offer permanently?");
    if (!confirmed) return;

    setActiveId(id);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offers/${id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete offer");
      }

      if (selectedOffer?._id === id) {
        setSelectedOffer(null);
      }

      await fetchOffers();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete offer",
      );
    } finally {
      setActiveId(null);
    }
  };

  const filteredOffers = useMemo(() => {
    const term = query.trim().toLowerCase();

    return offers.filter((offer) => {
      if (filter !== "ALL" && offer.lifecycle !== filter) {
        return false;
      }

      if (!term) {
        return true;
      }

      const haystack = [
        offer.title,
        offer.description,
        offer.vendor?.name,
        offer.vendor?.email,
        offer.vendor?.vendorInfo?.businessName,
        offer.offerType,
        offer.location,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [filter, offers, query]);

  const filterOptions: Array<{ key: FilterKey; label: string; count: number }> = [
    { key: "ALL", label: "All", count: stats.total },
    { key: "ACTIVE", label: "Active", count: stats.active },
    { key: "PENDING", label: "Pending", count: stats.pending },
    { key: "EXPIRED", label: "Expired", count: stats.expired },
    { key: "REJECTED", label: "Rejected", count: stats.rejected },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offer Dashboard</h1>
          <p className="text-sm text-gray-600">
            Review vendor offers, track expiry, and open full offer details from the table.
          </p>
        </div>

        <button
          onClick={() => void fetchOffers()}
          disabled={loading}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Offers" value={stats.total} helperText="All submitted offers" icon={Ticket} variant="info" loading={loading} />
        <StatCard title="Active Offers" value={stats.active} helperText="Approved and not expired" icon={CalendarClock} variant="success" loading={loading} />
        <StatCard title="Expired Offers" value={stats.expired} helperText="Reached vendor end date" icon={CircleAlert} variant="danger" loading={loading} />
        <StatCard title="Pending Review" value={stats.pending} helperText="Waiting for admin decision" icon={Ticket} variant="warning" loading={loading} />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setFilter(option.key)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${filter === option.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>

          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by offer, vendor, email or business"
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-700 outline-none ring-0 placeholder:text-gray-400 focus:border-blue-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Offer</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Approved</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-500">Loading offers...</td>
                </tr>
              ) : filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-500">No offers match this view.</td>
                </tr>
              ) : (
                filteredOffers.map((offer) => (
                  <tr key={offer._id} className="align-top hover:bg-gray-50">
                    <td className="px-4 py-4 text-gray-900">
                      <div className="font-medium">
                        {offer.vendor?._id ? (
                          <Link href={`/admin/vendors/${offer.vendor._id}`} className="hover:text-blue-600 hover:underline">
                            {offer.vendor?.name || "-"}
                          </Link>
                        ) : (
                          offer.vendor?.name || "-"
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{offer.vendor?.vendorInfo?.businessName || "No business name"}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{offer.vendor?.email || "-"}</td>
                    <td className="px-4 py-4">
                      <button onClick={() => setSelectedOffer(offer)} className="text-left">
                        <div className="font-medium text-gray-900 hover:text-blue-600">{offer.title}</div>
                        <div className="mt-1 max-w-xs truncate text-xs text-gray-500">{offer.description}</div>
                      </button>
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      <div className="font-medium uppercase text-gray-800">{offer.offerType}</div>
                      <div className="text-xs text-gray-500">{offer.offerType === "bogo" ? "BOGO" : `${offer.discountValue}${offer.offerType === "percentage" ? "%" : " off"}`}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${lifecycleStyles[offer.lifecycle]}`}>
                        {offer.lifecycle}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{formatDate(offer.createdAt)}</td>
                    <td className="px-4 py-4 text-gray-600">{formatDate(offer.validUntil)}</td>
                    <td className="px-4 py-4 text-gray-600">{formatDate(offer.approvedAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setSelectedOffer(offer)} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">View</button>
                        {offer.lifecycle === "PENDING" ? (
                          <>
                            <button onClick={() => void approve(offer._id)} disabled={activeId === offer._id} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
                              {activeId === offer._id ? "..." : "Approve"}
                            </button>
                            <button onClick={() => void reject(offer._id)} disabled={activeId === offer._id} className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-60">
                              Reject
                            </button>
                          </>
                        ) : null}
                        <button onClick={() => void deleteOffer(offer._id)} disabled={activeId === offer._id} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOffer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Offer Details</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">{selectedOffer.title}</h2>
              </div>
              <button onClick={() => setSelectedOffer(null)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">Close</button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                <img src={selectedOffer.imageUrl} alt={selectedOffer.title} className="h-72 w-full rounded-2xl object-cover" />

                <div className="rounded-2xl bg-gray-50 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Description</h3>
                  <p className="mt-3 text-sm leading-6 text-gray-700">{selectedOffer.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Vendor</h3>
                  <div className="mt-3 space-y-2 text-sm text-gray-700">
                    <p>
                      <span className="font-medium text-gray-900">Name:</span>{" "}
                      {selectedOffer.vendor?._id ? (
                        <Link href={`/admin/vendors/${selectedOffer.vendor._id}`} className="text-blue-600 hover:underline">
                          {selectedOffer.vendor?.name || "-"}
                        </Link>
                      ) : (
                        selectedOffer.vendor?.name || "-"
                      )}
                    </p>
                    <p><span className="font-medium text-gray-900">Email:</span> {selectedOffer.vendor?.email || "-"}</p>
                    <p><span className="font-medium text-gray-900">Business:</span> {selectedOffer.vendor?.vendorInfo?.businessName || "-"}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Offer Meta</h3>
                  <div className="mt-3 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
                    <p><span className="font-medium text-gray-900">Type:</span> {selectedOffer.offerType}</p>
                    <p><span className="font-medium text-gray-900">Discount:</span> {selectedOffer.offerType === "bogo" ? "BOGO" : `${selectedOffer.discountValue}${selectedOffer.offerType === "percentage" ? "%" : " off"}`}</p>
                    <p><span className="font-medium text-gray-900">Location:</span> {selectedOffer.location || "-"}</p>
                    <p><span className="font-medium text-gray-900">Redeem Limit:</span> {selectedOffer.redemptionLimit || "-"}</p>
                    <p><span className="font-medium text-gray-900">Created:</span> {formatDate(selectedOffer.createdAt)}</p>
                    <p><span className="font-medium text-gray-900">Approved:</span> {formatDate(selectedOffer.approvedAt)}</p>
                    <p><span className="font-medium text-gray-900">Expires:</span> {formatDate(selectedOffer.validUntil)}</p>
                    <p><span className="font-medium text-gray-900">Active Days:</span> {formatDays(selectedOffer.activeDays)}</p>
                  </div>
                </div>

                {selectedOffer.reviewNote ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                    <span className="font-semibold">Review note:</span> {selectedOffer.reviewNote}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
