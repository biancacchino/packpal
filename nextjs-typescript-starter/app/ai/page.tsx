"use client";

import { useState } from "react";

export default function AIPlaygroundPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [resolved, setResolved] = useState<{ model?: string; note?: string } | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setAnswer("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || res.statusText);
      setAnswer(data.text || "");
      setResolved({ model: data.model, note: data.note });
    } catch (e: any) {
      setError(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <header>
          <h1 className="text-3xl font-bold">AI Playground</h1>
          <p className="text-stone-300 mt-2">Try a quick Gemini call using your server key.</p>
        </header>

        <div className="bg-stone-800 rounded-xl p-6 space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask Packpal AI about packing suggestions for a 3-day trip to NYC..."
            className="w-full h-32 bg-stone-900 rounded-lg p-4 outline-none"
          />
          <button
            onClick={run}
            disabled={loading || !prompt.trim()}
            className="inline-flex items-center px-5 py-3 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Thinking..." : "Ask Gemini"}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-200 rounded-lg p-4">
            {error}
          </div>
        )}

        {/* Model metadata intentionally hidden per request */}

        {answer && (
          <div className="bg-stone-800 rounded-xl p-6 whitespace-pre-wrap">
            {answer}
          </div>
        )}
      </div>
    </div>
  );
}
