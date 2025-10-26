"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  return (
    <div>
      {/* Desktop sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-56 md:flex-col md:bg-stone-900/80 md:backdrop-blur md:py-3 md:border-r md:border-stone-800/70">
        <div className="px-3 text-sm font-semibold tracking-tight text-stone-200">PackPal</div>
        <nav className="mt-4 px-2 space-y-0.5">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/trips">Trips</NavLink>
          <NavLink href="/friends">Friends</NavLink>
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
