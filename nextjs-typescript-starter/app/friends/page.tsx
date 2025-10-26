"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SideNavShell from "app/components/SideNavShell";
import type { Share } from "app/sharesStore";
import type { Trip } from "app/components/TripCarousel";

export default function FriendsPage() {
  // Registry for demo: friend ids and names used across the app
  const FRIENDS = useMemo(() => (
    [
      { id: "f1", name: "Alex" },
      { id: "f2", name: "Sam" },
      { id: "f3", name: "Riley" },
    ]
  ), []);

  // Load real trips so links resolve correctly
  const [trips, setTrips] = useState<Trip[]>([]);
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch('/api/trips', { cache: 'no-store' });
        const data = await res.json();
        if (!abort) setTrips(Array.isArray(data.trips) ? data.trips : []);
      } catch {
        if (!abort) setTrips([]);
      }
    })();
    return () => { abort = true; };
  }, []);

  const tripTitle = (id: string) => trips.find(t => t.id === id)?.name ?? `Trip ${id}`;

  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let abort = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/shares', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!abort) setShares(Array.isArray(data.shares) ? data.shares : []);
      } finally {
        if (!abort) setLoading(false);
      }
    }
    load();
    return () => { abort = true; };
  }, []);

  return (
    <SideNavShell>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Friends</h1>
            <p className="text-stone-400 text-sm md:text-base mt-1">Trips shared with each friend</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FRIENDS.map((f) => {
            const fShares = shares.filter(s => s.friendId === f.id);
            // Deduplicate and keep only trip ids that exist
            const uniqueTripIds = Array.from(new Set(
              fShares.map(s => s.tripId).filter(tid => trips.some(t => t.id === tid))
            ));
            return (
              <section key={f.id} className="rounded-lg border border-stone-800 bg-stone-900/60 p-4">
                <h2 className="text-base font-semibold text-white">{f.name}</h2>
                <ul className="mt-3 space-y-1">
                  {uniqueTripIds.length > 0 ? (
                    uniqueTripIds.map((tid) => (
                      <li key={tid}>
                        <Link
                          href={`/trips/${tid}`}
                          className="block rounded px-2 py-1 text-sm text-stone-200 hover:bg-stone-800"
                        >
                          {tripTitle(tid)}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-stone-400">No shared trips yet</li>
                  )}
                </ul>
              </section>
            );
          })}
        </div>

        {loading && (
          <div className="mt-4 text-sm text-stone-400">Loading shared trips…</div>
        )}
      </div>
    </SideNavShell>
  );
}
