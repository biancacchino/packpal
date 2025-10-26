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

  useEffect(() => {
    setMounted(true);
    try {
      const pip = localStorage.getItem("packpal_chat_pip");
      setOpen(pip === "open");
      const raw = localStorage.getItem("packpal_chat");
      if (raw) setMessages(JSON.parse(raw) as Msg[]);
    } catch {}
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
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, tripContext }),
      });
      const data = await res.json();
      const bot = (data?.text as string) || "";
      setMessages((m) => [...m, { role: "assistant", content: bot }]);
    } catch {}
    setLoading(false);
  }

  if (!mounted) return null;
  // Hide on homepage and the standalone chat page
  if (pathname === "/" || pathname?.startsWith("/ai")) return null;

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
