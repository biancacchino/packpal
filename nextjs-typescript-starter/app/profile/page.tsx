"use client";

import { useEffect, useMemo, useState } from "react";
import SideNavShell from "app/components/SideNavShell";
import type { User } from "app/userStore";
import { listFriends } from "../friendsStore"; // only for type inference; we'll fetch counts via API

type Counts = { friends: number; trips: number };

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [counts, setCounts] = useState<Counts>({ friends: 0, trips: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let abort = false;
    async function load() {
      try {
        const [uRes, fRes, tRes] = await Promise.all([
          fetch('/api/user', { cache: 'no-store' }),
          fetch('/api/friends', { cache: 'no-store' }),
          fetch('/api/trips', { cache: 'no-store' }),
        ]);
        const u = await uRes.json();
        const f = await fRes.json();
        const t = await tRes.json();
        if (!abort) {
          setUser(u.user);
          setCounts({ friends: Array.isArray(f.friends) ? f.friends.length : 0, trips: Array.isArray(t.trips) ? t.trips.length : 0 });
        }
      } catch {
        if (!abort) setError('Failed to load profile');
      }
    }
    load();
    const onUserUpdated = () => void load();
    if (typeof window !== 'undefined') window.addEventListener('user:updated', onUserUpdated as EventListener);
    return () => { 
      abort = true; 
      if (typeof window !== 'undefined') window.removeEventListener('user:updated', onUserUpdated as EventListener);
    };
  }, []);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setBio(user.bio ?? "");
      setEmailTouched(false);
    }
  }, [user]);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, bio }),
      });
      if (!res.ok) throw new Error('Save failed');
      const d = await res.json();
      setUser(d.user);
    } catch {
      setError('Could not save profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SideNavShell>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-extrabold">Profile</h1>
        <p className="text-stone-400 mt-2">Your public info and stats</p>

        {error && (
          <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
        )}

        {/* Header */}
        <section className="mt-6 flex items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-stone-700 flex items-center justify-center text-2xl select-none">
            {user?.username ? user.username[0]?.toUpperCase() : 'U'}
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-stone-400 mb-1">Display name</label>
                <input
                  value={username}
                  onChange={e => {
                    const val = e.target.value;
                    setUsername(val);
                    if (!emailTouched) {
                      const local = val.trim().toLowerCase().replace(/[^a-z0-9]+/g, '') || 'user';
                      setEmail(`${local}@gmail.com`);
                    }
                  }}
                  className="w-full rounded px-3 py-2 bg-stone-800 border border-stone-700"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Email</label>
                <input
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailTouched(true); }}
                  className="w-full rounded px-3 py-2 bg-stone-800 border border-stone-700"
                />
              </div>
              <div className="sm:col-span-2">
                <div className="inline-flex items-center gap-2 text-sm mt-1">
                  <span className={`px-2 py-0.5 rounded border ${user?.isPublic ? 'border-emerald-500 text-emerald-400' : 'border-stone-500 text-stone-300'}`}>
                    {user?.isPublic ? 'Public' : 'Private'}
                  </span>
                  <span className="text-stone-500">Profile visibility</span>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-stone-400 mb-1">Bio</label>
                <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} className="w-full rounded px-3 py-2 bg-stone-800 border border-stone-700" />
              </div>
            </div>
            <div className="mt-4">
              <button onClick={()=>void saveProfile()} disabled={saving} className="rounded bg-emerald-500 text-black font-semibold px-4 py-2 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-8 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg border border-stone-800 bg-stone-900/60 p-4">
            <div className="text-xs text-stone-400">Friends</div>
            <div className="text-2xl font-bold">{counts.friends}</div>
          </div>
          <div className="rounded-lg border border-stone-800 bg-stone-900/60 p-4">
            <div className="text-xs text-stone-400">Trips</div>
            <div className="text-2xl font-bold">{counts.trips}</div>
          </div>
          <div className="rounded-lg border border-stone-800 bg-stone-900/60 p-4">
            <div className="text-xs text-stone-400">Badges</div>
            <div className="text-2xl font-bold">{Math.min(5, counts.trips)}</div>
          </div>
        </section>
      </div>
    </SideNavShell>
  );
}
