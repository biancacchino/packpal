"use client";

import SideNavShell from "app/components/SideNavShell";

export default function TripsListPage() {
  // Placeholder list of trips for now
  const sampleTrips = [
    { id: "sample-1", name: "Weekend in Santa Cruz", dates: "Oct 18–20" },
    { id: "sample-2", name: "NYC Work Trip", dates: "Nov 4–8" },
  ];
  return (
    <SideNavShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">Your Trips</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          {sampleTrips.map((t) => (
            <a
              key={t.id}
              href={`/trips/${t.id}`}
              className="block rounded-xl border border-stone-700 bg-stone-800 p-4 hover:bg-stone-700"
            >
              <div className="text-lg font-semibold">{t.name}</div>
              <div className="text-stone-300">{t.dates}</div>
            </a>
          ))}
          <a
            href="/trips/new"
            className="block rounded-xl border border-emerald-600 bg-emerald-500/10 p-4 hover:bg-emerald-500/20"
          >
            <div className="text-lg font-semibold text-emerald-400">+ Create a new trip</div>
            <div className="text-stone-300">Start fresh with destination and dates</div>
          </a>
        </div>
      </div>
    </SideNavShell>
  );
}
