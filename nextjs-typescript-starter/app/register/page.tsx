"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';

export default function RegisterPage() {
  const { status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (status === 'authenticated') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 shadow-xl bg-white">
          <div className="p-6 sm:p-8 space-y-4">
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 text-sm">
              You’re already signed in.
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard" className="inline-flex items-center rounded bg-black px-4 py-2 text-white hover:opacity-95">Go to dashboard</Link>
              <button type="button" onClick={() => signOut({ callbackUrl: '/register' })} className="inline-flex items-center rounded border border-stone-300 px-4 py-2 hover:bg-stone-50">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Try JSON body first
      let res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) {
        // Fallback: try form-encoded in case API expects it
        const form = new URLSearchParams({ email: email.trim(), password });
        res = await fetch('/api/register', { method: 'POST', body: form as any });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        setError(data?.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Auto-login then redirect
      const login = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: true,
        callbackUrl: '/dashboard',
      });

      if ((login as any)?.error) {
        // If auto-login fails, direct user to login page
        setError('Account created, please sign in.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Register error', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 bg-white px-4 py-6 pt-8 text-center sm:px-16">
          <h3 className="text-xl font-semibold">Sign Up</h3>
          <p className="text-sm text-gray-500">Create an account with your email and password</p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col space-y-4 bg-white px-4 py-6 sm:px-16">
          <div>
            <label htmlFor="email" className="block text-xs text-gray-600 uppercase">Email Address</label>
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
            <label htmlFor="password" className="block text-xs text-gray-600 uppercase">Password</label>
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
            {loading ? 'Creating account…' : 'Create account'}
          </button>
          <p className="text-center text-sm text-gray-600">
            {'Already have an account? '}
            <Link href="/login" className="font-semibold text-gray-800">Sign in</Link>
            {' instead.'}
          </p>
        </form>
      </div>
    </div>
  );
}
