"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function VerifyOtpInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const notice = searchParams.get("notice") || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [cooldownMs, setCooldownMs] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchOtpStatus = async () => {
      if (!email) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/otp-status?email=${encodeURIComponent(email)}`,
          {
            credentials: "include",
          },
        );

        const data = await response.json();

        if (!mounted) {
          return;
        }

        if (typeof data?.msLeft === "number") {
          setCooldownMs(data.msLeft);
        }
      } catch {
        // Ignore status failures and let resend endpoint remain the source of truth.
      }
    };

    fetchOtpStatus();
    const intervalId = setInterval(fetchOtpStatus, 5000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [email]);

  useEffect(() => {
    if (cooldownMs <= 0) return;

    const timer = setInterval(() => {
      setCooldownMs((current) => Math.max(0, current - 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownMs]);

  if (!email) {
    return <p className="text-center mt-10">Invalid request</p>;
  }

  const handleVerify = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, otp }),
        },
      );

      const data = await res.json();

      if (data.success) {
        // 🔐 Store JWT
        localStorage.setItem("token", data.data.token);
        router.replace("/admin");
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email || resendLoading || cooldownMs > 0) return;

    setResendLoading(true);
    setError("");
    setResendMessage("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/resend-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email }),
        },
      );

      const data = await res.json();

      if (data.success) {
        setResendMessage(data.message || "OTP resent successfully");
        setCooldownMs(60 * 1000);
        return;
      }

      if (res.status === 429) {
        setCooldownMs(Math.max(1000, Number(data.msLeft) || 0));
      }

      setError(data.message || "Failed to resend OTP");
    } catch {
      setError("Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="grid place-items-center h-screen">
      <div className="shadow-lg rounded-lg border-t-4 p-6 border-blue-500 w-[420px]">
        <h1 className="text-2xl font-bold mb-2">Verify OTP</h1>
        <p className="text-sm text-gray-600 mb-4">
          Enter the 6-digit code sent to <b>{email}</b>
        </p>

        <input
          type="text"
          maxLength={6}
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="border w-full px-4 py-2 rounded mb-3 text-center tracking-widest text-lg"
        />

        <button
          onClick={handleVerify}
          disabled={loading || otp.length !== 6}
          className="bg-blue-500 text-white w-full py-2 rounded font-semibold"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

        <button
          onClick={handleResendOtp}
          disabled={resendLoading || cooldownMs > 0}
          className="mt-3 border border-blue-500 text-blue-600 w-full py-2 rounded font-semibold disabled:opacity-60"
        >
          {resendLoading
            ? "Resending..."
            : cooldownMs > 0
              ? `Resend OTP in ${Math.ceil(cooldownMs / 1000)}s`
              : "Resend OTP"}
        </button>

        {notice && !error && !resendMessage && (
          <p className="bg-blue-500 text-white text-sm p-2 rounded mt-3">
            {notice}
          </p>
        )}

        {error && (
          <p className="bg-red-500 text-white text-sm p-2 rounded mt-3">
            {error}
          </p>
        )}

        {resendMessage && (
          <p className="bg-green-500 text-white text-sm p-2 rounded mt-3">
            {resendMessage}
          </p>
        )}
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<p className="text-center mt-10">Loading...</p>}>
      <VerifyOtpInner />
    </Suspense>
  );
}
