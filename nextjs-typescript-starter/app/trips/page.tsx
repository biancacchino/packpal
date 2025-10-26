"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TripCarousel, { type Trip } from "app/components/TripCarousel";

type ViewMode = "carousel" | "grid" | "list";

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch('/api/trips', { cache: 'no-store' });
    const data = await res.json();
    setTrips(Array.isArray(data.trips) ? data.trips : []);
  }

  useEffect(() => { void load(); }, []);

  async function createTrip() {
    const n = name.trim();
    if (!n) return;
    setLoading(true);
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: n }),
    });
    setLoading(false);
    if (res.ok) {
      setName("");
      await load();
    }
  }

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [view, setView] = useState<ViewMode>(() => {
    const q = searchParams?.get("view") as ViewMode | null;
    if (q === "carousel" || q === "grid" || q === "list") return q;
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("tripViewMode") as ViewMode | null;
      if (stored === "carousel" || stored === "grid" || stored === "list") return stored;
    }
    return "carousel";
  });

  // Persist to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("tripViewMode", view);
    }
  }, [view]);

  // Sync URL query (?view=...) without scrolling
  useEffect(() => {
    const current = searchParams?.get("view");
    if (current === view) return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("view", view);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [view, pathname, router, searchParams]);

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Your Trips</h1>
            <p className="text-stone-400 text-sm md:text-base mt-1">Browse your trips in the way you like</p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New trip name"
            className="flex-1 rounded px-3 py-2 bg-stone-800 border border-stone-700 outline-none"
          />
          <button
            onClick={createTrip}
            disabled={!name.trim() || loading}
            className="rounded bg-emerald-500 text-black font-semibold px-4 py-2 disabled:opacity-50"
          >
            Create
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-stone-400 mr-1">View:</label>
          <div className="inline-flex rounded-lg border border-stone-700 bg-stone-800 p-1">
            <button
              onClick={() => setView("carousel")}
              className={`px-3 py-1.5 rounded-md text-sm ${view === "carousel" ? "bg-stone-700 text-white" : "text-stone-300 hover:text-white"}`}
              aria-pressed={view === "carousel"}
            >
              Carousel
            </button>
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-1.5 rounded-md text-sm ${view === "grid" ? "bg-stone-700 text-white" : "text-stone-300 hover:text-white"}`}
              aria-pressed={view === "grid"}
            >
              Grid
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 rounded-md text-sm ${view === "list" ? "bg-stone-700 text-white" : "text-stone-300 hover:text-white"}`}
              aria-pressed={view === "list"}
            >
              List
            </button>
          </div>
        </div>

        {view === 'carousel' && (
          <div className="mt-2">
            <TripCarousel items={trips} />
          </div>
        )}

        {view !== 'carousel' && (
          <ul className={`mt-2 ${view === 'grid' ? 'grid gap-4 sm:grid-cols-2' : 'space-y-3'}`}>
            {trips.map((t) => (
              <li key={t.id} className={`rounded-xl border border-stone-700 bg-stone-800 ${view === 'grid' ? 'p-4' : 'p-3'}`}>
                <div className="text-lg font-semibold mb-2">{t.name}</div>
                <Link href={`/trips/${t.id}`} className="text-emerald-400 hover:underline">Open</Link>
              </li>
            ))}
            {trips.length === 0 && (
              <div className="text-stone-300">No trips yet. Create one above.</div>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
