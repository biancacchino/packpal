"use client";

import Link from "next/link";

export default function SideNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div>
      {/* Desktop sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col md:bg-stone-900 md:py-4 md:border-r md:border-stone-800">
        <div className="px-4 text-xl font-bold text-white">Packpal</div>
        <nav className="mt-6 px-2 space-y-1">
          <Link href="/dashboard" className="block px-3 py-2 rounded text-stone-200 hover:bg-stone-800">Dashboard</Link>
          <Link href="/trips" className="block px-3 py-2 rounded text-stone-200 hover:bg-stone-800">Trips</Link>
          <Link href="/friends" className="block px-3 py-2 rounded text-stone-200 hover:bg-stone-800">Friends</Link>
          <Link href="/lists" className="block px-3 py-2 rounded text-stone-200 hover:bg-stone-800">Lists</Link>
        </nav>
      </aside>

      {/* Mobile overlay */}
      <div className={`fixed inset-0 z-40 md:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        <div className={`absolute inset-0 bg-black/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

        <aside className={`absolute left-0 top-0 bottom-0 w-64 bg-stone-900 p-4 transform transition-transform ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold">Packpal</div>
            <button onClick={onClose} className="p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M6 18L18 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>

          <nav className="mt-6 space-y-2">
            <Link href="/dashboard" onClick={onClose} className="block px-3 py-2 rounded text-stone-200 hover:bg-stone-800">Dashboard</Link>
            <Link href="/trips" onClick={onClose} className="block px-3 py-2 rounded text-stone-200 hover:bg-stone-800">Trips</Link>
            <Link href="/friends" onClick={onClose} className="block px-3 py-2 rounded text-stone-200 hover:bg-stone-800">Friends</Link>
            <Link href="/lists" onClick={onClose} className="block px-3 py-2 rounded text-stone-200 hover:bg-stone-800">Lists</Link>
          </nav>
        </aside>
      </div>
    </div>
  );
}
