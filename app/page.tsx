import Link from 'next/link';

export default function HomePage() {
  return (
<main className="flex min-h-screen items-center justify-center bg-black px-6">
      <div className="w-full max-w-xl text-center">
        <div className="mb-8 select-none">
          <span className="inline-block text-5xl md:text-6xl font-extrabold tracking-tight text-white">
            Packpal
          </span>
          <div className="mt-3 text-stone-400">
            Your smart, collaborative packing lists. ✈️🧳
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-stone-200 transition-colors"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-stone-700 px-4 py-2.5 text-sm font-medium text-stone-200 hover:bg-stone-900 transition-colors"
          >
            Log in
          </Link>
        </div>

        <p className="mt-6 text-xs text-stone-500">
          By continuing you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
