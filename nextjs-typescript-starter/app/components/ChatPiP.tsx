"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatPiP() {
  const MAX_INPUT_CHARS = 2000;
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const pip = localStorage.getItem("packpal_chat_pip");
      setOpen(pip === "open");
      const raw = localStorage.getItem("packpal_chat");
      if (raw) setMessages(JSON.parse(raw) as Msg[]);
    } catch {}
  }, []);

  // When navigating between pages (e.g., from /ai to /trips/:id), re-sync with localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      const raw = localStorage.getItem("packpal_chat");
      if (raw) setMessages(JSON.parse(raw) as Msg[]);
    } catch {}
  }, [pathname, mounted]);

  // Best-effort sync if localStorage gets updated elsewhere
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== "packpal_chat") return;
      try {
        const raw = e.newValue;
        if (raw) setMessages(JSON.parse(raw) as Msg[]);
      } catch {}
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("packpal_chat", JSON.stringify(messages));
    } catch {}
  }, [messages, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("packpal_chat_pip", open ? "open" : "closed");
    } catch {}
  }, [open, mounted]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true);
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    try {
      let tripContext: any = null;
      try {
        const raw = localStorage.getItem("packpal_trip_draft");
        if (raw) tripContext = JSON.parse(raw);
      } catch {}
      // If we're on a trip page, let the AI know the trip id and allow direct list updates
      try {
        const path = window.location.pathname;
        const m = path.match(/^\/trips\/([^\/]+)$/);
        if (m) {
          const tripId = m[1];
          // Hint the server to auto-add any generated bullet list items to this trip
          tripContext = { ...(tripContext || {}), tripId, autoAddItems: true };
        }
      } catch {}
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, tripContext }),
      });
      const data = await res.json();
      const bot = (data?.text as string) || "";
      setMessages((m) => [...m, { role: "assistant", content: bot }]);
      if (typeof data?.added === 'number') {
        const skipped = typeof data?.skipped === 'number' ? data.skipped : 0;
        if (data.added > 0) {
          setNotice(`Added ${data.added} items to this trip.${skipped > 0 ? ` (${skipped} duplicates skipped)` : ''}`);
        } else {
          setNotice('No new items to add (duplicates skipped).');
        }
        setTimeout(() => setNotice(null), 2500);
      }
    } catch {}
    setLoading(false);
  }

  if (!mounted) return null;
  // Hide on homepage, standalone chat, and auth pages
  if (
    pathname === "/" ||
    pathname?.startsWith("/ai") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register")
  ) return null;

  // Small floating button when closed
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-emerald-500 text-black font-semibold px-4 py-3 shadow-lg hover:bg-emerald-400"
        aria-label="Open Packpal chat"
        title="Open Packpal chat"
      >
        Chat
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[90vw] rounded-xl bg-stone-900 text-stone-100 shadow-2xl border border-stone-700">
      <div className="flex items-center justify-between px-3 py-2 border-b border-stone-700">
        <div className="font-semibold">Packpal</div>
        <div className="flex items-center gap-2">
          {/* Reset chat */}
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              try { localStorage.setItem("packpal_chat", JSON.stringify([])); } catch {}
              setNotice("Chat reset.");
              setTimeout(() => setNotice(null), 1500);
            }}
            className="text-stone-300 hover:text-white"
            aria-label="Reset chat"
            title="Reset chat"
          >
            ⟲
          </button>
          <button
            type="button"
            onClick={() => {
              try { localStorage.setItem("packpal_chat_pip", "closed"); } catch {}
              router.push("/ai");
            }}
            className="text-stone-300 hover:text-white"
            aria-label="Open full chat"
            title="Open full chat"
          >
            ⤢
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-stone-300 hover:text-white"
            aria-label="Minimize chat"
            title="Minimize"
          >
            –
          </button>
        </div>
      </div>
      {notice && (
        <div className="px-3 pt-2 text-xs text-emerald-300">{notice}</div>
      )}
      {/* Quick actions bar */}
      <ActionsBar
        messages={messages}
        onNotice={(msg) => { setNotice(msg); setTimeout(() => setNotice(null), 2500); }}
      />
      <div className="max-h-[50vh] overflow-y-auto p-3 space-y-2">
        {messages.slice(-12).map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[80%] whitespace-pre-wrap bg-emerald-500 text-black rounded-lg px-3 py-2"
                  : "max-w-[80%] whitespace-pre-wrap bg-stone-800 text-stone-100 rounded-lg px-3 py-2"
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-stone-800 text-stone-200 rounded-lg px-3 py-2">Typing…</div>
          </div>
        )}
      </div>
      <form
        className="flex items-center gap-2 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <AutoGrowTA
          value={input}
          onChange={setInput}
          onEnterSubmit={() => { if (input.trim() && !loading) void send(); }}
          maxLength={MAX_INPUT_CHARS}
          placeholder="Type a message"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="inline-flex items-center px-3 py-2 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 disabled:opacity-50"
        >
          Send
        </button>
      </form>
      <div className="px-3 pb-3 text-[10px] text-stone-400">{input.length} / {MAX_INPUT_CHARS} characters</div>
    </div>
  );
}

function ActionsBar({ messages, onNotice }: {
  messages: Msg[];
  onNotice: (msg: string) => void;
}) {
  const [expanded, setExpanded] = useState<null | "add-existing" | "create-add">(null);
  const [trips, setTrips] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string>("");

  function extractItemsFromText(text: string): string[] {
    const lines = text.split(/\r?\n/).map(l => l.trim());
    const items: string[] = [];
    for (const l of lines) {
      if (!l) continue;
      // Only accept explicit list markers to avoid grabbing intro sentences
      // Bullets: -, *, •  | Numbered: 1. or 1)
      const m = l.match(/^\s*(?:[-*•]\s+|\d+[.)]\s+)(.+)$/);
      if (!m || !m[1]) continue;
      let t = m[1].trim();
      // Skip section headers like "Essentials:" or lines that look like intros
      if (/^[A-Za-z][A-Za-z\s]+:\s*$/.test(t)) continue;
      if (/^(okay|sure|here(?:'|’)s)\b/i.test(t)) continue;
      // Strip surrounding quotes and trailing punctuation
      t = t.replace(/^['"\-\u2013\u2014\u2015\u2012\u2011\s]+/, "").replace(/[\s.,;:!?)\]]+$/, "");
      // Keep main noun before long dash notes
      const dashSplit = t.split(/\s[\u2013\u2014\-]\s/);
      if (dashSplit[0]) t = dashSplit[0].trim();
      if (t) items.push(t);
    }
    // de-dupe while preserving order; require at least 3 items like server heuristic
    const seen = new Set<string>();
    const out = items.filter(it => {
      const key = it.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return out.length >= 3 ? out : [];
  }

  function getLastAssistantList(): string[] {
    const last = [...messages].reverse().find(m => m.role === "assistant");
    if (!last) return [];
    return extractItemsFromText(last.content);
  }

  async function addToExisting() {
    const items = getLastAssistantList();
    if (!items.length) return onNotice("No list found in the latest response.");
    if (!selectedTripId) return onNotice("Choose a trip first.");
    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${selectedTripId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, addedBy: "ai" })
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data?.error || "failed");
      const added = typeof data?.added === 'number' ? data.added : items.length;
      const skipped = typeof data?.skipped === 'number' ? data.skipped : 0;
      onNotice(`Added ${added} items.${skipped > 0 ? ` (${skipped} duplicates skipped)` : ''}`);
      // notify others
      try { window.dispatchEvent(new CustomEvent('trips:updated')); } catch {}
    } catch (e) {
      onNotice("Failed to add items.");
    }
    setLoading(false);
  }

  async function createAndAdd() {
    const items = getLastAssistantList();
    if (!items.length) return onNotice("No list found in the latest response.");
    const name = window.prompt("New trip name:", "New Trip from Chat");
    if (!name) return;
    setLoading(true);
    try {
      const r = await fetch('/api/trips', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const d = await r.json();
      if (!r.ok || !d?.trip?.id) throw new Error(d?.error || 'create failed');
      const tripId = d.trip.id as string;
      await fetch(`/api/trips/${tripId}/items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, addedBy: 'ai' })
      });
      onNotice(`Created "${d.trip.name}" and added ${items.length} items.`);
      try { window.dispatchEvent(new CustomEvent('trips:updated')); } catch {}
    } catch (e) {
      onNotice("Failed to create or add items.");
    }
    setLoading(false);
  }

  async function openExisting() {
    setExpanded(expanded === 'add-existing' ? null : 'add-existing');
    if (expanded === 'add-existing') return;
    setLoading(true);
    try {
      const res = await fetch('/api/trips', { cache: 'no-store' });
      const data = await res.json();
      const list = Array.isArray(data?.trips) ? data.trips : [];
      setTrips(list);
      if (list.length) setSelectedTripId(list[0].id);
    } catch {}
    setLoading(false);
  }

  return (
    <div className="px-3 pt-2 pb-1 border-b border-stone-800">
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={openExisting}
          className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700"
        >
          Add to existing
        </button>
        <button
          type="button"
          onClick={() => setExpanded(expanded === 'create-add' ? null : 'create-add')}
          className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700"
        >
          Create + add to new
        </button>
      </div>
      {expanded === 'add-existing' && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <select
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            className="flex-1 bg-stone-800 rounded px-2 py-1"
          >
            {trips.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={loading || !selectedTripId}
            onClick={addToExisting}
            className="px-2 py-1 rounded bg-emerald-500 text-black font-semibold disabled:opacity-50"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setExpanded(null)}
            className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700"
          >
            Cancel
          </button>
        </div>
      )}
      {expanded === 'create-add' && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <button
            type="button"
            disabled={loading}
            onClick={createAndAdd}
            className="px-2 py-1 rounded bg-emerald-500 text-black font-semibold disabled:opacity-50"
          >
            Create now
          </button>
          <span className="text-stone-400">Prompts for a name</span>
          <button
            type="button"
            onClick={() => setExpanded(null)}
            className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function AutoGrowTA({ value, onChange, onEnterSubmit, placeholder, maxLength }: {
  value: string;
  onChange: (v: string) => void;
  onEnterSubmit: () => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const [height, setHeight] = useState<string | number>("auto");
  const [minHeight] = useState<number>(40);

  useEffect(() => {
    const el = document.getElementById("packpal-pip-input") as HTMLTextAreaElement | null;
    if (!el) return;
    el.style.height = "0px";
    const newHeight = Math.max(el.scrollHeight, minHeight);
    el.style.height = newHeight + "px";
    setHeight(newHeight);
  }, [value, minHeight]);

  return (
    <textarea
      id="packpal-pip-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onEnterSubmit();
        }
      }}
      rows={1}
      style={{ height }}
      placeholder={placeholder}
      maxLength={maxLength}
      className="flex-1 bg-stone-800 rounded-lg px-3 py-2 outline-none resize-none whitespace-pre-wrap"
    />
  );
}
