"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CircleAlert, Image as ImageIcon, Search, SquareActivity } from "lucide-react";
import StatCard from "@/components/UI/StatCard";

type AdvertisementLifecycle = "ACTIVE" | "PENDING" | "EXPIRED" | "STOPPED" | "SCHEDULED" | "REJECTED";

type Advertisement = {
  _id: string;
  title: string;
  content: string;
  advertisementType: "banner" | "sidebar" | "popup";
  imageUrl: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  approvedAt?: string;
  reviewNote?: string;
  stopNote?: string;
  paymentAmountCents?: number;
  paymentCurrency?: string;
  isPaid?: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED" | "STOPPED";
  lifecycle: AdvertisementLifecycle;
  vendor?: {
    _id?: string;
    name?: string;
    email?: string;
    vendorInfo?: {
      businessName?: string;
    };
  };
};

type AdvertisementStats = {
  total: number;
  active: number;
  expired: number;
  pending: number;
  stopped: number;
  scheduled: number;
};

type AdvertisementsResponse = {
  success?: boolean;
  message?: string;
  advertisements?: Advertisement[];
  stats?: AdvertisementStats;
};

type FilterKey = "ALL" | AdvertisementLifecycle;

const emptyStats: AdvertisementStats = {
  total: 0,
  active: 0,
  expired: 0,
  pending: 0,
  stopped: 0,
  scheduled: 0,
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

const formatMoney = (amountCents?: number, currency?: string) => {
  if (typeof amountCents !== "number") return "-";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
  }).format(amountCents / 100);
};

const lifecycleStyles: Record<AdvertisementLifecycle, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  EXPIRED: "bg-red-100 text-red-700",
  STOPPED: "bg-slate-200 text-slate-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

export default function AdvertisementManagement() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [stats, setStats] = useState<AdvertisementStats>(emptyStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [query, setQuery] = useState("");
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);

  const fetchAds = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/advertisements/admin/all`,
        {
          headers: getAuthHeaders(),
        },
      );
      const data = (await response.json()) as AdvertisementsResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load advertisements");
      }

      setAds(data.advertisements || []);
      setStats(data.stats || emptyStats);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load advertisements",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAds();
  }, []);

  const approveAd = async (id: string) => {
    setActiveId(id);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/advertisements/approve/${id}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        },
      );
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to approve advertisement");
      }

      await fetchAds();
    } catch (approveError) {
      setError(
        approveError instanceof Error
          ? approveError.message
          : "Failed to approve advertisement",
      );
    } finally {
      setActiveId(null);
    }
  };

  const rejectAd = async (id: string) => {
    const reason = window.prompt("Enter rejection reason")?.trim() || "";
    if (!reason) return;

    setActiveId(id);
    setError(null);

    try {
      const headers = getAuthHeaders();
      headers.set("Content-Type", "application/json");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/advertisements/reject/${id}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ reason }),
        },
      );
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to reject advertisement");
      }

      await fetchAds();
    } catch (rejectError) {
      setError(
        rejectError instanceof Error
          ? rejectError.message
          : "Failed to reject advertisement",
      );
    } finally {
      setActiveId(null);
    }
  };

  const stopAd = async (id: string) => {
    const reason = window.prompt("Reason for stopping? (optional)")?.trim() || "";

    setActiveId(id);
    setError(null);

    try {
      const headers = getAuthHeaders();
      headers.set("Content-Type", "application/json");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/advertisements/stop/${id}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ reason }),
        },
      );
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to stop advertisement");
      }

      await fetchAds();
    } catch (stopError) {
      setError(
        stopError instanceof Error
          ? stopError.message
          : "Failed to stop advertisement",
      );
    } finally {
      setActiveId(null);
    }
  };

  const deleteAd = async (id: string) => {
    const confirmed = window.confirm("Delete this advertisement permanently?");
    if (!confirmed) return;

    setActiveId(id);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/advertisements/${id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete advertisement");
      }

      if (selectedAd?._id === id) {
        setSelectedAd(null);
      }

      await fetchAds();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete advertisement",
      );
    } finally {
      setActiveId(null);
    }
  };

  const filteredAds = useMemo(() => {
    const term = query.trim().toLowerCase();

    return ads.filter((ad) => {
      if (filter !== "ALL" && ad.lifecycle !== filter) {
        return false;
      }

      if (!term) return true;

      const haystack = [
        ad.title,
        ad.content,
        ad.advertisementType,
        ad.vendor?.name,
        ad.vendor?.email,
        ad.vendor?.vendorInfo?.businessName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [ads, filter, query]);

  const filterOptions: Array<{ key: FilterKey; label: string; count: number }> = [
    { key: "ALL", label: "All", count: stats.total },
    { key: "ACTIVE", label: "Active", count: stats.active },
    { key: "PENDING", label: "Pending", count: stats.pending },
    { key: "EXPIRED", label: "Expired", count: stats.expired },
    { key: "SCHEDULED", label: "Scheduled", count: stats.scheduled },
    { key: "STOPPED", label: "Stopped", count: stats.stopped },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advertisement Dashboard</h1>
          <p className="text-sm text-gray-600">
            Review vendor advertisements, see campaign dates, and open each ad for full details.
          </p>
        </div>

        <button onClick={() => void fetchAds()} disabled={loading} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Advertisements" value={stats.total} helperText="All ad submissions" icon={ImageIcon} variant="info" loading={loading} />
        <StatCard title="Active Ads" value={stats.active} helperText="Currently running campaigns" icon={SquareActivity} variant="success" loading={loading} />
        <StatCard title="Expired Ads" value={stats.expired} helperText="Reached campaign end date" icon={CircleAlert} variant="danger" loading={loading} />
        <StatCard title="Pending Review" value={stats.pending} helperText="Waiting for approval" icon={ImageIcon} variant="warning" loading={loading} />
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
              placeholder="Search by ad, vendor, email or business"
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Ad Title</th>
                <th className="px-4 py-3">Placement</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-500">Loading advertisements...</td>
                </tr>
              ) : filteredAds.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-500">No advertisements match this view.</td>
                </tr>
              ) : (
                filteredAds.map((ad) => (
                  <tr key={ad._id} className="align-top hover:bg-gray-50">
                    <td className="px-4 py-4 text-gray-900">
                      <div className="font-medium">
                        {ad.vendor?._id ? (
                          <Link href={`/admin/vendors/${ad.vendor._id}`} className="hover:text-blue-600 hover:underline">
                            {ad.vendor?.name || "-"}
                          </Link>
                        ) : (
                          ad.vendor?.name || "-"
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{ad.vendor?.vendorInfo?.businessName || "No business name"}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{ad.vendor?.email || "-"}</td>
                    <td className="px-4 py-4">
                      <button onClick={() => setSelectedAd(ad)} className="text-left">
                        <div className="font-medium text-gray-900 hover:text-blue-600">{ad.title}</div>
                        <div className="mt-1 max-w-xs truncate text-xs text-gray-500">{ad.content}</div>
                      </button>
                    </td>
                    <td className="px-4 py-4 text-gray-600 uppercase">{ad.advertisementType}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${lifecycleStyles[ad.lifecycle]}`}>{ad.lifecycle}</span>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{formatDate(ad.createdAt)}</td>
                    <td className="px-4 py-4 text-gray-600">{formatDate(ad.startDate)}</td>
                    <td className="px-4 py-4 text-gray-600">{formatDate(ad.endDate)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setSelectedAd(ad)} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">View</button>
                        {ad.lifecycle === "PENDING" ? (
                          <>
                            <button onClick={() => void approveAd(ad._id)} disabled={activeId === ad._id} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
                              {activeId === ad._id ? "..." : "Approve"}
                            </button>
                            <button onClick={() => void rejectAd(ad._id)} disabled={activeId === ad._id} className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-60">Reject</button>
                          </>
                        ) : null}
                        {ad.lifecycle === "ACTIVE" || ad.lifecycle === "SCHEDULED" ? (
                          <button onClick={() => void stopAd(ad._id)} disabled={activeId === ad._id} className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-60">Stop</button>
                        ) : null}
                        <button onClick={() => void deleteAd(ad._id)} disabled={activeId === ad._id} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAd ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Advertisement Details</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">{selectedAd.title}</h2>
              </div>
              <button onClick={() => setSelectedAd(null)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">Close</button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                <img src={selectedAd.imageUrl} alt={selectedAd.title} className="h-72 w-full rounded-2xl object-cover" />

                <div className="rounded-2xl bg-gray-50 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Campaign Content</h3>
                  <p className="mt-3 text-sm leading-6 text-gray-700">{selectedAd.content}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Vendor</h3>
                  <div className="mt-3 space-y-2 text-sm text-gray-700">
                    <p>
                      <span className="font-medium text-gray-900">Name:</span>{" "}
                      {selectedAd.vendor?._id ? (
                        <Link href={`/admin/vendors/${selectedAd.vendor._id}`} className="text-blue-600 hover:underline">
                          {selectedAd.vendor?.name || "-"}
                        </Link>
                      ) : (
                        selectedAd.vendor?.name || "-"
                      )}
                    </p>
                    <p><span className="font-medium text-gray-900">Email:</span> {selectedAd.vendor?.email || "-"}</p>
                    <p><span className="font-medium text-gray-900">Business:</span> {selectedAd.vendor?.vendorInfo?.businessName || "-"}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Campaign Meta</h3>
                  <div className="mt-3 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
                    <p><span className="font-medium text-gray-900">Placement:</span> {selectedAd.advertisementType}</p>
                    <p><span className="font-medium text-gray-900">Status:</span> {selectedAd.lifecycle}</p>
                    <p><span className="font-medium text-gray-900">Created:</span> {formatDate(selectedAd.createdAt)}</p>
                    <p><span className="font-medium text-gray-900">Approved:</span> {formatDate(selectedAd.approvedAt)}</p>
                    <p><span className="font-medium text-gray-900">Start Date:</span> {formatDate(selectedAd.startDate)}</p>
                    <p><span className="font-medium text-gray-900">End Date:</span> {formatDate(selectedAd.endDate)}</p>
                    <p><span className="font-medium text-gray-900">Payment:</span> {selectedAd.isPaid ? formatMoney(selectedAd.paymentAmountCents, selectedAd.paymentCurrency) : "Not paid"}</p>
                  </div>
                </div>

                {selectedAd.reviewNote ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                    <span className="font-semibold">Review note:</span> {selectedAd.reviewNote}
                  </div>
                ) : null}

                {selectedAd.stopNote ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                    <span className="font-semibold">Stop note:</span> {selectedAd.stopNote}
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
