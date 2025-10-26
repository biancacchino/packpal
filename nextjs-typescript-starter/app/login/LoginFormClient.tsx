"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export function LoginFormClient() {
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (status === 'authenticated') {
    return (
      <div className="flex flex-col gap-3 bg-white px-4 py-6 sm:px-16">
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 text-sm">
          You’re already signed in.
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard" className="inline-flex items-center rounded bg-black px-4 py-2 text-white hover:opacity-95">Go to dashboard</Link>
          <button type="button" onClick={() => signOut({ callbackUrl: '/login' })} className="inline-flex items-center rounded border border-stone-300 px-4 py-2 hover:bg-stone-50">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: true,
        callbackUrl: "/dashboard",
      });

      setLoading(false);
      if (!res || (res as any).error) {
        setError("Invalid email or password.");
      }
    } catch (err) {
      setLoading(false);
      setError("An error occurred during sign in");
      console.error("Sign in error:", err);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 sm:px-16">
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
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
