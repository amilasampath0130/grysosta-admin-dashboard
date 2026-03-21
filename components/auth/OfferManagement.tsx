"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Offer = {
  _id: string;
  title: string;
  description: string;
  offerType: "bogo" | "percentage" | "flat";
  discountValue: number;
  imageUrl: string;
  validUntil: string;
  createdAt: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
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

export default function OfferManagement() {
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [pendingOffers, setPendingOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const fetchOffers = async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = getAuthHeaders();
      const [activeRes, pendingRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/offers/active`, {
          headers,
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/offers/pending`, {
          headers,
        }),
      ]);

      const activeData = await activeRes.json();
      const pendingData = await pendingRes.json();

      if (!activeRes.ok) {
        throw new Error(activeData?.message || "Failed to load active offers");
      }

      if (!pendingRes.ok) {
        throw new Error(pendingData?.message || "Failed to load pending offers");
      }

      setActiveOffers(activeData.offers || []);
      setPendingOffers(pendingData.offers || []);
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
    fetchOffers();
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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to approve offer");
      }

      await fetchOffers();
    } catch (approveError) {
      setError(
        approveError instanceof Error ? approveError.message : "Failed to approve offer",
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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to reject offer");
      }

      await fetchOffers();
    } catch (rejectError) {
      setError(
        rejectError instanceof Error ? rejectError.message : "Failed to reject offer",
      );
    } finally {
      setActiveId(null);
    }
  };

  const deleteOffer = async (id: string) => {
    const confirmed = window.confirm("Delete this offer?");
    if (!confirmed) return;

    setActiveId(id);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/offers/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete offer");
      }

      await fetchOffers();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete offer",
      );
    } finally {
      setActiveId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Offers</h1>
        <p className="text-sm text-gray-600">
          Manage active and pending vendor offers.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Active Offers</h2>
          <p className="text-sm text-gray-600">
            Approved offers that have not expired.
          </p>
        </div>

        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600">
            Loading active offers...
          </div>
        ) : activeOffers.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600">
            No active offers.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {activeOffers.map((offer) => (
              <div
                key={offer._id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <img
                  src={offer.imageUrl}
                  alt={offer.title}
                  className="h-48 w-full object-cover"
                />

                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {offer.title}
                    </h3>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      APPROVED
                    </span>
                  </div>

                  <p className="text-sm text-gray-700">{offer.description}</p>

                  <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">Vendor:</span>{" "}
                      {offer.vendor?._id ? (
                        <Link
                          href={`/admin/vendors/${offer.vendor._id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {offer.vendor?.name || "-"} ({offer.vendor?.email || "-"})
                        </Link>
                      ) : (
                        `${offer.vendor?.name || "-"} (${offer.vendor?.email || "-"})`
                      )}
                    </p>
                    <p>
                      <span className="font-medium">Business:</span>{" "}
                      {offer.vendor?.vendorInfo?.businessName || "-"}
                    </p>
                    <p>
                      <span className="font-medium">Type:</span> {offer.offerType}
                    </p>
                    <p>
                      <span className="font-medium">Valid until:</span>{" "}
                      {new Date(offer.validUntil).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteOffer(offer._id)}
                      disabled={activeId === offer._id}
                      className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {activeId === offer._id ? "Processing..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pending Offers</h2>
          <p className="text-sm text-gray-600">Offers waiting for review.</p>
        </div>

        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600">
            Loading pending offers...
          </div>
        ) : pendingOffers.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600">
            No pending offers.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {pendingOffers.map((offer) => (
              <div
                key={offer._id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <img
                  src={offer.imageUrl}
                  alt={offer.title}
                  className="h-48 w-full object-cover"
                />

                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {offer.title}
                    </h3>
                    <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                      PENDING
                    </span>
                  </div>

                  <p className="text-sm text-gray-700">{offer.description}</p>

                  <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">Vendor:</span>{" "}
                      {offer.vendor?._id ? (
                        <Link
                          href={`/admin/vendors/${offer.vendor._id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {offer.vendor?.name || "-"} ({offer.vendor?.email || "-"})
                        </Link>
                      ) : (
                        `${offer.vendor?.name || "-"} (${offer.vendor?.email || "-"})`
                      )}
                    </p>
                    <p>
                      <span className="font-medium">Business:</span>{" "}
                      {offer.vendor?.vendorInfo?.businessName || "-"}
                    </p>
                    <p>
                      <span className="font-medium">Type:</span> {offer.offerType}
                    </p>
                    <p>
                      <span className="font-medium">Valid until:</span>{" "}
                      {new Date(offer.validUntil).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => approve(offer._id)}
                      disabled={activeId === offer._id}
                      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {activeId === offer._id ? "Processing..." : "Approve"}
                    </button>

                    <button
                      onClick={() => reject(offer._id)}
                      disabled={activeId === offer._id}
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reject
                    </button>

                    <button
                      onClick={() => deleteOffer(offer._id)}
                      disabled={activeId === offer._id}
                      className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
