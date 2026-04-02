"use client";

import { useEffect, useMemo, useState } from "react";

type PlanKey = "bronze" | "silver" | "gold" | "diamond";

type AdminPlan = {
  key: PlanKey;
  name: string;
  currency: string;
  priceCents: number;
  active: boolean;
  summary: string;
  features: string[];
  limits: {
    activeOfferLimit: number | null;
    advertisementLimit: number | null;
  };
};

type PlansResponse = {
  success: boolean;
  plans?: AdminPlan[];
  message?: string;
};

const formatMoney = (cents: number, currency: string) => {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency?.toUpperCase() || "USD",
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
};

export default function SettingsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<PlanKey | null>(null);

  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }, []);

  const loadPlans = async () => {
    if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");
    if (!token) throw new Error("No authentication token found");

    const res = await fetch(`${apiUrl}/api/admin/subscription-plans`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
      },
    });
    const data = (await res.json()) as PlansResponse;

    if (!res.ok || !data.success) {
      throw new Error(data?.message || "Failed to load subscription plans");
    }

    const fetched = data.plans || [];
    setPlans(fetched);
    setDraftPrices((prev) => {
      const next = { ...prev };
      for (const plan of fetched) {
        if (next[plan.key] == null) {
          next[plan.key] = String((plan.priceCents / 100).toFixed(2));
        }
      }
      return next;
    });
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        await loadPlans();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load subscription plans",
        );
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savePlan = async (key: PlanKey) => {
    if (!apiUrl) {
      setError("NEXT_PUBLIC_API_URL is not configured");
      return;
    }
    if (!token) {
      setError("No authentication token found");
      return;
    }

    const raw = String(draftPrices[key] || "").trim();
    const dollars = Number(raw);
    const priceCents = Math.round(dollars * 100);
    if (!Number.isFinite(dollars) || priceCents <= 0) {
      setError("Price must be a positive number");
      return;
    }

    setSavingKey(key);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/admin/subscription-plans/${key}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceCents }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.message || "Failed to update price");
      }

      await loadPlans();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update price");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600">
          Update monthly subscription plan prices and review plan limits.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Subscription plans
          </h2>
        </div>

        {loading ? (
          <div className="p-5 text-sm text-gray-600">Loading...</div>
        ) : plans.length === 0 ? (
          <div className="p-5 text-sm text-gray-600">No plans found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Current price</th>
                  <th className="px-5 py-3 font-medium">Limits</th>
                  <th className="px-5 py-3 font-medium">New price (USD)</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {plans.map((plan) => (
                  <tr key={plan.key}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">
                        {plan.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {plan.key.toUpperCase()} • {plan.active ? "Active" : "Inactive"}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {formatMoney(plan.priceCents, plan.currency)} / month
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-600">
                      Offers: {plan.limits.activeOfferLimit ?? "Unlimited"} · Ads: {plan.limits.advertisementLimit ?? "Unlimited"}
                    </td>
                    <td className="px-5 py-3">
                      <input
                        value={draftPrices[plan.key] ?? ""}
                        onChange={(e) =>
                          setDraftPrices((prev) => ({
                            ...prev,
                            [plan.key]: e.target.value,
                          }))
                        }
                        inputMode="decimal"
                        className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                        placeholder="e.g. 19.00"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => savePlan(plan.key)}
                        disabled={savingKey === plan.key}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {savingKey === plan.key ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
