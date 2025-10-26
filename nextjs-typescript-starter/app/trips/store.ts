import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

export type TripItem = { id: string; text: string; done: boolean; addedBy?: string };
export type Trip = { id: string; name: string; items: TripItem[]; shareToken: string };

type Store = {
  trips: Map<string, Trip>;
  tokens: Map<string, string>; // token -> tripId
};

const g = globalThis as any;
if (!g.__PACKPAL_TRIPS__) {
  g.__PACKPAL_TRIPS__ = { trips: new Map(), tokens: new Map() } as Store;
}
const store: Store = g.__PACKPAL_TRIPS__;

// --- simple file persistence (server-side only) ---
const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'trips.json');

async function loadFromDisk() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const data = JSON.parse(raw) as { trips: Trip[] };
    if (data && Array.isArray(data.trips)) {
      store.trips.clear();
      store.tokens.clear();
      for (const t of data.trips) {
        // basic validation
        const trip: Trip = {
          id: t.id,
          name: t.name,
          shareToken: t.shareToken || randomUUID(),
          items: Array.isArray(t.items) ? t.items.map(i => ({ id: i.id, text: i.text, done: !!i.done, addedBy: i.addedBy })) : [],
        };
        store.trips.set(trip.id, trip);
        store.tokens.set(trip.shareToken, trip.id);
      }
    }
  } catch {}
}

async function persistToDisk() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const payload = JSON.stringify({ trips: Array.from(store.trips.values()) }, null, 2);
    await fs.writeFile(DATA_FILE, payload, 'utf8');
  } catch {}
}

// attempt initial load (best-effort)
void loadFromDisk();

export function listTrips(): Trip[] {
  return Array.from(store.trips.values());
}

export function createTrip(name: string): Trip {
  const id = randomUUID();
  const shareToken = randomUUID();
  const trip: Trip = { id, name, items: [], shareToken };
  store.trips.set(id, trip);
  store.tokens.set(shareToken, id);
  void persistToDisk();
  return trip;
}

export function getTrip(id: string): Trip | null {
  return store.trips.get(id) ?? null;
}

export function resolveToken(token: string): Trip | null {
  const id = store.tokens.get(token);
  if (!id) return null;
  return getTrip(id);
}

export function addItems(tripId: string, texts: string[], addedBy?: string): TripItem[] {
  const t = getTrip(tripId);
  if (!t) throw new Error('Trip not found');
  const created: TripItem[] = [];
  const balanceBrackets = (s: string) => {
    const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
    const openers = Object.keys(pairs);
    const closers = Object.values(pairs);
    let prefix = '';
    let suffix = '';
    for (const [open, close] of Object.entries(pairs)) {
      const openCount = (s.match(new RegExp(`\\${open}`, 'g')) || []).length;
      const closeCount = (s.match(new RegExp(`\\${close}`, 'g')) || []).length;
      if (openCount > closeCount) {
        suffix += close.repeat(openCount - closeCount);
      } else if (closeCount > openCount) {
        prefix = open.repeat(closeCount - openCount) + prefix;
      }
    }
    return prefix + s + suffix;
  };
  const normalize = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[\s.,;:!?)+\]]+$/g, '');

  const seen = new Set<string>(t.items.map((i) => normalize(i.text)));

  for (const text of texts) {
    const clean = balanceBrackets(text.trim());
    if (!clean) continue;
    const key = normalize(clean);
    if (!key || seen.has(key)) continue; // skip duplicates (case/spacing/punctuation-insensitive)
    seen.add(key);
    const item: TripItem = { id: randomUUID(), text: clean, done: false, addedBy };
    t.items.push(item);
    created.push(item);
  }
  if (created.length > 0) void persistToDisk();
  return created;
}

export function toggleItem(tripId: string, itemId: string, done?: boolean): TripItem | null {
  const t = getTrip(tripId);
  if (!t) return null;
  const it = t.items.find(i => i.id === itemId);
  if (!it) return null;
  it.done = done ?? !it.done;
  void persistToDisk();
  return it;
}

export function deleteItem(tripId: string, itemId: string): boolean {
  const t = getTrip(tripId);
  if (!t) return false;
  const idx = t.items.findIndex(i => i.id === itemId);
  if (idx === -1) return false;
  t.items.splice(idx, 1);
  void persistToDisk();
  return true;
}

export function renameTrip(tripId: string, name: string): Trip | null {
  const t = getTrip(tripId);
  if (!t) return null;
  t.name = name.trim();
  void persistToDisk();
  return t;
}

export function updateItemText(tripId: string, itemId: string, text: string): TripItem | null {
  const t = getTrip(tripId);
  if (!t) return null;
  const it = t.items.find(i => i.id === itemId);
  if (!it) return null;
  const balanceBrackets = (s: string) => {
    const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
    let prefix = '';
    let suffix = '';
    for (const [open, close] of Object.entries(pairs)) {
      const openCount = (s.match(new RegExp(`\\${open}`, 'g')) || []).length;
      const closeCount = (s.match(new RegExp(`\\${close}`, 'g')) || []).length;
      if (openCount > closeCount) {
        suffix += close.repeat(openCount - closeCount);
      } else if (closeCount > openCount) {
        prefix = open.repeat(closeCount - openCount) + prefix;
      }
    }
    return prefix + s + suffix;
  };
  const clean = balanceBrackets(text.trim());
  if (!clean) return it; // ignore empty
  it.text = clean;
  void persistToDisk();
  return it;
}

export function deleteTrip(tripId: string): boolean {
  const t = getTrip(tripId);
  if (!t) return false;
  // remove token mapping
  try {
    if (t.shareToken) store.tokens.delete(t.shareToken);
    // also cleanup any stale token->id entries pointing to this id
    for (const [tok, id] of Array.from(store.tokens.entries())) {
      if (id === tripId) store.tokens.delete(tok);
    }
  } catch {}
  const ok = store.trips.delete(tripId);
  if (ok) void persistToDisk();
  return ok;
}
