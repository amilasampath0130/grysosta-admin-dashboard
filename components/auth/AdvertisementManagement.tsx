"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PendingAdvertisement = {
  _id: string;
  title: string;
  content: string;
  advertisementType: "banner" | "sidebar" | "popup";
  imageUrl: string;
  createdAt: string;
  vendor?: {
    _id?: string;
    name?: string;
    email?: string;
    vendorInfo?: {
      businessName?: string;
    };
  };
};

const getAuthHeaders = (): Headers => {
  const headers = new Headers();
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
};

export default function AdvertisementManagement() {
  const [ads, setAds] = useState<PendingAdvertisement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const fetchPendingAds = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/advertisements/pending`,
        {
          headers: getAuthHeaders(),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load pending ads");
      }

      setAds(data.advertisements || []);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load pending ads",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAds();
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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to approve advertisement");
      }

      await fetchPendingAds();
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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to reject advertisement");
      }

      await fetchPendingAds();
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

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Advertisements</h1>
        <p className="text-sm text-gray-600">
          Review pending vendor advertisements.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600">
          Loading pending advertisements...
        </div>
      ) : ads.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600">
          No pending advertisements.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {ads.map((ad) => (
            <div
              key={ad._id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="h-48 w-full object-cover"
              />

              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {ad.title}
                  </h2>
                  <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                    PENDING
                  </span>
                </div>

                <p className="text-sm text-gray-700">{ad.content}</p>

                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Vendor:</span>{" "}
                    {ad.vendor?._id ? (
                      <Link
                        href={`/admin/vendors/${ad.vendor._id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {ad.vendor?.name || "-"} ({ad.vendor?.email || "-"})
                      </Link>
                    ) : (
                      `${ad.vendor?.name || "-"} (${ad.vendor?.email || "-"})`
                    )}
                  </p>
                  <p>
                    <span className="font-medium">Business:</span>{" "}
                    {ad.vendor?.vendorInfo?.businessName || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Type:</span>{" "}
                    {ad.advertisementType}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => approveAd(ad._id)}
                    disabled={activeId === ad._id}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {activeId === ad._id ? "Processing..." : "Approve"}
                  </button>

                  <button
                    onClick={() => rejectAd(ad._id)}
                    disabled={activeId === ad._id}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
