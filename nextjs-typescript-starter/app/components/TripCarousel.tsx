"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export type Trip = { id: string; name: string };

// Accept optional items to render; if not provided, fallback to fetching trips
export default function TripCarousel({ items }: { items?: Trip[] }) {
  const [index, setIndex] = useState(0);
  const [fetched, setFetched] = useState<Trip[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (items && items.length > 0) return; // skip fetch when items are provided
    (async () => {
      try {
        const res = await fetch('/api/trips', { cache: 'no-store' });
        const data = await res.json();
        setFetched(Array.isArray(data.trips) ? data.trips : []);
      } catch {}
    })();
  }, [items]);

  const visible = useMemo(() => (items && items.length ? items : fetched), [items, fetched]);
  const count = Math.max(visible.length, 1);

  function prev() { setIndex((i) => (i - 1 + count) % count); }
  function next() { setIndex((i) => (i + 1) % count); }

  if (visible.length === 0) {
    return <div className="text-stone-300">No trips yet. Create one to see it here.</div>;
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-4">
        <button
          onClick={prev}
          className="p-3 md:p-4 bg-stone-800 rounded-lg hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-600"
          aria-label="Previous trip"
        >
          ◀
        </button>
        <div className="flex-1 overflow-hidden">
          <div
            className="flex gap-6 transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {visible.map((t) => (
              <article key={t.id} className="min-w-full bg-stone-800 rounded-xl p-6 md:p-8">
                <h4 className="text-xl md:text-2xl font-semibold text-white">{t.name}</h4>
                <div className="mt-5">
                  <Link
                    href={`/trips/${t.id}`}
                    className="inline-flex items-center px-4 py-2 rounded-md bg-emerald-500 text-black font-semibold hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    aria-label={`Open ${t.name}`}
                  >
                    Open
                  </Link>
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete \"${t.name}\"? This cannot be undone.`)) return;
                      setDeletingId(t.id);
                      try {
                        const res = await fetch(`/api/trips/${t.id}`, { method: 'DELETE' });
                        if (res.ok || res.status === 204) {
                          // refresh fetched list when not using provided items
                          if (!items) {
                            const r = await fetch('/api/trips', { cache: 'no-store' });
                            const data = await r.json();
                            setFetched(Array.isArray(data.trips) ? data.trips : []);
                            setIndex(0);
                          }
                        }
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                    disabled={deletingId === t.id}
                    className="ml-3 inline-flex items-center px-4 py-2 rounded-md border border-red-500 text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                    aria-label={`Delete ${t.name}`}
                  >
                    {deletingId === t.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
        <button
          onClick={next}
          className="p-3 md:p-4 bg-stone-800 rounded-lg hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-600"
          aria-label="Next trip"
        >
          ▶
        </button>
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {visible.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2.5 h-2.5 rounded-full ${i === index ? 'bg-emerald-400' : 'bg-stone-700'}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
