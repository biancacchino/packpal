"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SideNavShell from "app/components/SideNavShell";
import TripCarousel, { type Trip } from "app/components/TripCarousel";

type ViewMode = "carousel" | "grid" | "list";

export default function TripsPage() {
  return (
    <SideNavShell>
      <Suspense fallback={<div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">Loading…</div>}>
        <TripsContent />
      </Suspense>
    </SideNavShell>
  );
}

function TripsContent() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialView = useMemo<ViewMode>(() => {
    if (typeof window === 'undefined') return 'carousel';
    const q = (searchParams?.get('view') as ViewMode | null) || null;
    const stored = (window.localStorage.getItem('tripViewMode') as ViewMode | null) || null;
    return q || stored || 'carousel';
  }, [searchParams]);
  const [view, setView] = useState<ViewMode>(initialView);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/trips', { cache: 'no-store' });
      const data = await res.json();
      setTrips(Array.isArray(data.trips) ? data.trips : []);
      setError(null);
    } catch {
      setTrips([]);
      setError('Failed to load trips. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('tripViewMode', view);
    }
  }, [view]);

  useEffect(() => {
    const current = searchParams?.get('view');
    if (current === view) return;
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('view', view);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [view, pathname, router, searchParams]);

  async function createTrip() {
    const n = name.trim();
    if (!n) return;
    setCreating(true);
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: n }),
    });
    setCreating(false);
    if (res.ok) {
      setName('');
      await load();
      try { window.dispatchEvent(new CustomEvent('trips:updated')); } catch {}
    }
  }

  async function deleteTrip(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/trips/${id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        await load();
        try { window.dispatchEvent(new CustomEvent('trips:updated')); } catch {}
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
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
          disabled={!name.trim() || creating}
          className="rounded bg-emerald-500 text-black font-semibold px-4 py-2 disabled:opacity-50"
        >
          Create
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-stone-400 mr-1">View:</label>
        <div className="inline-flex rounded-lg border border-stone-700 bg-stone-800 p-1">
          <button
            onClick={() => setView('carousel')}
            className={`px-3 py-1.5 rounded-md text-sm ${view === 'carousel' ? 'bg-stone-700 text-white' : 'text-stone-300 hover:text-white'}`}
            aria-pressed={view === 'carousel'}
          >
            Carousel
          </button>
          <button
            onClick={() => setView('grid')}
            className={`px-3 py-1.5 rounded-md text-sm ${view === 'grid' ? 'bg-stone-700 text-white' : 'text-stone-300 hover:text-white'}`}
            aria-pressed={view === 'grid'}
          >
            Grid
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded-md text-sm ${view === 'list' ? 'bg-stone-700 text-white' : 'text-stone-300 hover:text-white'}`}
            aria-pressed={view === 'list'}
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
          {loading && trips.length === 0 && (
            <div className="text-stone-300">Loading…</div>
          )}
          {trips.map((t) => (
            <li key={t.id} className={`rounded-xl border border-stone-700 bg-stone-800 ${view === 'grid' ? 'p-4' : 'p-3'}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold mb-2">{t.name}</div>
                  <Link
                    href={`/trips/${t.id}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-md bg-emerald-500 text-black font-semibold hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    aria-label={`Open ${t.name}`}
                  >
                    Open
                  </Link>
                </div>
                <button
                  onClick={() => void deleteTrip(t.id, t.name)}
                  disabled={deletingId === t.id}
                  className="inline-flex items-center px-3 py-1.5 rounded-md border border-red-500 text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                  aria-label={`Delete ${t.name}`}
                >
                  {deletingId === t.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </li>
          ))}
          {!loading && trips.length === 0 && (
            <div className="text-stone-300">No trips yet. Create one above.</div>
          )}
        </ul>
      )}

      {/* Toast error */}
      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="rounded-md bg-red-600 text-white px-4 py-2 shadow-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-3 text-white/90 underline underline-offset-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
