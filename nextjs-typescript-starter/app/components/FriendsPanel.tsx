"use client";

import { useState } from "react";

const sampleFriends = [
  { id: "f1", name: "Alex" },
  { id: "f2", name: "Sam" },
  { id: "f3", name: "Riley" },
];

export default function FriendsPanel() {
  const [friends] = useState(sampleFriends);

  return (
    <div className="bg-stone-800 rounded-xl p-6">
      <ul className="space-y-4">
        {friends.map((f) => (
          <li key={f.id} className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">{f.name}</div>
              <div className="text-sm text-stone-400">Offline</div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-emerald-500 text-black rounded-md font-medium hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300" aria-label={`Invite ${f.name}`}>
                Invite
              </button>
              <button className="px-4 py-2 bg-stone-700 rounded-md hover:bg-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-500" aria-label={`Chat with ${f.name}`}>
                Chat
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
