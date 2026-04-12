"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type JwtPayload = {
  role?: string;
  exp?: number;
};

const parseJwtPayload = (token: string): JwtPayload | null => {
  try {
    const [, payloadPart] = token.split(".");
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
};

const buildVerifyOtpUrl = (email: string, notice?: string) => {
  const params = new URLSearchParams({ email });

  if (notice) {
    params.set("notice", notice);
  }

  return `/auth/verify-otp?${params.toString()}`;
};

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const token =
      typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      return;
    }

    const payload = parseJwtPayload(token);
    if (!payload || payload.role !== "admin") {
      localStorage.removeItem("token");
      return;
    }

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      localStorage.removeItem("token");
      return;
    }

    router.replace("/admin");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        },
      );

      let data: { success?: boolean; message?: string } | null = null;

      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (data.success) {
        router.push(buildVerifyOtpUrl(email));
        return;
      }

      if (
        response.status === 429 &&
        data?.message?.toLowerCase().includes("otp already sent")
      ) {
        router.push(buildVerifyOtpUrl(email, data.message));
        return;
      }

      setError(data?.message || "Invalid credentials");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid place-items-center h-screen">
      <div className="shadow-lg rounded-lg border-t-4 p-5 border-blue-500 w-[420px]">
        <h1 className="text-xl font-bold my-4">Admin Login</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            required
            onChange={(e) => setEmail(e.target.value)}
            className="border py-2 px-4 rounded"
          />

          <input
            type="password"
            placeholder="Password"
            required
            onChange={(e) => setPassword(e.target.value)}
            className="border py-2 px-4 rounded"
          />

          <button
            disabled={loading}
            className="bg-blue-500 text-white font-bold py-2 rounded"
          >
            {loading ? "Sending OTP..." : "Login"}
          </button>

          {error && (
            <div className="bg-blue-500 text-white text-sm py-1 px-3 rounded">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
