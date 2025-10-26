"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Trip } from "app/components/TripCarousel";
import type { Share } from "app/sharesStore";

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block px-3 py-2 rounded text-sm ${
        active ? "bg-stone-800 text-white" : "text-stone-200 hover:bg-stone-800"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

export default function SideNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Lightweight sample registries to resolve names for ids.
  const FRIENDS = useMemo(() => ([
    { id: "f1", name: "Alex" },
    { id: "f2", name: "Sam" },
    { id: "f3", name: "Riley" },
  ]), []);
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

  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let abort = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/shares', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!abort) setShares(Array.isArray(data.shares) ? data.shares : []);
      } catch {}
      finally {
        if (!abort) setLoading(false);
      }
    }
    load();
    return () => { abort = true; };
  }, []);

  const tripTitle = (id: string) => trips.find(t => t.id === id)?.name ?? `Trip ${id}`;
  const friendsWithShares = useMemo(() => {
    const byFriend = new Map<string, { friendId: string; friendName: string; tripIds: string[] }>();
    for (const f of FRIENDS) byFriend.set(f.id, { friendId: f.id, friendName: f.name, tripIds: [] });
    for (const s of shares) {
      if (!byFriend.has(s.friendId)) continue;
      if (trips.some(t => t.id === s.tripId)) {
        byFriend.get(s.friendId)!.tripIds.push(s.tripId);
      }
    }
    return Array.from(byFriend.values()).filter(g => g.tripIds.length > 0);
  }, [FRIENDS, shares, trips]);

  return (
    <div>
      {/* Desktop sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-56 md:flex-col md:bg-stone-900/80 md:backdrop-blur md:py-3 md:border-r md:border-stone-800/70">
        <div className="px-3 text-sm font-semibold tracking-tight text-stone-200">PackPal</div>
        <nav className="mt-4 px-2 space-y-0.5">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/trips">Trips</NavLink>
          <NavLink href="/friends">Friends</NavLink>
          {/* Friends -> trips grouping */}
          {friendsWithShares.length > 0 && (
            <div className="mt-2 space-y-1">
              {friendsWithShares.map((g) => (
                <div key={g.friendId} className="px-1">
                  <div className="px-2 py-1 text-[11px] uppercase tracking-wide text-stone-400/80">{g.friendName}</div>
                  <ul className="ml-2 border-l border-stone-800/70 pl-2 space-y-0.5">
                    {g.tripIds.map((tid) => (
                      <li key={tid}>
                        <NavLink href={`/trips/${tid}`}>{tripTitle(tid)}</NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </nav>
        <div className="mt-auto px-2 pt-3 border-t border-stone-800/70">
          <nav className="space-y-0.5">
            <NavLink href="/profile">Profile</NavLink>
            <NavLink href="/settings">Settings</NavLink>
          </nav>
        </div>
      </aside>

      {/* Mobile overlay */}
      <div className={`fixed inset-0 z-40 md:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

        <aside className={`absolute left-0 top-0 bottom-0 w-60 bg-stone-900/95 backdrop-blur p-3 transform transition-transform ${open ? 'translate-x-0' : '-translate-x-full'}`} aria-label="Mobile navigation">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold tracking-tight">PackPal</div>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-stone-800" aria-label="Close navigation">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M6 18L18 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>

          <nav className="mt-5 space-y-0.5">
            <NavLink href="/dashboard" onClick={onClose}>Dashboard</NavLink>
            <NavLink href="/trips" onClick={onClose}>Trips</NavLink>
            <NavLink href="/friends" onClick={onClose}>Friends</NavLink>
            {/* Friends -> trips grouping */}
            {friendsWithShares.length > 0 && (
              <div className="mt-2 space-y-1">
                {friendsWithShares.map((g) => (
                  <div key={g.friendId} className="px-1">
                    <div className="px-2 py-1 text-[11px] uppercase tracking-wide text-stone-400/80">{g.friendName}</div>
                    <ul className="ml-2 border-l border-stone-800/70 pl-2 space-y-0.5">
                      {g.tripIds.map((tid) => (
                        <li key={tid}>
                          <NavLink href={`/trips/${tid}`} onClick={onClose}>{tripTitle(tid)}</NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </nav>
          <div className="mt-auto pt-3 border-t border-stone-800/70 space-y-0.5">
            <NavLink href="/profile" onClick={onClose}>Profile</NavLink>
            <NavLink href="/settings" onClick={onClose}>Settings</NavLink>
          </div>
        </aside>
      </div>
    </div>
  );
}
