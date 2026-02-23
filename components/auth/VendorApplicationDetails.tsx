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

export default function VendorApplicationDetails() {
  const router = useRouter();
  const params = useParams<{ vendorId: string }>();
  const vendorId = params?.vendorId;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);

  useEffect(() => {
    const run = async () => {
      if (!vendorId) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${apiBase}/api/vendor/application/${encodeURIComponent(vendorId)}`,
          { headers: getAuthHeaders() },
        );
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load vendor application");
        }

        setVendor(data.vendor as Vendor);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load vendor application");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [apiBase, vendorId]);

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
