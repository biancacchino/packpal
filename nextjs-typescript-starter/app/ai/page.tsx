"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
      const bulletLines = bot.split(/\r?\n/).filter((l) => /^[-*]\s+/.test(l)).length;
      setShowTripCTAs(bulletLines >= 3);
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
    <div className="min-h-screen bg-stone-900 text-stone-100">
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400"
              onClick={() => {
                try { localStorage.setItem("packpal_chat_pip", "open"); } catch {}
                router.push("/trips");
              }}
            >
              Add to existing trip
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-stone-700 text-stone-100 hover:bg-stone-600"
              onClick={() => {
                try { localStorage.setItem("packpal_chat_pip", "open"); } catch {}
                router.push("/trips/new");
              }}
            >
              Create a new trip
            </button>
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
    </div>
  );
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
