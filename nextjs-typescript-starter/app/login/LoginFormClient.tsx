"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleButton } from "app/components/GoogleButton";

export function LoginFormClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setSuccess("Email verified successfully! Please log in.");
    }
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setLoading(false);
      if (!res || (res as any).error) {
        // NextAuth returns error in url or res.error
        // If email not verified, it might come as "Email not verified..."
        setError("Invalid email or password, or email not verified.");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setLoading(false);
      setError("An error occurred during sign in");
      console.error("Sign in error:", err);
    }
  }

  return (
    <div className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 sm:px-16">
      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
          {success}
        </div>
      )}
      <GoogleButton text="Sign in with Google" />
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-gray-50 px-2 text-gray-500">Or continue with</span>
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
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
