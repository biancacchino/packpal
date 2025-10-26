"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SideNavShell from "app/components/SideNavShell";

export default function AIPlaygroundPage() {
  const MAX_INPUT_CHARS = 2000;
  type Msg = { role: "user" | "assistant"; content: string };
  const INITIAL_MESSAGES: Msg[] = [
    { role: "assistant", content: "What would you like to pack? Tell me your trip details if you want me to help." },
  ];
  // Use a stable, SSR-safe initial state to avoid hydration mismatches
  const [messages, setMessages] = useState<Msg[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTripCTAs, setShowTripCTAs] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Existing trip selector state
  const [showExistingPicker, setShowExistingPicker] = useState(false);
  const [trips, setTrips] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    // After mount, try to hydrate from localStorage (client-only)
    try {
      const raw = localStorage.getItem("packpal_chat");
      if (raw) {
        const parsed = JSON.parse(raw) as Msg[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("packpal_chat", JSON.stringify(messages));
    } catch {}
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setLoading(true);
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: text } as Msg];
    setMessages(next);
    setInput("");
    try {
      let tripContext: any = null;
      try {
        const raw = localStorage.getItem("packpal_trip_draft");
        if (raw) tripContext = JSON.parse(raw);
      } catch {}
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, tripContext }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || res.statusText);
      const bot = (data.text as string) || "";
      setMessages((m) => [...m, { role: "assistant", content: bot } as Msg]);
      // If the response looks like a packing list (>=3 bullet lines), show CTAs
      const items = extractBulletItems(bot);
      setGeneratedItems(items);
      setShowTripCTAs(items.length >= 3);
    } catch (e: any) {
      setError(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  function resetChat() {
    setMessages(INITIAL_MESSAGES);
    setInput("");
    setError(null);
    try {
      localStorage.removeItem("packpal_chat");
    } catch {}
  }

  return (
    <SideNavShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
        <header className="pb-2 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">PackPal Chat</h1>
            <p className="text-stone-300 mt-1">Your friendly packing assistant.</p>
          </div>
          <button
            type="button"
            onClick={resetChat}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 rounded-lg border border-stone-600 text-stone-200 hover:bg-stone-800 disabled:opacity-50"
            aria-label="Reset chat"
            title="Reset chat"
          >
            Reset
          </button>
        </header>

        {successMsg && (
          <div className="bg-emerald-900/40 border border-emerald-600 text-emerald-200 rounded-lg p-3">
            {successMsg}
          </div>
        )}

        <div className="flex-1 min-h-[50vh] bg-stone-800 rounded-xl p-4 overflow-y-auto">
          <ul className="space-y-3">
            {messages.map((m, i) => (
              <li key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[80%] whitespace-pre-wrap bg-emerald-500 text-black rounded-lg px-4 py-2"
                      : "max-w-[80%] whitespace-pre-wrap bg-stone-700 text-stone-100 rounded-lg px-4 py-2"
                  }
                >
                  {m.content}
                </div>
              </li>
            ))}
            {loading && (
              <li className="flex justify-start">
                <div className="max-w-[80%] bg-stone-700 text-stone-200 rounded-lg px-4 py-2">Typing…</div>
              </li>
            )}
          </ul>
        </div>

        {showTripCTAs && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 disabled:opacity-50"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setSuccessMsg(null);
                  try {
                    // Load trips then show picker
                    const res = await fetch('/api/trips', { cache: 'no-store' });
                    const data = await res.json();
                    setTrips(Array.isArray(data.trips) ? data.trips : []);
                    setShowExistingPicker(true);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Add to existing trip
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-stone-700 text-stone-100 hover:bg-stone-600 disabled:opacity-50"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setSuccessMsg(null);
                  try {
                    const defaultName = `Trip from Chat ${new Date().toLocaleDateString()}`;
                    const created = await fetch('/api/trips', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: defaultName }),
                    });
                    const data = await created.json();
                    const tripId: string | undefined = data?.trip?.id;
                    if (!tripId) throw new Error('Failed to create trip');
                    let addedCount = 0;
                    let skippedCount = 0;
                    if (generatedItems.length > 0) {
                      const resp = await fetch(`/api/trips/${tripId}/items`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ items: generatedItems, addedBy: 'ai' }),
                      });
                      const d = await resp.json().catch(() => ({} as any));
                      addedCount = typeof d?.added === 'number' ? d.added : (Array.isArray(d?.created) ? d.created.length : 0);
                      skippedCount = typeof d?.skipped === 'number' ? d.skipped : Math.max(generatedItems.length - addedCount, 0);
                    }
                    setShowTripCTAs(false);
                    setSuccessMsg(`Added ${addedCount} items to "${data?.trip?.name || 'New Trip'}".${skippedCount > 0 ? ` (${skippedCount} duplicates skipped)` : ''}`);
                    // Open PiP and navigate user to the new trip
                    try { localStorage.setItem('packpal_chat_pip', 'open'); } catch {}
                    setTimeout(() => router.push(`/trips/${tripId}`), 400);
                  } catch (e: any) {
                    setError(e?.message || 'Failed to create trip');
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Create a new trip
              </button>
            </div>

            {showExistingPicker && (
              <div className="border border-stone-700 rounded-lg p-3 bg-stone-800">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <select
                    className="flex-1 bg-stone-900 border border-stone-700 rounded-md px-3 py-2"
                    value={selectedTripId}
                    onChange={(e) => setSelectedTripId(e.target.value)}
                  >
                    <option value="">Select a trip…</option>
                    {trips.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold disabled:opacity-50"
                    disabled={!selectedTripId || busy}
                    onClick={async () => {
                      if (!selectedTripId) return;
                      setBusy(true);
                      setSuccessMsg(null);
                      try {
                        let addedCount = 0;
                        let skippedCount = 0;
                        if (generatedItems.length > 0) {
                          const resp = await fetch(`/api/trips/${selectedTripId}/items`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ items: generatedItems, addedBy: 'ai' }),
                          });
                          const d = await resp.json().catch(() => ({} as any));
                          addedCount = typeof d?.added === 'number' ? d.added : (Array.isArray(d?.created) ? d.created.length : 0);
                          skippedCount = typeof d?.skipped === 'number' ? d.skipped : Math.max(generatedItems.length - addedCount, 0);
                        }
                        const trip = trips.find(t => t.id === selectedTripId);
                        setShowExistingPicker(false);
                        setShowTripCTAs(false);
                        setSuccessMsg(`Added ${addedCount} items to "${trip?.name || 'Trip'}".${skippedCount > 0 ? ` (${skippedCount} duplicates skipped)` : ''}`);
                        // Open PiP and navigate to the selected trip
                        try { localStorage.setItem('packpal_chat_pip', 'open'); } catch {}
                        setTimeout(() => router.push(`/trips/${selectedTripId}`), 400);
                      } catch (e: any) {
                        setError(e?.message || 'Failed to add items');
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Add items
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-200 rounded-lg p-3">{error}</div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading) void send();
          }}
          className="flex items-center gap-2"
        >
          <AutoGrowTextarea
            value={input}
            onChange={setInput}
            onEnterSubmit={() => { if (!loading && input.trim()) void send(); }}
            maxLength={MAX_INPUT_CHARS}
            placeholder="I’m going to the beach for a weekend…"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center px-4 py-3 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 disabled:opacity-50"
          >
            Send
          </button>
        </form>
        <div className="text-xs text-stone-400">{input.length} / {MAX_INPUT_CHARS} characters</div>
      </div>
    </SideNavShell>
  );
}

// Keep client-side extractor in sync with server-side behavior.
function extractBulletItems(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  const seen = new Set<string>();
  for (let raw of lines) {
    const m = raw.match(/^\s*[-*]\s+(.+)/);
    if (!m) continue;
    let item = m[1].trim();
    item = item.replace(/^['"\-\u2013\u2014\u2015\u2012\u2011\s]+/, "").replace(/[\s.,;:!?)\]]+$/, "");
    const dashSplit = item.split(/\s[\u2013\u2014\-]\s/);
    if (dashSplit[0]) item = dashSplit[0].trim();
    const key = item.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out.length >= 3 ? out : [];
}

function AutoGrowTextarea({
  value,
  onChange,
  onEnterSubmit,
  placeholder,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnterSubmit: () => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const [height, setHeight] = useState<string | number>("auto");
  const [minHeight] = useState<number>(48); // approx. 3rem to match previous input height
  const ref = (node: HTMLTextAreaElement | null) => {
    if (!node) return;
    // set initial height
    node.style.height = "0px";
    const newHeight = Math.max(node.scrollHeight, minHeight);
    node.style.height = newHeight + "px";
    setHeight(newHeight);
  };

  useEffect(() => {
    const el = document.getElementById("packpal-input-area") as HTMLTextAreaElement | null;
    if (!el) return;
    el.style.height = "0px";
    const newHeight = Math.max(el.scrollHeight, minHeight);
    el.style.height = newHeight + "px";
    setHeight(newHeight);
  }, [value, minHeight]);

  return (
    <textarea
      id="packpal-input-area"
      ref={ref}
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
      className="flex-1 bg-stone-800 rounded-lg px-4 py-3 outline-none resize-none whitespace-pre-wrap"
    />
  );
}
