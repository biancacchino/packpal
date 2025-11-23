"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SideNavShell from 'app/components/SideNavShell';

type TripItem = { id: string; text: string; done: boolean; addedBy?: string };

type Trip = { id: string; name: string; items: TripItem[]; shareToken: string };
type AccessLevel = 'view' | 'suggest' | 'edit';
type Share = { id: string; friendId: string; tripId: string; access: AccessLevel };
type Friend = { id: string; name: string };

export default function TripPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tripId = useMemo(() => String(params?.id || ''), [params]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [dupNotice, setDupNotice] = useState<string | null>(null);
  const [addNotice, setAddNotice] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemInput, setItemInput] = useState('');
  const [accessOpen, setAccessOpen] = useState(false);
  const [accessLoading, setAccessLoading] = useState(false);
  const [shares, setShares] = useState<Share[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  

  async function load(showSpinner: boolean = true) {
    if (showSpinner) setLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}`);
      if (!res.ok) {
        setError('Failed to load trip. Please try again.');
        setTrip(null);
        return;
      }
      const data = await res.json();
      setTrip(data.trip);
      setError(null);
    } catch {
      setError('Failed to load trip. Please try again.');
      setTrip(null);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  async function loadShare() {
    try {
      const res = await fetch(`/api/trips/${tripId}/share`);
      const data = await res.json();
      if (res.ok) setShareUrl(data.url);
    } catch {
      // silent share load error; primary toast comes from trip load
    }
  }

  useEffect(() => {
    if (!tripId) return;
    void load();
    void loadShare();
  }, [tripId]);

  useEffect(() => {
    if (!accessOpen) return;
    void loadAccess();
  }, [accessOpen]);

  async function loadAccess() {
    if (!tripId) return;
    setAccessLoading(true);
    try {
      const [sRes, fRes] = await Promise.all([
        fetch(`/api/shares?tripId=${encodeURIComponent(tripId)}`, { cache: 'no-store' }),
        fetch('/api/friends', { cache: 'no-store' }),
      ]);
      const sData = await sRes.json().catch(() => ({} as any));
      const fData = await fRes.json().catch(() => ({} as any));
      if (sRes.ok) setShares(Array.isArray(sData.shares) ? sData.shares : []);
      if (fRes.ok) setFriends(Array.isArray(fData.friends) ? fData.friends : []);
    } finally {
      setAccessLoading(false);
    }
  }

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

  async function deleteTripAll() {
    if (!trip) return;
    if (!confirm(`Delete "${trip.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/trips/${tripId}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
      try { window.dispatchEvent(new CustomEvent('trips:updated')); } catch {}
      router.push('/trips');
    }
  }

  if (loading) {
    return (
      <SideNavShell>
        <div className="p-6 text-stone-100">Loading…</div>
      </SideNavShell>
    );
  }
  if (!trip) {
    return (
      <SideNavShell>
        <div className="p-6 text-stone-100">
          <div className="max-w-3xl mx-auto">
            <div className="mb-3 text-red-300">{error ?? 'Trip not found.'}</div>
            <button
              onClick={() => void load(false)}
              className="rounded bg-emerald-500 text-black font-semibold px-4 py-2"
            >
              Retry
            </button>
          </div>
        </div>
      </SideNavShell>
    );
  }

  return (
    <SideNavShell>
      <div className="max-w-3xl mx-auto px-4 py-8 text-stone-100">
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
                    await load(false);
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
            <button
              onClick={() => setAccessOpen(true)}
              className="rounded border border-stone-700 text-stone-200 font-semibold px-3 py-2 hover:bg-stone-800"
              aria-haspopup="dialog"
              aria-expanded={accessOpen}
            >
              Access
            </button>
            <button
              onClick={() => void deleteTripAll()}
              className="rounded border border-red-500 text-red-400 font-semibold px-3 py-2 hover:bg-red-500/10"
            >
              Delete trip
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
                <input
                  type="checkbox"
                  checked={i.done}
                  onChange={() => void toggle(i.id, i.done)}
                  aria-label={`Mark ${i.text} ${i.done ? 'not done' : 'done'}`}
                  className="h-6 w-6 md:h-5 md:w-5 rounded-sm border border-stone-600 bg-stone-800 text-emerald-500 accent-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shrink-0"
                />
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
                            await load(false);
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
      {accessOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setAccessOpen(false)} />
          <div role="dialog" aria-modal="true" className="relative z-10 w-[92vw] max-w-md rounded-lg border border-stone-700 bg-stone-900 p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Who has access</h2>
              <button onClick={() => setAccessOpen(false)} className="rounded px-2 py-1 text-stone-300 hover:text-white">Close</button>
            </div>
            <div className="mt-3">
              <div className="text-sm text-stone-300">
                Anyone with the link can add items.
              </div>
              <div className="mt-3 border-t border-stone-800 pt-3">
                {accessLoading ? (
                  <div className="text-sm text-stone-400">Loading…</div>
                ) : shares.length === 0 ? (
                  <div className="text-sm text-stone-400">Not shared with any friends yet.</div>
                ) : (
                  <ul className="space-y-2">
                    {shares.map((s) => {
                      const friendName = friends.find((f) => f.id === s.friendId)?.name || s.friendId;
                      return (
                        <li key={s.id} className="flex items-center justify-between">
                          <span className="text-sm text-stone-200">{friendName}</span>
                          <span className="text-[11px] uppercase tracking-wide text-stone-400">{s.access}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
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
    </SideNavShell>
  );
}
