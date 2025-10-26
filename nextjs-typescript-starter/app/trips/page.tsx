"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TripCarousel, { type TripItem } from "app/components/TripCarousel";
import TripGrid from "app/components/TripGrid";
import TripList from "app/components/TripList";

type ViewMode = "carousel" | "grid" | "list";

export default function TripsListPage() {
  // Placeholder list of trips for now (normalized shape)
  const trips: TripItem[] = useMemo(
    () => [
      { id: "1", title: "Weekend in Santa Cruz", dates: "Oct 18–20" },
      { id: "2", title: "NYC Work Trip", dates: "Nov 4–8" },
      { id: "3", title: "Banff Ski Trip", dates: "Feb 15–20" },
    ],
    []
  );

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
          <Link
            href="/trips/new"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            + New Trip
          </Link>
        </div>

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

        <div className="mt-2">
          {view === "carousel" && <TripCarousel trips={trips} />}
          {view === "grid" && <TripGrid trips={trips} />}
          {view === "list" && <TripList trips={trips} />}
        </div>
      </div>
    </div>
  );
}
