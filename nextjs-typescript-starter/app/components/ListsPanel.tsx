"use client";

import { useState } from "react";

const sampleLists = [
  { id: "l1", title: "Weekend Escape", items: 12 },
  { id: "l2", title: "Business Trip", items: 8 },
  { id: "l3", title: "Camping", items: 20 },
];

export default function ListsPanel() {
  const [lists] = useState(sampleLists);

  return (
    <div className="bg-stone-800 rounded-xl p-6">
      <ul className="space-y-4">
        {lists.map((l) => (
          <li key={l.id} className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">{l.title}</div>
              <div className="text-sm text-stone-400">{l.items} items</div>
            </div>
            <div>
              <button className="px-4 py-2 bg-sky-500 text-black rounded-md font-medium hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300" aria-label={`Open list ${l.title}`}>
                Open
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
