"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { GoogleButton } from "app/components/GoogleButton";

export function RegisterFormClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      setLoading(false);
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccess(data.message || "Account created! Please check your email to verify.");
        // Do not auto-login, wait for verification
      } else {
        if (res.status === 409) {
          setError("An account with this email already exists. Redirecting to sign in…");
          setTimeout(() => router.push("/login?exists=1"), 2000);
          return;
        }
        setError(data?.error || "Registration failed");
      }
    } catch (err) {
      setLoading(false);
      console.error("Registration error:", err);
      setError("An unexpected error occurred");
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 bg-gray-50 px-4 py-8 sm:px-16">
        <div className="text-green-600 font-medium text-center">{success}</div>
        <p className="text-sm text-gray-500 text-center">
          We've sent a verification link to <strong>{email}</strong>.
          <br />
          Please check your inbox (and spam folder) to complete your registration.
        </p>
        <button 
          onClick={() => router.push('/login')}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 sm:px-16">
      <GoogleButton text="Sign up with Google" />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-gray-50 px-2 text-gray-500">Or register with email</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs text-gray-600 uppercase">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="user@acme.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm placeholder-gray-400 focus:border-black focus:ring-black sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs text-gray-600 uppercase">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm placeholder-gray-400 focus:border-black focus:ring-black sm:text-sm"
          />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <button type="submit" className="w-full rounded bg-black px-4 py-2 text-white hover:opacity-95" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
    </div>
  );
}
