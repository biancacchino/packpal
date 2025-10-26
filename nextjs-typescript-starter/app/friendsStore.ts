// Simple in-memory friends store for demo.
export type Friend = { id: string; name: string };

let friends: Friend[] = [
  { id: "f1", name: "Alex" },
  { id: "f2", name: "Sam" },
  { id: "f3", name: "Riley" },
];

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

export function listFriends(): Friend[] {
  return [...friends];
}

export function addFriend(name: string): Friend {
  const clean = name.trim();
  if (!clean) throw new Error("name required");
  const exists = friends.find((f) => f.name.toLowerCase() === clean.toLowerCase());
  if (exists) return exists;
  const f: Friend = { id: randomId(), name: clean };
  friends.push(f);
  return f;
}
