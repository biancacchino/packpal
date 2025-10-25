"use client";

import Link from "next/link";
import TripCarousel from "app/components/TripCarousel";
import FriendsPanel from "app/components/FriendsPanel";
import ListsPanel from "app/components/ListsPanel";

export default function DashboardPage() {
  // placeholder data
  const user = { name: "user" };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      <header className="border-b border-stone-800">
        {/* Full-width top bar so brand sits at true top-left of the viewport */}
        <div className="px-4 sm:px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="Packpal home">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40" />
            <span className="text-xl font-bold tracking-tight">PackPal</span>
          </Link>
        </div>
        {/* Content container below remains centered for readability */}
        <div className="max-w-5xl mx-auto px-6 pb-8 pt-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Hey, {user.name} 👋</h1>
          <p className="mt-2 text-stone-300 text-lg">Plan, and pack smarter. PackPal.</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-12">
        <section>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Trips</h2>
              <p className="text-stone-400 text-base mt-1">Create and manage your upcoming adventures</p>
            </div>
            <Link
              href="/trips/new"
              className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              aria-label="Create a new trip"
            >
              + New Trip
            </Link>
          </div>
          <div className="mt-6">
            <TripCarousel />
          </div>
        </section>

        <section className="space-y-10">
          <div>
            <h3 className="text-2xl font-bold">Friends</h3>
            <p className="text-stone-400 text-base mt-1">Invite friends and collaborate on packing lists</p>
            <div className="mt-6">
              <FriendsPanel />
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold">Your Lists</h3>
            <p className="text-stone-400 text-base mt-1">Personal packing lists and templates</p>
            <div className="mt-6">
              <ListsPanel />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
