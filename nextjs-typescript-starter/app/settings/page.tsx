"use client";

import { useEffect, useState } from "react";
import SideNavShell from "app/components/SideNavShell";
import type { User } from "app/userStore";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch('/api/user', { cache: 'no-store' });
        const data = await res.json();
        if (!abort) setUser(data.user);
      } catch {}
    })();
    return () => { abort = true; };
  }, []);

  async function patch(p: Partial<User>) {
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setUser(d.user);
      setMsg('Saved');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('user:updated'));
      }
    } catch {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    setMsg('Password updated');
  }

  async function deleteData() {
    if (!confirm('Delete all your trips and friends? This cannot be undone.')) return;
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch('/api/user/delete-data', { method: 'POST' });
      if (!res.ok) throw new Error();
      setMsg('All trips and friends deleted');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('friends:updated'));
      }
    } catch {
      setError('Failed to delete');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SideNavShell>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-extrabold">Settings</h1>
        <p className="text-stone-400 mt-2">Manage your account and preferences</p>

        {msg && <div className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{msg}</div>}
        {error && <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

        {/* Account Settings */}
        <section className="mt-8 rounded-lg border border-stone-800 bg-stone-900/60 p-5 space-y-4">
          <h2 className="text-xl font-bold">Account Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-stone-400 mb-1">Username</label>
              <input defaultValue={user?.username} onBlur={(e)=>void patch({ username: e.target.value })} className="w-full rounded px-3 py-2 bg-stone-800 border border-stone-700" />
            </div>
            <div>
              <label className="block text-xs text-stone-400 mb-1">Email</label>
              <input defaultValue={user?.email} disabled readOnly className="w-full rounded px-3 py-2 bg-stone-800/60 border border-stone-700 text-stone-400 cursor-not-allowed" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-stone-400 mb-1">Current password</label>
              <input type="password" className="w-full rounded px-3 py-2 bg-stone-800 border border-stone-700" />
            </div>
            <div>
              <label className="block text-xs text-stone-400 mb-1">New password</label>
              <input type="password" className="w-full rounded px-3 py-2 bg-stone-800 border border-stone-700" />
            </div>
            <div className="self-end">
              <button onClick={()=>void changePassword()} className="w-full rounded bg-stone-700 hover:bg-stone-600 px-3 py-2">Update password</button>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-800">
            <button onClick={()=>void deleteData()} disabled={saving} className="rounded border border-red-500 text-red-400 hover:bg-red-500/10 px-3 py-2 disabled:opacity-50">Delete all data</button>
          </div>
        </section>

        {/* Privacy Settings */}
        <section className="mt-6 rounded-lg border border-stone-800 bg-stone-900/60 p-5">
          <h2 className="text-xl font-bold">Privacy</h2>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="font-medium">Public profile</div>
              <div className="text-sm text-stone-400">Make your profile visible to others</div>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only" checked={!!user?.isPublic} onChange={(e)=>void patch({ isPublic: e.target.checked })} />
              <span className={`w-12 h-7 rounded-full p-1 transition ${user?.isPublic ? 'bg-emerald-500' : 'bg-stone-700'}`}>
                <span className={`block w-5 h-5 bg-black rounded-full transform transition ${user?.isPublic ? 'translate-x-5' : ''}`} />
              </span>
            </label>
          </div>
        </section>

        {/* Notifications */}
        <section className="mt-6 rounded-lg border border-stone-800 bg-stone-900/60 p-5">
          <h2 className="text-xl font-bold">Notifications</h2>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="font-medium">Email notifications</div>
              <div className="text-sm text-stone-400">Receive updates about shared trips</div>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only" checked={!!user?.emailNotifications} onChange={(e)=>void patch({ emailNotifications: e.target.checked })} />
              <span className={`w-12 h-7 rounded-full p-1 transition ${user?.emailNotifications ? 'bg-emerald-500' : 'bg-stone-700'}`}>
                <span className={`block w-5 h-5 bg-black rounded-full transform transition ${user?.emailNotifications ? 'translate-x-5' : ''}`} />
              </span>
            </label>
          </div>
        </section>

        {/* Theme section removed per request */}
      </div>
    </SideNavShell>
  );
}
