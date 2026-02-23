"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ================= TYPES ================= */

interface Vendor {
  _id: string;
  name: string;
  email: string;
  vendorInfo?: {
    businessName?: string;
    ownerName?: string;
    phone?: string;
    address?: string;
  };
  createdAt: string;
}

interface Admin {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

type Tab = "pending" | "approved" | "admins";

/* ================= COMPONENT ================= */

export default function VendorManagement() {
  const [pending, setPending] = useState<Vendor[]>([]);
  const [approved, setApproved] = useState<Vendor[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------- Auth Headers (FIXED TS ISSUE) ---------- */
  const getAuthHeaders = (): Headers => {
    const headers = new Headers();
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  };

  /* ---------- Fetch ---------- */
  const fetchAll = async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = getAuthHeaders();

      const [p, a, ad] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vendor/pending`, {
          headers,
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vendor/approved`, {
          headers,
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/admins`, {
          headers,
        }),
      ]);

      const [pd, ap, adm] = await Promise.all([p.json(), a.json(), ad.json()]);

      setPending(pd.vendors ?? []);
      setApproved(ap.vendors ?? []);
      setAdmins(adm.admins ?? []);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  /* ---------- Actions ---------- */
  const approveVendor = async (id: string) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vendor/approve/${id}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    fetchAll();
  };

  const rejectVendor = async (id: string) => {
    const reason = prompt("Reason for rejection");
    if (!reason) return;

    const headers = getAuthHeaders();
    headers.set("Content-Type", "application/json");

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vendor/reject/${id}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ reason }),
    });
    fetchAll();
  };

  const deleteVendor = async (id: string) => {
    if (!confirm("Delete this vendor permanently?")) return;

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/vendors/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    fetchAll();
  };

  /* ---------- Helpers ---------- */
  const formatDate = (date: string) => {
    const d = new Date(date);
    return isNaN(d.getTime())
      ? "—"
      : d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  };

  /* ================= RENDER ================= */

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">User & Vendor Management</h1>

      {/* Tabs */}
      <div className="flex gap-6 border-b mb-6">
        {[
          { key: "pending", label: "Pending", count: pending.length },
          { key: "approved", label: "Approved", count: approved.length },
          { key: "admins", label: "Admins", count: admins.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as Tab)}
            className={`pb-3 font-medium border-b-2 transition ${
              activeTab === t.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* States */}
      {loading && (
        <div className="py-10 text-center text-gray-500">Loading...</div>
      )}

      {error && (
        <div className="mb-4 bg-red-100 text-red-700 p-4 rounded">{error}</div>
      )}

      {/* Content */}
      <div className="grid gap-4">
        {/* Pending */}
        {activeTab === "pending" &&
          pending.map((v) => (
            <VendorCard
              key={v._id}
              vendor={v}
              status="pending"
              onApprove={approveVendor}
              onReject={rejectVendor}
              onDelete={deleteVendor}
              formatDate={formatDate}
            />
          ))}

        {/* Approved */}
        {activeTab === "approved" &&
          approved.map((v) => (
            <VendorCard
              key={v._id}
              vendor={v}
              status="approved"
              onDelete={deleteVendor}
              formatDate={formatDate}
            />
          ))}

        {/* Admins */}
        {activeTab === "admins" &&
          admins.map((a) => (
            <div
              key={a._id}
              className="bg-white border rounded-xl p-4 shadow-sm"
            >
              <h3 className="font-semibold text-lg">{a.name}</h3>
              <p className="text-gray-600">{a.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Joined {formatDate(a.createdAt)}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ================= CARD ================= */

function VendorCard({
  vendor,
  status,
  onApprove,
  onReject,
  onDelete,
  formatDate,
}: {
  vendor: Vendor;
  status: "pending" | "approved";
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (d: string) => string;
}) {
  return (
    <div className="bg-white border rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="font-semibold text-gray-900 truncate">
              {vendor.vendorInfo?.ownerName || vendor.name}
            </div>
            <div className="text-sm text-gray-600 truncate">{vendor.email}</div>
            <div className="text-xs text-gray-500">{formatDate(vendor.createdAt)}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/vendors/${vendor._id}`}
            className="px-3 py-1 text-sm rounded bg-blue-500 text-white hover:bg-blue-600"
          >
            Review
          </Link>

          {status === "pending" && (
            <>
              <button
                onClick={() => onApprove?.(vendor._id)}
                className="px-3 py-1 text-sm rounded bg-green-500 text-white hover:bg-green-600"
              >
                Approve
              </button>
              <button
                onClick={() => onReject?.(vendor._id)}
                className="px-3 py-1 text-sm rounded bg-red-500 text-white hover:bg-red-600"
              >
                Reject
              </button>
            </>
          )}

          <button
            onClick={() => onDelete(vendor._id)}
            className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
