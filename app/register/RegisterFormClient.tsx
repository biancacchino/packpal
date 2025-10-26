"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export function RegisterFormClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      setLoading(false);

      if (res.ok) {
        // Immediately sign in the user, then go to dashboard
        const login = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (!login || (login as any).error) {
          router.push("/login?registered=1");
        } else {
          router.push("/dashboard");
        }
      } else {
        if (res.status === 409) {
          setError("An account with this email already exists. Redirecting to sign in…");
          setTimeout(() => router.push("/login?exists=1"), 600);
          return;
        }
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Registration failed");
      }
    } catch (err) {
      setLoading(false);
      console.error("Registration error:", err);
      setError("An unexpected error occurred");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 sm:px-16"
    >
      <div>
        <label
          htmlFor="email"
          className="block text-xs text-gray-600 uppercase"
        >
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
        <label
          htmlFor="password"
          className="block text-xs text-gray-600 uppercase"
        >
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

      <button
        type="submit"
        className="w-full rounded bg-black px-4 py-2 text-white hover:opacity-95"
        disabled={loading}
      >
        {loading ? "Creating account..." : "Sign up"}
      </button>
    </form>
  );
}
