"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StatCard from "@/components/UI/StatCard";
import { CheckCircle2, Clock, Users, XCircle } from "lucide-react";

type DashboardStats = {
  mobileUsers: number;
  pendingVendors: number;
  approvedVendors: number;
  rejectedVendors: number;
  generatedAt?: string;
};

type DashboardStatsResponse =
  | { success: true; data: DashboardStats }
  | { success: false; message?: string };

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const formatCount = (value: number | undefined) =>
  typeof value === "number" ? numberFormatter.format(value) : "—";

const formatUpdated = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleString();
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setLoading(false);
      setError("Missing admin session. Please log in again.");
      return;
    }

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${token}`);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard-stats`,
        {
          headers,
          signal,
        },
      );

      const data = (await res.json()) as DashboardStatsResponse;

      if (!res.ok || !data.success) {
        setStats(null);
        setError(
          (data as { message?: string })?.message ||
            "Failed to load dashboard stats",
        );
        return;
      }

      setStats(data.data);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return;
      }
      setStats(null);
      setError("Failed to reach the server. Check your connection/API URL.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchStats(controller.signal);
    return () => controller.abort();
  }, [fetchStats]);

  const updatedLabel = useMemo(() => {
    if (loading) return "Updating…";
    const formatted = formatUpdated(stats?.generatedAt);
    return formatted ? `Updated: ${formatted}` : "";
  }, [loading, stats?.generatedAt]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">
            A quick overview of users and vendor approvals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{updatedLabel}</span>
          <button
            onClick={() => void fetchStats()}
            disabled={loading}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-60"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-100 text-red-700 border border-red-200 rounded-xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">{error}</div>
          <button
            onClick={() => void fetchStats()}
            className="px-3 py-2 rounded-lg bg-white border border-red-200 hover:bg-red-50 text-sm"
          >
            Try again
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Mobile Users"
          value={formatCount(stats?.mobileUsers)}
          helperText="Registered users (role: user)"
          icon={Users}
          variant="info"
          loading={loading}
        />
        <StatCard
          title="Pending Vendors"
          value={formatCount(stats?.pendingVendors)}
          helperText="Awaiting admin review"
          icon={Clock}
          variant="warning"
          loading={loading}
        />
        <StatCard
          title="Approved Vendors"
          value={formatCount(stats?.approvedVendors)}
          helperText="Can publish offers"
          icon={CheckCircle2}
          variant="success"
          loading={loading}
        />
        <StatCard
          title="Rejected Vendors"
          value={formatCount(stats?.rejectedVendors)}
          helperText="Rejected applications"
          icon={XCircle}
          variant="danger"
          loading={loading}
        />
      </div>
    </div>
  );
}
