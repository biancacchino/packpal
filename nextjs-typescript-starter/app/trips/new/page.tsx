"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTripPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ensure PiP chat is visible when arriving here from the chat
    try { localStorage.setItem("packpal_chat_pip", "open"); } catch {}
    // Hydrate any draft
    try {
      const raw = localStorage.getItem("packpal_trip_draft");
      if (raw) {
        const d = JSON.parse(raw);
        setName(d?.name || "");
        setDestination(d?.destination || "");
        setStart(d?.start || "");
        setEnd(d?.end || "");
      }
    } catch {}
  }, []);

  useEffect(() => {
    // Persist a lightweight draft so the chat can read dates/destination
    try {
      localStorage.setItem(
        "packpal_trip_draft",
        JSON.stringify({ name, destination, start, end })
      );
    } catch {}
  }, [name, destination, start, end]);

  async function save() {
    const n = name.trim();
    if (!n || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Failed to save trip");
        setSaving(false);
        return;
      }
      // Optionally clear draft after saving
      try { localStorage.removeItem("packpal_trip_draft"); } catch {}
      // Go to dashboard so it's visible in the list/carousel
      router.push("/dashboard");
    } catch (e) {
      setError("Network error");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">Create a New Trip</h1>
        <form className="space-y-4">
          <div>
            <label className="block text-sm text-stone-300 mb-1">Trip name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-stone-800 rounded-lg px-3 py-2 outline-none" placeholder="e.g., Cancun Weekend" />
          </div>
          <div>
            <label className="block text-sm text-stone-300 mb-1">Destination</label>
            <input value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full bg-stone-800 rounded-lg px-3 py-2 outline-none" placeholder="City, Country" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-stone-300 mb-1">Start date</label>
              <input value={start} onChange={(e) => setStart(e.target.value)} type="date" className="w-full bg-stone-800 rounded-lg px-3 py-2 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-stone-300 mb-1">End date</label>
              <input value={end} onChange={(e) => setEnd(e.target.value)} type="date" className="w-full bg-stone-800 rounded-lg px-3 py-2 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-stone-300 mb-1">Notes (optional)</label>
            <textarea className="w-full bg-stone-800 rounded-lg px-3 py-2 outline-none" rows={4} placeholder="Anything special to remember" />
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={save} disabled={!name.trim() || saving} className="px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
            <a href="/trips" className="px-4 py-2 rounded-lg bg-stone-700 text-stone-100 hover:bg-stone-600">Cancel</a>
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
        </form>
      </div>
    </div>
  );
}
