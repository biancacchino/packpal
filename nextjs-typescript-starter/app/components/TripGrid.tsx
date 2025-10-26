"use client";

import Link from "next/link";
import type { Trip } from "./TripCarousel";

export default function TripGrid({ trips }: { trips: Trip[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {trips.map((t) => (
        <Link
          key={t.id}
          href={`/trips/${t.id}`}
          className="block rounded-xl border border-stone-700 bg-stone-800 p-4 hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-600"
          aria-label={`Open ${t.name}`}
        >
          <div className="text-lg font-semibold text-white">{t.name}</div>
        </Link>
      ))}
    </div>
  );
}
