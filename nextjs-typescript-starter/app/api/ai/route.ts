import { NextResponse } from "next/server";

// Robust server-only Gemini call that avoids 404s by discovering available models
// for this API key/project using the ListModels endpoint and then attempting
// generateContent with preferred models first.
const PREFERRED_MODELS_ORDER = [
  "gemini-2.0-pro",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-pro",
] as const;

type ModelInfo = { id: string; supportsGenerate: boolean };
let modelCache: { at: number; models: ModelInfo[] } | null = null;

async function listModels(apiKey: string): Promise<ModelInfo[]> {
  // Cache for 5 minutes
  const now = Date.now();
  if (modelCache && now - modelCache.at < 5 * 60 * 1000) return modelCache.models;

  const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const data = await resp.json();
  const items: any[] = data?.models || [];
  const models: ModelInfo[] = items.map((m: any) => {
    const name: string = m?.name || ""; // e.g., "models/gemini-1.5-flash"
    const id = name.split("/").pop() || name; // extract "gemini-1.5-flash"
    const supportsGenerate = Array.isArray(m?.supportedGenerationMethods)
      ? m.supportedGenerationMethods.includes("generateContent")
      : true; // assume true if field missing
    return { id, supportsGenerate };
  });
  modelCache = { at: now, models };
  return models;
}

async function tryGenerate({ apiKey, prompt, model }: { apiKey: string; prompt: string; model: string }) {
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  };

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let payload: any = null;
  try {
    payload = await r.json();
  } catch {}

  return { ok: r.ok, status: r.status, payload, statusText: r.statusText, model };
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server missing GOOGLE_API_KEY" }, { status: 500 });
    }

    // Discover available models for this key/project
    const available = (await listModels(apiKey)).filter(m => m.supportsGenerate);
    // Build an ordered list: preferred first, then the rest
    const ordered: string[] = [];
    for (const p of PREFERRED_MODELS_ORDER) {
      const hit = available.find(m => m.id === p);
      if (hit) ordered.push(hit.id);
    }
    for (const m of available) {
      if (!ordered.includes(m.id)) ordered.push(m.id);
    }
    if (ordered.length === 0) {
      return NextResponse.json({ error: "No available models support generateContent" }, { status: 502 });
    }

    // Try models in order; never surface a 404.
    let lastErr: { status?: number; message?: string } | null = null;
    for (const m of ordered) {
      const res = await tryGenerate({ apiKey, prompt, model: m });
      if (res.ok) {
        const text = res.payload?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        return NextResponse.json({ text });
      }
      const msg = res.payload?.error?.message || res.statusText;
      if (res.status === 404 || (msg && /not\s*found|unsupported/i.test(String(msg)))) {
        lastErr = { status: res.status, message: msg };
        continue;
      }
      lastErr = { status: res.status, message: msg };
      break;
    }

    const status = lastErr?.status && lastErr.status !== 404 ? lastErr.status : 502;
    return NextResponse.json({ error: lastErr?.message || "AI service unavailable" }, { status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
