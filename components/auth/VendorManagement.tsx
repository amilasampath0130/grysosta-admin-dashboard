"use client";

import { useEffect, useState } from "react";

interface Vendor {
  _id: string;
  name: string;
  email: string;
  vendorInfo?: {
    businessName: string;
    ownerName: string;
    phone: string;
    address: string;
  };
  createdAt: string;
}

interface Admin {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

const VendorManagement = () => {
  const [pendingVendors, setPendingVendors] = useState<Vendor[]>([]);
  const [approvedVendors, setApprovedVendors] = useState<Vendor[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "admins">(
    "pending",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = (): Record<string, string> => {
    const token =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("token")
        : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders();
      const [pendingRes, approvedRes, adminsRes] = await Promise.all([
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

      const pendingData = await pendingRes.json();
      const approvedData = await approvedRes.json();
      const adminsData = await adminsRes.json();

      if (pendingData.success) setPendingVendors(pendingData.vendors || []);
      if (approvedData.success) setApprovedVendors(approvedData.vendors || []);
      if (adminsData.success) setAdmins(adminsData.admins || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleApprove = async (vendorId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendor/approve/${vendorId}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        },
      );
      const data = await res.json();
      if (data.success) {
        alert("Vendor approved successfully!");
        fetchVendors(); // Refresh lists
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error approving vendor:", error);
      alert("Failed to approve vendor. Please try again.");
    }
  };

  const handleReject = async (vendorId: string) => {
    const reason = prompt("Reason for rejection:");
    if (!reason) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendor/reject/${vendorId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ reason }),
        },
      );
      const data = await res.json();
      if (data.success) {
        alert("Vendor rejected successfully!");
        fetchVendors(); // Refresh lists
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error rejecting vendor:", error);
      alert("Failed to reject vendor. Please try again.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">User & Vendor Management</h1>

      <div className="mb-4">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 mr-2 rounded ${activeTab === "pending" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Pending Vendors ({pendingVendors.length})
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`px-4 py-2 mr-2 rounded ${activeTab === "approved" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Approved Vendors ({approvedVendors.length})
        </button>
        <button
          onClick={() => setActiveTab("admins")}
          className={`px-4 py-2 rounded ${activeTab === "admins" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Admin Users ({admins.length})
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button
            onClick={fetchVendors}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading...</span>
        </div>
      ) : (
        <div className="grid gap-4">
          {activeTab === "pending"
            ? pendingVendors.map((vendor) => (
                <div key={vendor._id} className="border p-4 rounded shadow">
                  <h3 className="font-bold">{vendor.name}</h3>
                  <p>Email: {vendor.email}</p>
                  {vendor.vendorInfo && (
                    <div className="mt-2">
                      <p>Business: {vendor.vendorInfo.businessName}</p>
                      <p>Owner: {vendor.vendorInfo.ownerName}</p>
                      <p>Phone: {vendor.vendorInfo.phone}</p>
                      <p>Address: {vendor.vendorInfo.address}</p>
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleApprove(vendor._id)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(vendor._id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            : activeTab === "approved"
              ? approvedVendors.map((vendor) => (
                  <div key={vendor._id} className="border p-4 rounded shadow">
                    <h3 className="font-bold">{vendor.name}</h3>
                    <p>Email: {vendor.email}</p>
                    {vendor.vendorInfo && (
                      <div className="mt-2">
                        <p>Business: {vendor.vendorInfo.businessName}</p>
                        <p>Owner: {vendor.vendorInfo.ownerName}</p>
                        <p>Phone: {vendor.vendorInfo.phone}</p>
                        <p>Address: {vendor.vendorInfo.address}</p>
                      </div>
                    )}
                  </div>
                ))
              : admins.map((admin) => (
                  <div key={admin._id} className="border p-4 rounded shadow">
                    <h3 className="font-bold">{admin.name}</h3>
                    <p>Email: {admin.email}</p>
                    <p className="text-sm text-gray-600">Role: Administrator</p>
                    <p className="text-sm text-gray-600">
                      Joined: {new Date(admin.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
        </div>
      )}
    </div>
  );
};

export default VendorManagement;
