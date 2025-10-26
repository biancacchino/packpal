import { NextResponse } from "next/server";
// Ensure Node.js runtime for stable fetch/HTTP behavior
export const runtime = "nodejs";

// Robust server-only Gemini call that avoids 404s by discovering available models
// for this API key/project using the ListModels endpoint and then attempting
// generateContent with preferred models first.
// Prefer latest/GA variants first, then non-latest fallbacks
const PREFERRED_MODELS_ORDER = [
  // Gemini 2.0
  "gemini-2.0-pro-exp",
  "gemini-2.0-flash-exp",
  "gemini-2.0-pro",
  "gemini-2.0-flash",
  // Gemini 1.5 (latest aliases, then base ids)
  "gemini-1.5-pro-latest",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  // Legacy
  "gemini-pro",
] as const;

type ModelInfo = { id: string; supportsGenerate: boolean };
let modelCache: { at: number; models: ModelInfo[] } | null = null;

async function listModels(apiKey: string): Promise<ModelInfo[]> {
  // Cache for 5 minutes
  const now = Date.now();
  if (modelCache && now - modelCache.at < 5 * 60 * 1000) return modelCache.models;

  const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
  let resp: Response;
  try {
    resp = await fetch(url, { method: "GET" });
  } catch (e) {
    // Network error: return empty so callers can fall back to defaults
    return [];
  }
  if (!resp.ok) {
    // Authorization/permission issues are common; return empty to allow fallbacks
    return [];
  }
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

type GLContent = { role: "user" | "model"; parts: Array<{ text: string }> };

async function tryGenerate({ apiKey, contents, model }: { apiKey: string; contents: GLContent[]; model: string }) {
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
  const body = { contents };

  try {
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
  } catch (err: any) {
    // Network or fetch-level error
    return { ok: false, status: 0, payload: { error: { message: String(err?.message || "network error") } }, statusText: "NETWORK_ERROR", model } as any;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt: string | undefined = body?.prompt;
    const messages: Array<{ role: string; content: string }> | undefined = body?.messages;
    const tripContext: { destination?: string; start?: string; end?: string } | undefined = body?.tripContext;
    if ((!prompt || typeof prompt !== "string") && !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing prompt or messages[]" }, { status: 400 });
    }

    // Basic input limits to prevent overloading the LLM
    const MAX_INPUT_CHARS = 2000;
    const MAX_TOTAL_CHARS = 10000;
    if (typeof prompt === "string" && prompt.length > MAX_INPUT_CHARS) {
      return NextResponse.json({ error: `Input too long. Please keep prompts under ${MAX_INPUT_CHARS} characters.` }, { status: 413 });
    }
    if (Array.isArray(messages)) {
      const lastUser = [...messages].reverse().find(m => (m.role || "user") !== "assistant");
      const lastLen = lastUser?.content?.length || 0;
      if (lastLen > MAX_INPUT_CHARS) {
        return NextResponse.json({ error: `Input too long. Please keep prompts under ${MAX_INPUT_CHARS} characters.` }, { status: 413 });
      }
      const totalLen = messages.reduce((sum, m) => sum + (m?.content?.length || 0), 0);
      if (totalLen > MAX_TOTAL_CHARS) {
        return NextResponse.json({ error: `Conversation too long. Please clear or reset chat and try a shorter prompt.` }, { status: 413 });
      }
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server missing GOOGLE_API_KEY" }, { status: 500 });
    }

    // Build contents from messages or single prompt
    const systemPrimer =
      "You are Packpal, a helpful packing assistant. Always reply in plain text (no markdown). " +
      "Ask concise follow-up questions if key trip details are missing (e.g., activities: active vs relaxing, lodging). Do not ask about weather; use provided weather context if present. " +
      "When the user asks for a packing list, format it as easy-to-scan plain text sections with blank lines between them. Use these section headers: Essentials:, Clothing:, Toiletries:, Tech:, Documents:, Health:, Optional:. " +
      "Under each section, list items on separate lines starting with '- '. Where helpful, include short notes or quantities (e.g., '- Light jacket — evenings ~12–15°C'). Keep line lengths short. " +
      "After presenting a packing list, end with one short question asking whether to add it to an existing trip or create a new trip. " +
      "Keep responses readable with short sentences and simple line breaks.";

    const contents: GLContent[] = [];
    contents.push({ role: "user", parts: [{ text: systemPrimer }] });

    // Optionally enrich with weather context from OpenWeather if trip context present
    const owKey = process.env.OPENWEATHER_API_KEY;
    if (owKey && tripContext?.destination && tripContext?.start && tripContext?.end) {
      const summary = await buildWeatherSummary(owKey, tripContext.destination, tripContext.start, tripContext.end);
      if (summary) {
        contents.push({ role: "user", parts: [{ text: `Weather context for ${tripContext.destination} (${tripContext.start} to ${tripContext.end}):\n${summary}` }] });
      }
    }

    if (Array.isArray(messages)) {
      // Map client roles to Gemini roles and cap history length for token safety
      const recent = messages.slice(-12);
      for (const m of recent) {
        const role = m.role === "assistant" ? "model" : "user";
        contents.push({ role, parts: [{ text: String(m.content || "") }] });
      }
    } else if (typeof prompt === "string") {
      contents.push({ role: "user", parts: [{ text: prompt }] });
    }

    // Discover available models for this key/project
    const available = (await listModels(apiKey)).filter(m => m.supportsGenerate);
    // Build an ordered list: preferred first, then the rest
    let ordered: string[] = [];
    for (const p of PREFERRED_MODELS_ORDER) {
      const hit = available.find(m => m.id === p);
      if (hit) ordered.push(hit.id);
    }
    for (const m of available) {
      if (!ordered.includes(m.id)) ordered.push(m.id);
    }
    // If discovery failed or returned nothing, fall back to a safe static list
    if (ordered.length === 0) {
      ordered = [
        "gemini-2.0-pro",
        "gemini-2.0-flash",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
        "gemini-pro",
      ];
    }

    // Try models in order; never surface a 404. Be resilient to transient errors.
    let finalErr: { status?: number; message?: string } | null = null;
    for (const m of ordered) {
      const res = await tryGenerate({ apiKey, contents, model: m });
      if (res.ok) {
        // Extract best-effort text
        const parts = res.payload?.candidates?.[0]?.content?.parts;
        const text = Array.isArray(parts)
          ? parts.map((p: any) => p?.text).filter(Boolean).join("\n\n")
          : res.payload?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        return NextResponse.json({ text });
      }

      const status = res.status;
      const msg: string = res.payload?.error?.message || res.statusText || "request failed";

      // If key is invalid or project unauthorized, bail immediately
      if (status === 401 || status === 403) {
        return NextResponse.json({ error: msg || "Unauthorized" }, { status });
      }

      // Continue on 404/unsupported model
      if (status === 404 || /not\s*found|unsupported/i.test(msg)) {
        finalErr = { status, message: msg };
        continue;
      }

      // Continue on rate limits and server/transient errors
      if (status === 0 || status === 408 || status === 409 || status === 425 || status === 429 || (status >= 500 && status <= 599)) {
        finalErr = { status, message: msg };
        continue;
      }

      // Some safety blocks come as 400 — try the next model
      if (status === 400 && /safety|blocked/i.test(msg)) {
        finalErr = { status, message: msg };
        continue;
      }

      // Default: keep trying remaining models, but remember the latest error
      finalErr = { status, message: msg };
    }

    const statusOut = finalErr?.status && finalErr.status !== 404 ? finalErr.status : 502;
    return NextResponse.json({ error: finalErr?.message || "AI service unavailable" }, { status: statusOut });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

// Build a concise weather summary using OpenWeather's Geocoding + 5-day 3-hour forecast API.
async function buildWeatherSummary(apiKey: string, destination: string, startISO: string, endISO: string): Promise<string | null> {
  try {
    const geoURL = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(destination)}&limit=1&appid=${apiKey}`;
    const geoRes = await fetch(geoURL);
    if (!geoRes.ok) return null;
    const geo = await geoRes.json();
    if (!Array.isArray(geo) || geo.length === 0) return null;
    const { lat, lon } = geo[0] as { lat: number; lon: number };

    const fcURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const fcRes = await fetch(fcURL);
    if (!fcRes.ok) return null;
    const data = await fcRes.json();
    const list: any[] = Array.isArray(data?.list) ? data.list : [];
    if (list.length === 0) return null;

    const start = new Date(startISO);
    const end = new Date(endISO);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

    const byDay: Record<string, { min: number; max: number; descCounts: Record<string, number> }> = {};
    for (const item of list) {
      const dt: number = (item?.dt || 0) * 1000;
      const t = new Date(dt);
      if (t < start || t > end) continue;
      const d = t.toISOString().slice(0, 10);
      const temp: number = Number(item?.main?.temp);
      const desc: string = String(item?.weather?.[0]?.description || "");
      if (!byDay[d]) byDay[d] = { min: temp, max: temp, descCounts: {} };
      byDay[d].min = Math.min(byDay[d].min, temp);
      byDay[d].max = Math.max(byDay[d].max, temp);
      byDay[d].descCounts[desc] = (byDay[d].descCounts[desc] || 0) + 1;
    }

    const days = Object.keys(byDay).sort();
    if (days.length === 0) {
      // Out of forecast horizon; provide a generic hint
      return `Forecast not available for the selected dates (outside 5-day window). Use typical seasonal expectations for guidance.`;
    }

    const lines: string[] = days.map((d) => {
      const rec = byDay[d];
      const common = Object.entries(rec.descCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
      return `${d}: ${Math.round(rec.min)}–${Math.round(rec.max)}°C, ${common}`;
    });
    return lines.join("\n");
  } catch {
    return null;
  }
}
