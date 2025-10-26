"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

type TripItem = { id: string; text: string; done: boolean; addedBy?: string };

type Trip = { id: string; name: string; items: TripItem[] };

export default function SharedTripPage() {
  const params = useParams<{ token: string }>();
  const token = useMemo(() => String(params?.token || ''), [params]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [text, setText] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!token) return;
    setLoading(true);
    const res = await fetch(`/api/trips/token/${token}`);
    const data = await res.json().catch(() => ({} as any));
    if (res.ok) setTrip(data.trip);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [token]);

  async function add() {
    const t = text.trim();
    if (!t) return;
    const res = await fetch(`/api/trips/token/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: t }),
    });
    const data = await res.json().catch(() => ({} as any));
    if (res.ok) {
      const added = typeof data?.added === 'number' ? data.added : (Array.isArray(data?.created) ? data.created.length : 0);
      const skipped = typeof data?.skipped === 'number' ? data.skipped : 0;
      setText('');
      await load();
      if (added > 0) {
        setNotice(`Added ${added} item${added > 1 ? 's' : ''}${skipped > 0 ? ` (${skipped} duplicates skipped)` : ''}.`);
      } else if (skipped > 0) {
        setNotice('No new items (duplicates skipped).');
      } else {
        setNotice('Nothing to add.');
      }
      setTimeout(() => setNotice(null), 2000);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-stone-900 text-stone-100 p-6">Loading…</div>;
  }
  if (!trip) {
    return (
      <div className="min-h-screen bg-stone-900 text-stone-100 p-6">
        <div className="max-w-3xl mx-auto">This shared list link is invalid or expired.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{trip.name}</h1>
          <p className="text-sm text-stone-300 mt-1">You're viewing a shared list. Anyone with this link can add items.</p>
        </div>

        <div className="flex gap-3 mb-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add an item (you can paste multiple lines)"
            className="flex-1 rounded px-3 py-2 bg-stone-800 border border-stone-700 outline-none"
          />
          <button onClick={add} disabled={!text.trim()} className="rounded bg-emerald-500 text-black font-semibold px-4 py-2 disabled:opacity-50">
            Add
          </button>
        </div>
        {notice && <div className="mb-4 text-sm text-emerald-300">{notice}</div>}

        <ul className="space-y-2">
          {trip.items.map((i) => (
            <li key={i.id} className="flex items-center justify-between rounded border border-stone-700 px-3 py-2">
              <span className="flex-1">{i.text}</span>
              {i.addedBy && (
                <span className="ml-2 text-[10px] sm:text-xs text-stone-300 bg-stone-800 border border-stone-700 rounded-full px-2 py-0.5">
                  by {i.addedBy}
                </span>
              )}
            </li>
          ))}
          {trip.items.length === 0 && <div className="text-stone-400">No items yet.</div>}
        </ul>
      </div>
    </div>
  );
}
