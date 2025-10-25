import { drizzle } from 'drizzle-orm/postgres-js';
import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { genSaltSync, hashSync } from 'bcrypt-ts';

// DB client (Postgres) -- we also support a lightweight in-memory
// fallback for local development when POSTGRES_URL is not set.
let client: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle> | null = null;
let useMemory = false;

const memoryStore: {
  users: Map<string, { id: number; email: string; password: string }>;
  nextId: number;
} = { users: new Map(), nextId: 1 };

function ensureClient() {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    // Switch to in-memory fallback for fast local dev.
    useMemory = true;
    return;
  }
  if (!client) {
    client = postgres(`${url}?sslmode=require`);
    db = drizzle(client);
  }
}

export async function getUser(email: string) {
  ensureClient();
  if (useMemory) {
    const u = memoryStore.users.get(email);
    if (!u) return [];
    return [{ id: u.id, email: u.email, password: u.password }];
  }

  const users = await ensureTableExists();
  return await db!.select().from(users).where(eq(users.email, email));
}

export async function createUser(email: string, password: string) {
  ensureClient();
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  if (useMemory) {
    const id = memoryStore.nextId++;
    memoryStore.users.set(email, { id, email, password: hash });
    return { id, email, password: hash };
  }

  const users = await ensureTableExists();
  return await db!.insert(users).values({ email, password: hash });
}

async function ensureTableExists() {
  // In DB mode only
  if (useMemory) {
    // return a simple table descriptor compatible with Drizzle usage
    const table = pgTable('User', {
      id: serial('id').primaryKey(),
      email: varchar('email', { length: 64 }),
      password: varchar('password', { length: 64 }),
    });
    return table;
  }

  if (!client) {
    throw new Error('Postgres client not initialized. Is POSTGRES_URL set?');
  }

  // client is ensured by callers
  const result = await client!`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'User'
    );`;

  if (!result[0].exists) {
    await client!`
      CREATE TABLE "User" (
        id SERIAL PRIMARY KEY,
        email VARCHAR(64),
        password VARCHAR(64)
      );`;
  }

  const table = pgTable('User', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 64 }),
    password: varchar('password', { length: 64 }),
  });

  return table;
}
