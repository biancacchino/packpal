"use client";

import { useState } from "react";
import SideNav from "./SideNav";

export default function SideNavShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      {/* Desktop sidebar is rendered inside SideNav. For mobile, show a floating button */}
      <SideNav open={open} onClose={() => setOpen(false)} />

      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-30 p-2 rounded-lg bg-stone-800 text-white border border-stone-700"
        aria-label="Open navigation"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>

      {/* Content pushed right on desktop */}
      <main className="md:ml-64">
        {children}
      </main>
    </div>
  );
}
