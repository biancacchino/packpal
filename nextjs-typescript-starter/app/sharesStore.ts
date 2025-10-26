// Simple in-memory store for sharing access to trips.
// This is module-scoped and will reset on server restart in dev.

export type AccessLevel = 'view' | 'suggest' | 'edit';

export type Share = {
  id: string; // unique id
  friendId: string; // matches FriendsPanel sample id like 'f1'
  tripId: string; // matches TripCarousel sample id like '1'
  access: AccessLevel;
  createdAt: number;
};

let shares: Share[] = [];

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

export function addShare(input: Omit<Share, 'id' | 'createdAt'>): Share {
  // Update if already shared to same friend+trip, else insert
  const existing = shares.find(
    (s) => s.friendId === input.friendId && s.tripId === input.tripId
  );
  if (existing) {
    existing.access = input.access;
    return existing;
  }
  const toAdd: Share = {
    id: randomId(),
    createdAt: Date.now(),
    ...input,
  };
  shares.push(toAdd);
  return toAdd;
}

export function listShares(filter?: Partial<Pick<Share, 'friendId' | 'tripId'>>): Share[] {
  if (!filter) return [...shares];
  return shares.filter((s) => {
    if (filter.friendId && s.friendId !== filter.friendId) return false;
    if (filter.tripId && s.tripId !== filter.tripId) return false;
    return true;
  });
}

export function clearShares() {
  shares = [];
}

export function removeShare(friendId: string, tripId: string): boolean {
  const before = shares.length;
  shares = shares.filter((s) => !(s.friendId === friendId && s.tripId === tripId));
  return shares.length !== before;
}
