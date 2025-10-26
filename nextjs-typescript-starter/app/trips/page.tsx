"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Trip = { id: string; name: string };

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch('/api/trips');
    const data = await res.json();
    setTrips(data.trips || []);
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

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Your Trips</h1>
        <div className="flex gap-2 mb-6">
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

        <ul className="grid gap-4 sm:grid-cols-2">
          {trips.map((t) => (
            <li key={t.id} className="rounded-xl border border-stone-700 bg-stone-800 p-4">
              <div className="text-lg font-semibold mb-2">{t.name}</div>
              <Link href={`/trips/${t.id}`} className="text-emerald-400 hover:underline">Open</Link>
            </li>
          ))}
          {trips.length === 0 && (
            <div className="text-stone-300">No trips yet. Create one above.</div>
          )}
        </ul>
      </div>
    </div>
  );
}
