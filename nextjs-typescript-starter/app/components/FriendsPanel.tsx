"use client";

import { useEffect, useState } from "react";
import InviteDialog from "./InviteDialog";
import type { AccessLevel } from "app/sharesStore";
import type { Friend } from "app/friendsStore";

export default function FriendsPanel() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load friends from API so Dashboard reflects additions from Friends page
  useEffect(() => {
    let abort = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/friends', { cache: 'no-store' });
        const data = await res.json();
        if (!abort) {
          setFriends(Array.isArray(data.friends) ? data.friends : []);
          setError(null);
        }
      } catch {
        if (!abort) setError('Failed to load friends');
      } finally {
        if (!abort) setLoading(false);
      }
    }
    load();
    // Listen for cross-page updates
    const onUpdated = () => void load();
    window.addEventListener('friends:updated', onUpdated as EventListener);
    return () => {
      abort = true;
      window.removeEventListener('friends:updated', onUpdated as EventListener);
    };
  }, []);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<{ id: string; name: string } | null>(null);
  const [lastInvite, setLastInvite] = useState<{
    friendName: string;
    access: AccessLevel;
  } | null>(null);

  function openInvite(friend: { id: string; name: string }) {
    setSelectedFriend(friend);
    setInviteOpen(true);
  }

  return (
    <div className="bg-stone-800 rounded-xl p-6">
      {loading && (
        <div className="mb-3 text-sm text-stone-400">Loading friends…</div>
      )}
      {error && (
        <div className="mb-3 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      {lastInvite && (
        <div className="mb-4 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          Shared a trip with {lastInvite.friendName} ({lastInvite.access}).
        </div>
      )}
      <ul className="space-y-4">
        {friends.map((f) => (
          <li key={f.id} className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">{f.name}</div>
              <div className="text-sm text-stone-400">Offline</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => openInvite(f)}
                className="px-4 py-2 bg-emerald-500 text-black rounded-md font-medium hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                aria-label={`Invite ${f.name}`}
              >
                Invite
              </button>
              <button className="px-4 py-2 bg-stone-700 rounded-md hover:bg-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-500" aria-label={`Chat with ${f.name}`}>
                Chat
              </button>
            </div>
          </li>
        ))}
      </ul>

      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        friend={selectedFriend}
        onInvited={({ access }) =>
          setLastInvite({ friendName: selectedFriend!.name, access })
        }
      />
    </div>
  );
}
