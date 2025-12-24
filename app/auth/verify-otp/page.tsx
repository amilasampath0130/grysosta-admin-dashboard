"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!email) {
    return <p className="text-center mt-10">Invalid request</p>;
  }

  const handleVerify = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        "http://localhost:5000/api/admin/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp })
        }
      );

      const data = await res.json();

      if (data.success) {
        // 🔐 Store JWT
        localStorage.setItem("token", data.data.token);
        router.replace("/admin");
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setError("Server error");
    } finally {
      setLoading(false);
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

        {error && (
          <p className="bg-red-500 text-white text-sm p-2 rounded mt-3">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
