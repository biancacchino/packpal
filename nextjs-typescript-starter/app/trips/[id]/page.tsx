"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

type TripItem = { id: string; text: string; done: boolean; addedBy?: string };

type Trip = { id: string; name: string; items: TripItem[]; shareToken: string };

export default function TripPage() {
  const params = useParams<{ id: string }>();
  const tripId = useMemo(() => String(params?.id || ''), [params]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [text, setText] = useState('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [dupNotice, setDupNotice] = useState<string | null>(null);
  const [addNotice, setAddNotice] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemInput, setItemInput] = useState('');
  

  async function load() {
    const res = await fetch(`/api/trips/${tripId}`);
    if (!res.ok) return;
    const data = await res.json();
    setTrip(data.trip);
  }

  async function loadShare() {
    const res = await fetch(`/api/trips/${tripId}/share`);
    const data = await res.json();
    if (res.ok) setShareUrl(data.url);
  }

  useEffect(() => {
    if (!tripId) return;
    void load();
    void loadShare();
  }, [tripId]);

  async function add() {
    const t = text.trim();
    if (!t) return;
    const res = await fetch(`/api/trips/${tripId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: t, addedBy: 'me' }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({} as any));
      const added = typeof data?.added === 'number' ? data.added : (Array.isArray(data?.created) ? data.created.length : 0);
      const skipped = typeof data?.skipped === 'number' ? data.skipped : 0;
      setText('');
      await load();
      if (added > 0) {
        setAddNotice(`Saved ${added} item${added > 1 ? 's' : ''} to your list${skipped > 0 ? ` (${skipped} duplicates skipped)` : ''}.`);
        setTimeout(() => setAddNotice(null), 2200);
      }
      if (added === 0 && skipped > 0) {
        setDupNotice('That item is already on your list.');
        setTimeout(() => setDupNotice(null), 2200);
      }
    }
  }

  async function toggle(itemId: string, done: boolean) {
    const res = await fetch(`/api/trips/${tripId}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !done }),
    });
    if (res.ok) await load();
  }

  async function remove(itemId: string) {
    const res = await fetch(`/api/trips/${tripId}/items/${itemId}`, { method: 'DELETE' });
    if (res.ok) await load();
  }

  if (!trip) {
    return <div className="min-h-screen bg-stone-900 text-stone-100 p-6">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            {editingName ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const name = nameInput.trim();
                  if (!name) return;
                  const res = await fetch(`/api/trips/${tripId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name }),
                  });
                  if (res.ok) {
                    setEditingName(false);
                    setNameInput('');
                    await load();
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder={trip.name}
                  className="text-2xl font-bold bg-stone-800 border border-stone-700 rounded px-2 py-1"
                />
                <button type="submit" className="px-3 py-1 rounded bg-emerald-500 text-black font-semibold">Save</button>
                <button type="button" onClick={() => { setEditingName(false); setNameInput(''); }} className="px-3 py-1 rounded border border-stone-700">Cancel</button>
              </form>
            ) : (
              <h1 className="text-2xl font-bold flex items-center gap-4">
                {trip.name}
                <button
                  className="text-xs px-2 py-1 rounded border border-stone-700 hover:bg-stone-800"
                  onClick={() => { setEditingName(true); setNameInput(trip.name); }}
                >
                  Edit name
                </button>
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={shareUrl}
              className="w-[260px] rounded px-3 py-2 bg-stone-800 border border-stone-700 text-sm"
            />
            <button
              onClick={() => { navigator.clipboard.writeText(shareUrl); }}
              className="rounded bg-emerald-500 text-black font-semibold px-3 py-2"
            >
              Copy link
            </button>
          </div>
        </div>

        {/* Removed floating Save button */}

        <div className="flex gap-3 mb-2">
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
        {addNotice && (
          <div className="mb-2 text-sm text-emerald-300">{addNotice}</div>
        )}
        {dupNotice && (
          <div className="mb-6 text-sm text-emerald-300">{dupNotice}</div>
        )}

        <ul className="space-y-2">
          {trip.items.map((i) => (
            <li key={i.id} className="flex items-center justify-between rounded border border-stone-700 px-3 py-2">
              <div className="flex items-center gap-3 flex-1">
                <input type="checkbox" checked={i.done} onChange={() => void toggle(i.id, i.done)} />
                {editingItemId === i.id ? (
                  <input
                    autoFocus
                    value={itemInput}
                    onChange={(e) => setItemInput(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        const t = itemInput.trim();
                        if (t) {
                          const res = await fetch(`/api/trips/${tripId}/items/${i.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: t }),
                          });
                          if (res.ok) {
                            setEditingItemId(null);
                            setItemInput('');
                            await load();
                          }
                        }
                      }
                      if (e.key === 'Escape') {
                        setEditingItemId(null);
                        setItemInput('');
                      }
                    }}
                    className="flex-1 bg-stone-800 border border-stone-700 rounded px-2 py-1"
                  />
                ) : (
                  <span className={`flex-1 ${i.done ? 'line-through text-stone-400' : ''}`}>{i.text}</span>
                )}
                {i.addedBy && (
                  <span className="ml-2 text-[10px] sm:text-xs text-stone-300 bg-stone-800 border border-stone-700 rounded-full px-2 py-0.5">
                    by {i.addedBy}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {editingItemId === i.id ? (
                  <button
                    onClick={() => { setEditingItemId(null); setItemInput(''); }}
                    className="text-stone-300 hover:text-white"
                  >Cancel</button>
                ) : (
                  <button
                    onClick={() => { setEditingItemId(i.id); setItemInput(i.text); }}
                    className="text-stone-300 hover:text-white"
                  >Edit</button>
                )}
                <button onClick={() => void remove(i.id)} className="text-stone-300 hover:text-white">Remove</button>
              </div>
            </li>
          ))}
          {trip.items.length === 0 && <div className="text-stone-400">No items yet.</div>}
        </ul>
      </div>
    </div>
  );
}
