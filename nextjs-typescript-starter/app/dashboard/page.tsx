"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import TripCarousel, { type TripItem } from "app/components/TripCarousel";
import TripGrid from "app/components/TripGrid";
import TripList from "app/components/TripList";
import FriendsPanel from "app/components/FriendsPanel";
import ListsPanel from "app/components/ListsPanel";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  // placeholder data
  const user = { name: "user" };

  // sample trips for the dashboard section
  const trips: TripItem[] = useMemo(
    () => [
      { id: "1", title: "Cancún Trip 🌴", dates: "Mar 1–7" },
      { id: "2", title: "NYC Weekend 🗽", dates: "Apr 10–12" },
      { id: "3", title: "Banff Ski Trip ⛷️", dates: "Feb 15–20" },
    ],
    []
  );

  type ViewMode = "carousel" | "grid" | "list";
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("dashboardTripViewMode") as ViewMode | null;
      if (stored === "carousel" || stored === "grid" || stored === "list") return stored;
    }
    return "carousel";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("dashboardTripViewMode", view);
    }
  }, [view]);

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      <header className="border-b border-stone-800">
        {/* Full-width top bar so brand sits at true top-left of the viewport */}
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="Packpal home">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40" />
            <span className="text-xl font-bold tracking-tight">PackPal</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/ai"
              className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700"
            >
              Open Chat
            </Link>
            <button
              onClick={async () => { await signOut({ redirect: false }); router.push('/login'); }}
              className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-stone-700 hover:bg-stone-800"
            >
              Sign out
            </button>
          </div>
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
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-stone-400 mr-1">View:</label>
              <div className="inline-flex rounded-lg border border-stone-700 bg-stone-800 p-1">
                <button
                  onClick={() => setView("carousel")}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    view === "carousel" ? "bg-stone-700 text-white" : "text-stone-300 hover:text-white"
                  }`}
                  aria-pressed={view === "carousel"}
                >
                  Carousel
                </button>
                <button
                  onClick={() => setView("grid")}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    view === "grid" ? "bg-stone-700 text-white" : "text-stone-300 hover:text-white"
                  }`}
                  aria-pressed={view === "grid"}
                >
                  Grid
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    view === "list" ? "bg-stone-700 text-white" : "text-stone-300 hover:text-white"
                  }`}
                  aria-pressed={view === "list"}
                >
                  List
                </button>
              </div>
            </div>

            {view === "carousel" && <TripCarousel trips={trips} />} 
            {view === "grid" && <TripGrid trips={trips} />}
            {view === "list" && <TripList trips={trips} />}
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
