"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type VendorApplication = {
  personal?: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    email?: string;
    phoneNumber?: string;
  };
  business?: {
    businessName?: string;
    businessType?: string;
    businessCategory?: string;
    businessAddress?: string;
    businessPhoneNumber?: string;
    typeofoffering?: string;
    website?: string;
    yearEstablished?: string;
    taxId?: string;
  };
  documents?: {
    userIdImageUrl?: string;
    businessRegImageUrl?: string;
    logoUrl?: string;
  };
  submittedAt?: string;
};

type Vendor = {
  _id: string;
  name: string;
  username?: string;
  email: string;
  role: string;
  vendorStatus?: string;
  vendorRejectionReason?: string;
  vendorInfo?: {
    businessName?: string;
    ownerName?: string;
    phone?: string;
    address?: string;
  };
  vendorApplication?: VendorApplication;
  createdAt?: string;
};

type Advertisement = {
  _id: string;
  title: string;
  content: string;
  advertisementType: "banner" | "sidebar" | "popup";
  startDate: string;
  endDate: string;
  imageUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "STOPPED";
  reviewNote?: string;
  stopNote?: string;
  createdAt: string;
};

const getAuthHeaders = (): Headers => {
  const headers = new Headers();
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
};

const Row = ({ label, value }: { label: string; value?: string }) => (
  <div className="grid grid-cols-3 gap-3 py-2 border-b last:border-b-0">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="col-span-2 text-sm text-gray-900 wrap-break-word">
      {value?.trim() ? value : "—"}
    </div>
  </div>
);

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
};

const statusClassMap: Record<Advertisement["status"], string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  STOPPED: "bg-gray-100 text-gray-700",
};

export default function VendorApplicationDetails() {
  const router = useRouter();
  const params = useParams<{ vendorId: string }>();
  const vendorId = params?.vendorId;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyAdId, setBusyAdId] = useState<string | null>(null);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);

  useEffect(() => {
    const run = async () => {
      if (!vendorId) return;
      setLoading(true);
      setError(null);

      try {
        const headers = getAuthHeaders();
        const [vendorRes, adsRes] = await Promise.all([
          fetch(
            `${apiBase}/api/vendor/application/${encodeURIComponent(vendorId)}`,
            { headers },
          ),
          fetch(
            `${apiBase}/api/advertisements/by-vendor/${encodeURIComponent(vendorId)}`,
            { headers },
          ),
        ]);

        const [vendorData, adsData] = await Promise.all([
          vendorRes.json(),
          adsRes.json(),
        ]);

        if (!vendorRes.ok || !vendorData.success) {
          throw new Error(
            vendorData.message || "Failed to load vendor application",
          );
        }

        if (!adsRes.ok || !adsData.success) {
          throw new Error(
            adsData.message || "Failed to load vendor advertisements",
          );
        }

        setVendor(vendorData.vendor as Vendor);
        setAds((adsData.advertisements || []) as Advertisement[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load vendor application");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [apiBase, vendorId]);

  const refreshAds = async () => {
    if (!vendorId) return;
    try {
      const res = await fetch(
        `${apiBase}/api/advertisements/by-vendor/${encodeURIComponent(vendorId)}`,
        { headers: getAuthHeaders() },
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load vendor advertisements");
      }
      setAds((data.advertisements || []) as Advertisement[]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load vendor advertisements",
      );
    }
  };

  const deleteAd = async (advertisementId: string) => {
    if (!confirm("Delete this advertisement permanently?")) return;
    setBusyAdId(advertisementId);
    setError(null);
    try {
      const res = await fetch(
        `${apiBase}/api/advertisements/${encodeURIComponent(advertisementId)}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete advertisement");
      }
      await refreshAds();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to delete advertisement",
      );
    } finally {
      setBusyAdId(null);
    }
  };

  const stopAd = async (advertisementId: string) => {
    const reason =
      window.prompt("Reason for stopping this advertisement? (optional)")?.trim() ||
      "";

    setBusyAdId(advertisementId);
    setError(null);

    try {
      const headers = getAuthHeaders();
      headers.set("Content-Type", "application/json");

      const res = await fetch(
        `${apiBase}/api/advertisements/stop/${encodeURIComponent(advertisementId)}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ reason }),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to stop advertisement");
      }
      await refreshAds();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to stop advertisement");
    } finally {
      setBusyAdId(null);
    }
  };

  const informVendor = async (advertisementId: string) => {
    const message =
      window.prompt("Message to vendor about this advertisement")?.trim() || "";
    if (!message) return;

    setBusyAdId(advertisementId);
    setError(null);

    try {
      const headers = getAuthHeaders();
      headers.set("Content-Type", "application/json");

      const res = await fetch(
        `${apiBase}/api/advertisements/inform/${encodeURIComponent(advertisementId)}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ message }),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to inform vendor");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to inform vendor");
    } finally {
      setBusyAdId(null);
    }
  };

  const application = vendor?.vendorApplication;
  const personal = application?.personal;
  const business = application?.business;
  const docs = application?.documents;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vendor Application</h1>
          <p className="text-sm text-gray-600">
            {vendor ? `${vendor.email} • ${vendor.vendorStatus || "—"}` : ""}
          </p>
        </div>

        <button
          onClick={() => router.push("/admin/vendors")}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
        >
          Back
        </button>
      </div>

      {loading && <div className="text-gray-500">Loading...</div>}
      {error && <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>}

      {!loading && !error && vendor && (
        <div className="grid gap-6">
          <div className="bg-white border rounded-xl p-5">
            <h2 className="font-semibold text-lg mb-3">Account</h2>
            <Row label="Name" value={vendor.name} />
            <Row label="Username" value={vendor.username} />
            <Row label="Email" value={vendor.email} />
            <Row label="Status" value={vendor.vendorStatus} />
            <Row label="Rejection Reason" value={vendor.vendorRejectionReason} />
          </div>

          <div className="bg-white border rounded-xl p-5">
            <h2 className="font-semibold text-lg mb-3">Personal Details</h2>
            <Row label="First Name" value={personal?.firstName} />
            <Row label="Middle Name" value={personal?.middleName} />
            <Row label="Last Name" value={personal?.lastName} />
            <Row label="Email" value={personal?.email} />
            <Row label="Phone" value={personal?.phoneNumber} />
            <Row label="Address" value={personal?.address} />
            <Row label="City" value={personal?.city} />
            <Row label="State" value={personal?.state} />
            <Row label="ZIP Code" value={personal?.zipCode} />
          </div>

          <div className="bg-white border rounded-xl p-5">
            <h2 className="font-semibold text-lg mb-3">Business Details</h2>
            <Row label="Business Name" value={business?.businessName} />
            <Row label="Business Type" value={business?.businessType} />
            <Row label="Category" value={business?.businessCategory} />
            <Row label="Business Address" value={business?.businessAddress} />
            <Row label="Business Phone" value={business?.businessPhoneNumber} />
            <Row label="Offering" value={business?.typeofoffering} />
            <Row label="Website" value={business?.website} />
            <Row label="Year Established" value={business?.yearEstablished} />
            <Row label="Tax ID" value={business?.taxId} />
          </div>

          <div className="bg-white border rounded-xl p-5">
            <h2 className="font-semibold text-lg mb-3">Documents</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-2">Government ID</div>
                {docs?.userIdImageUrl ? (
                  <a href={docs.userIdImageUrl} target="_blank" rel="noreferrer">
                    <img
                      src={docs.userIdImageUrl}
                      alt="Vendor ID"
                      className="w-full h-64 rounded border object-cover"
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <div className="text-gray-500">—</div>
                )}
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-2">Business Registration</div>
                {docs?.businessRegImageUrl ? (
                  <a
                    href={docs.businessRegImageUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={docs.businessRegImageUrl}
                      alt="Business registration"
                      className="w-full h-64 rounded border object-cover"
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <div className="text-gray-500">—</div>
                )}
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-2">Vendor Logo (1080×1080)</div>
                {docs?.logoUrl ? (
                  <a href={docs.logoUrl} target="_blank" rel="noreferrer">
                    <img
                      src={docs.logoUrl}
                      alt="Vendor logo"
                      className="w-full h-64 rounded border object-cover"
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <div className="text-gray-500">—</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="font-semibold text-lg">Advertisements</h2>
                <p className="text-sm text-gray-600">
                  All advertisements submitted by this vendor.
                </p>
              </div>
            </div>

            {ads.length === 0 ? (
              <div className="text-sm text-gray-600">
                No advertisements submitted.
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
                      className="h-44 w-full object-cover"
                      loading="lazy"
                    />

                    <div className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {ad.title}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassMap[ad.status]}`}
                        >
                          {ad.status}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700">{ad.content}</p>

                      <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 space-y-1">
                        <p>
                          <span className="font-medium">Type:</span>{" "}
                          {ad.advertisementType}
                        </p>
                        <p>
                          <span className="font-medium">Schedule:</span>{" "}
                          {formatDate(ad.startDate)} — {formatDate(ad.endDate)}
                        </p>
                        <p>
                          <span className="font-medium">Submitted:</span>{" "}
                          {formatDate(ad.createdAt)}
                        </p>
                        {ad.status === "REJECTED" && ad.reviewNote && (
                          <p className="text-red-700">
                            <span className="font-medium">Rejection:</span>{" "}
                            {ad.reviewNote}
                          </p>
                        )}
                        {ad.status === "STOPPED" && ad.stopNote && (
                          <p>
                            <span className="font-medium">Stopped:</span>{" "}
                            {ad.stopNote}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => informVendor(ad._id)}
                          disabled={busyAdId === ad._id}
                          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Inform
                        </button>

                        <button
                          type="button"
                          onClick={() => stopAd(ad._id)}
                          disabled={busyAdId === ad._id || ad.status === "STOPPED"}
                          className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Stop
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteAd(ad._id)}
                          disabled={busyAdId === ad._id}
                          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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
      )}
    </div>
  );
}
