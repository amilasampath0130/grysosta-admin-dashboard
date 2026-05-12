"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Coins, RefreshCw, Users } from "lucide-react";
import StatCard from "@/components/UI/StatCard";

type CoinItem = {
  id: string;
  name: string;
  code: string;
  description: string;
  imageUrl: string;
  progressTarget: number;
  isActive: boolean;
  vendorCount: number;
  totalStock: number;
  createdAt: string;
  updatedAt: string;
};

type BalanceItem = {
  id: string;
  balance: number;
  lifetimeEarned: number;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  coinType: {
    id: string;
    name: string;
    code: string;
    imageUrl: string;
  };
};

type CoinsResponse = {
  success?: boolean;
  message?: string;
  coins?: CoinItem[];
};

type BalancesResponse = {
  success?: boolean;
  message?: string;
  balances?: BalanceItem[];
};

type FormState = {
  name: string;
  code: string;
  description: string;
  progressTarget: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "",
  code: "",
  description: "",
  progressTarget: "1000",
  isActive: true,
};

const getAuthHeaders = () => {
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
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

export default function AdminCoinsPage() {
  const [coins, setCoins] = useState<CoinItem[]>([]);
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = getAuthHeaders();
      const [coinsRes, balancesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/coins`, {
          headers,
          cache: "no-store",
        }),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/coins/user-balances`,
          {
            headers,
            cache: "no-store",
          },
        ),
      ]);

      const [coinsData, balancesData] = (await Promise.all([
        coinsRes.json(),
        balancesRes.json(),
      ])) as [CoinsResponse, BalancesResponse];

      if (!coinsRes.ok || !coinsData.success) {
        throw new Error(coinsData.message || "Failed to load coins");
      }

      if (!balancesRes.ok || !balancesData.success) {
        throw new Error(balancesData.message || "Failed to load balances");
      }

      setCoins(coinsData.coins || []);
      setBalances(balancesData.balances || []);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load data",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAll();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setImageFile(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("name", form.name.trim());
      body.append("code", form.code.trim().toUpperCase());
      body.append("description", form.description.trim());
      body.append("progressTarget", form.progressTarget.trim() || "1000");
      body.append("isActive", String(form.isActive));
      if (imageFile) {
        body.append("image", imageFile);
      }

      const response = await fetch(
        editingId
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/coins/${editingId}`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/coins`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: getAuthHeaders(),
          body,
        },
      );

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
      };
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save coin");
      }

      resetForm();
      await fetchAll();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save coin",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (coin: CoinItem) => {
    setEditingId(coin.id);
    setForm({
      name: coin.name,
      code: coin.code,
      description: coin.description,
      progressTarget: String(coin.progressTarget),
      isActive: coin.isActive,
    });
    setImageFile(null);
  };

  const handleToggle = async (coin: CoinItem) => {
    try {
      const body = new FormData();
      body.append("isActive", String(!coin.isActive));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/coins/${coin.id}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body,
        },
      );

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
      };
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update coin status");
      }

      await fetchAll();
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Failed to update coin status",
      );
    }
  };

  const handleDelete = async (coinId: string) => {
    const confirmed = window.confirm("Delete this coin type?");
    if (!confirmed) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/coins/${coinId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
      };
      if (!response.ok && data.message) {
        setError(data.message);
      }

      await fetchAll();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete coin",
      );
    }
  };

  const stats = useMemo(() => {
    const activeCoins = coins.filter((coin) => coin.isActive).length;
    const totalStock = coins.reduce((sum, coin) => sum + coin.totalStock, 0);
    return { activeCoins, totalStock };
  }, [coins]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coin Management</h1>
          <p className="text-sm text-gray-600">
            Create coin types, stop or remove them, and review which users hold
            each coin.
          </p>
        </div>

        <button
          onClick={() => void fetchAll()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Coin Types"
          value={coins.length}
          helperText="All configured coins"
          icon={Coins}
          variant="info"
          loading={loading}
        />
        <StatCard
          title="Active Coins"
          value={stats.activeCoins}
          helperText="Available for vendor stocking"
          icon={Coins}
          variant="success"
          loading={loading}
        />
        <StatCard
          title="User Balances"
          value={balances.length}
          helperText="User and coin combinations"
          icon={Users}
          variant="warning"
          loading={loading}
        />
        <StatCard
          title="Total Stock"
          value={stats.totalStock}
          helperText="Vendor-managed reward supply"
          icon={Coins}
          variant="danger"
          loading={loading}
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Existing Coins
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {coins.length === 0 && !loading ? (
              <div className="px-5 py-8 text-sm text-gray-500">
                No coins configured yet.
              </div>
            ) : null}
            {coins.map((coin) => (
              <div
                key={coin.id}
                className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex items-center gap-4">
                  <Image
                    src={coin.imageUrl}
                    alt={coin.name}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-xl object-cover"
                    unoptimized
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {coin.name}
                      </h3>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                        {coin.code}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${coin.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}
                      >
                        {coin.isActive ? "Active" : "Stopped"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {coin.description || "No description provided."}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Progress target: {coin.progressTarget} • Vendors:{" "}
                      {coin.vendorCount} • Stock: {coin.totalStock}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Updated {formatDate(coin.updatedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleEdit(coin)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => void handleToggle(coin)}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
                  >
                    {coin.isActive ? "Stop" : "Activate"}
                  </button>
                  <button
                    onClick={() => void handleDelete(coin.id)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Coin" : "Add Coin"}
            </h2>
            <p className="text-sm text-gray-600">
              Admins can add a coin image, description, and its progress
              threshold.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm text-gray-700">
              <span>Name</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                required
              />
            </label>
            <label className="space-y-1 text-sm text-gray-700">
              <span>Code</span>
              <input
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    code: event.target.value.toUpperCase(),
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                required
              />
            </label>
          </div>

          <label className="block space-y-1 text-sm text-gray-700">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="min-h-24 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm text-gray-700">
              <span>Progress Target</span>
              <input
                type="number"
                min="1"
                value={form.progressTarget}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    progressTarget: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                required
              />
            </label>
            <label className="space-y-1 text-sm text-gray-700">
              <span>Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setImageFile(event.target.files?.[0] || null)
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
                required={!editingId}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
            />
            Active and available for vendor stocking
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Update Coin" : "Create Coin"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            User Coin Balances
          </h2>
          <p className="text-sm text-gray-600">
            Each user balance is split by coin type.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Coin</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Lifetime</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {balances.length === 0 && !loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    No user coin balances yet.
                  </td>
                </tr>
              ) : null}
              {balances.map((item) => (
                <tr key={item.id} className="align-top hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">
                      {item.user.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.user.email}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-700">
                    <div className="flex items-center gap-3">
                      <Image
                        src={item.coinType.imageUrl}
                        alt={item.coinType.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-lg object-cover"
                        unoptimized
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.coinType.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.coinType.code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold text-gray-900">
                    {item.balance}
                  </td>
                  <td className="px-4 py-4 text-gray-700">
                    {item.lifetimeEarned}
                  </td>
                  <td className="px-4 py-4 text-gray-500">
                    {formatDate(item.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
