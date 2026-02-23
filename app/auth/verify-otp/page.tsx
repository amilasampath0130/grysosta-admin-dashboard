"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function VerifyOtpInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

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
    if (!email || resendLoading || cooldownSeconds > 0) return;

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
        setCooldownSeconds(60);
        return;
      }

      if (res.status === 429) {
        const secondsLeft = Math.max(1, Math.ceil((Number(data.msLeft) || 0) / 1000));
        setCooldownSeconds(secondsLeft);
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
          disabled={resendLoading || cooldownSeconds > 0}
          className="mt-3 border border-blue-500 text-blue-600 w-full py-2 rounded font-semibold disabled:opacity-60"
        >
          {resendLoading
            ? "Resending..."
            : cooldownSeconds > 0
              ? `Resend OTP in ${cooldownSeconds}s`
              : "Resend OTP"}
        </button>

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
