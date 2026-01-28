"use client";

import Link from "next/link";
import type { Trip } from "app/components/TripCarousel";
import type { Share } from "app/sharesStore";
import type { Friend } from "app/friendsStore";

export default function FriendsTripsList({
  friends,
  trips,
  shares,
  compact = false,
  onUninvite,
}: {
  friends: Friend[];
  trips: Trip[];
  shares: Share[];
  compact?: boolean;
  onUninvite?: (friendId: string, tripId: string) => void;
}) {
  const tripTitle = (id: string) => trips.find((t) => t.id === id)?.name ?? `Trip ${id}`;

  // Build friend -> [tripIds] map using only trips that exist
  const byFriend = new Map<string, { friendId: string; friendName: string; tripIds: string[] }>();
  for (const f of friends) byFriend.set(f.id, { friendId: f.id, friendName: f.name, tripIds: [] });
  for (const s of shares) {
    if (!byFriend.has(s.friendId)) continue;
    if (trips.some((t) => t.id === s.tripId)) {
      byFriend.get(s.friendId)!.tripIds.push(s.tripId);
    }
  }
  const groups = Array.from(byFriend.values()).filter((g) => g.tripIds.length > 0);

  if (groups.length === 0) {
    return <div className={compact ? "text-[12px] text-stone-400" : "text-sm text-stone-400"}>No shared trips yet</div>;
  }

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {groups.map((g) => (
        <div key={g.friendId} className="px-1">
          <div className={compact ? "px-2 py-1 text-[11px] uppercase tracking-wide text-stone-400/80" : "px-2 py-1 text-xs uppercase tracking-wide text-stone-400/90"}>
            {g.friendName}
          </div>
          <ul className={compact ? "ml-2 border-l border-stone-800/70 pl-2 space-y-0.5" : "ml-2 border-l border-stone-800/70 pl-2 space-y-1"}>
            {g.tripIds.map((tid) => (
              <li key={tid} className="flex items-center justify-between gap-2">
                <Link href={`/trips/${tid}`} className={compact ? "block px-3 py-1 rounded text-sm text-stone-200 hover:bg-stone-800" : "block px-3 py-1.5 rounded text-sm text-stone-200 hover:bg-stone-800"}>
                  {tripTitle(tid)}
                </Link>
                {onUninvite && (
                  <button
                    onClick={() => onUninvite(g.friendId, tid)}
                    className={compact ? "text-[11px] px-2 py-0.5 rounded border border-stone-700 hover:bg-stone-800" : "text-xs px-2 py-1 rounded border border-stone-700 hover:bg-stone-800"}
                  >
                    Uninvite
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
