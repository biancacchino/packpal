"use client";

import Link from "next/link";
import type { Trip } from "./TripCarousel";

export default function TripList({ trips }: { trips: Trip[] }) {
  return (
    <ul className="divide-y divide-stone-800 rounded-xl border border-stone-800 overflow-hidden bg-stone-900">
      {trips.map((t) => (
        <li key={t.id} className="group">
          <Link
            href={`/trips/${t.id}`}
            className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-600"
            aria-label={`Open ${t.name}`}
          >
            <div>
              <div className="text-base sm:text-lg font-semibold text-white">{t.name}</div>
            </div>
            <span className="text-stone-400 group-hover:text-emerald-400">→</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
