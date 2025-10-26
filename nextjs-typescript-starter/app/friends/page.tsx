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
  const [inviteFriendQuery, setInviteFriendQuery] = useState("");
  const [inviteFriendId, setInviteFriendId] = useState<string>("");
  const [inviteTripId, setInviteTripId] = useState<string>("");
  const [inviteAccess, setInviteAccess] = useState<Share["access"]>("view");
  const [inviteBusy, setInviteBusy] = useState(false);

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

  function resolveFriendIdFromQuery(q: string): string {
    const exact = FRIENDS.find(f => f.name.toLowerCase() === q.trim().toLowerCase());
    if (exact) return exact.id;
    const starts = FRIENDS.find(f => f.name.toLowerCase().startsWith(q.trim().toLowerCase()));
    return starts?.id ?? "";
  }

  async function invite() {
    const fid = inviteFriendId || resolveFriendIdFromQuery(inviteFriendQuery);
    const tid = inviteTripId;
    const access = inviteAccess;
    if (!fid || !tid || !access) return;
    setInviteBusy(true);
    try {
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: fid, tripId: tid, access }),
      });
      if (res.ok) {
        // refresh shares list
        const r = await fetch('/api/shares', { cache: 'no-store' });
        const d = await r.json();
        setShares(Array.isArray(d.shares) ? d.shares : []);
        setInviteFriendQuery("");
        setInviteFriendId("");
        setInviteTripId("");
        setInviteAccess("view");
      }
    } finally {
      setInviteBusy(false);
    }
  }

  async function uninvite(friendId: string, tripId: string) {
    const res = await fetch('/api/shares', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendId, tripId }),
    });
    if (res.ok) {
      const r = await fetch('/api/shares', { cache: 'no-store' });
      const d = await r.json();
      setShares(Array.isArray(d.shares) ? d.shares : []);
    }
  }

  return (
    <SideNavShell>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Friends</h1>
            <p className="text-stone-400 text-sm md:text-base mt-1">Trips shared with each friend</p>
          </div>
        </div>

        {/* Invite section */}
        <section className="mt-6 rounded-lg border border-stone-800 bg-stone-900/60 p-4">
          <h2 className="text-base font-semibold text-white mb-3">Invite a friend to a trip</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <label className="block text-xs text-stone-400 mb-1">Friend</label>
              <input
                list="friend-options"
                value={inviteFriendQuery}
                onChange={(e) => { setInviteFriendQuery(e.target.value); setInviteFriendId(""); }}
                placeholder="Search or type a friend's name (e.g., Alex)"
                className="w-full rounded px-3 py-2 bg-stone-800 border border-stone-700 outline-none"
              />
              <datalist id="friend-options">
                {FRIENDS.map((f) => (
                  <option key={f.id} value={f.name} />
                ))}
              </datalist>
            </div>
            <div className="w-full sm:w-56">
              <label className="block text-xs text-stone-400 mb-1">Trip</label>
              <select
                value={inviteTripId}
                onChange={(e) => setInviteTripId(e.target.value)}
                className="w-full rounded px-3 py-2 bg-stone-800 border border-stone-700"
              >
                <option value="">Select a trip…</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-40">
              <label className="block text-xs text-stone-400 mb-1">Access</label>
              <select
                value={inviteAccess}
                onChange={(e) => setInviteAccess(e.target.value as Share['access'])}
                className="w-full rounded px-3 py-2 bg-stone-800 border border-stone-700"
              >
                <option value="view">View</option>
                <option value="suggest">Suggest</option>
                <option value="edit">Edit</option>
              </select>
            </div>
            <div className="sm:self-end">
              <button
                onClick={invite}
                disabled={inviteBusy || !(inviteTripId && (inviteFriendId || inviteFriendQuery))}
                className="rounded bg-emerald-500 text-black font-semibold px-4 py-2 disabled:opacity-50"
              >
                {inviteBusy ? 'Inviting…' : 'Invite'}
              </button>
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FRIENDS.map((f) => {
            const fShares = shares.filter(s => s.friendId === f.id);
            // Deduplicate and keep only trip ids that exist
            const uniqueTripIds = Array.from(
              new Set(fShares.map((s) => s.tripId).filter((tid) => trips.some((t) => t.id === tid)))
            );
            return (
              <section key={f.id} className="rounded-lg border border-stone-800 bg-stone-900/60 p-4">
                <h2 className="text-base font-semibold text-white">{f.name}</h2>
                <ul className="mt-3 space-y-1">
                  {uniqueTripIds.length > 0 ? (
                    uniqueTripIds.map((tid) => {
                      const sh = fShares.find((s) => s.tripId === tid);
                      const access = sh?.access ?? 'view';
                      return (
                        <li key={tid} className="flex items-center justify-between gap-3">
                          <Link
                            href={`/trips/${tid}`}
                            className="flex-1 rounded px-2 py-1 text-sm text-stone-200 hover:bg-stone-800"
                          >
                            {tripTitle(tid)}
                          </Link>
                          <span className="text-[11px] uppercase tracking-wide text-stone-400">{access}</span>
                          <button
                            onClick={() => void uninvite(f.id, tid)}
                            className="text-xs px-2 py-1 rounded border border-stone-700 hover:bg-stone-800"
                          >
                            Uninvite
                          </button>
                        </li>
                      );
                    })
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
