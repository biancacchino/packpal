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
  users: Map<string, { id: number; email: string; password?: string; emailVerified?: Date | null; verificationToken?: string | null }>;
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
    return [{ id: u.id, email: u.email, password: u.password, emailVerified: u.emailVerified }];
  }

  const users = await ensureTableExists();
  return await db!.select().from(users).where(eq(users.email, email));
}

export async function createUser(email: string, password: string) {
  ensureClient();
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);
  const token = Math.random().toString(36).substring(2, 15); // Simple token

  if (useMemory) {
    const id = memoryStore.nextId++;
    memoryStore.users.set(email, { id, email, password: hash, emailVerified: null, verificationToken: token });
    return { id, email, password: hash, verificationToken: token };
  }

  const users = await ensureTableExists();
  // Note: In a real app, we'd return the token to send via email
  await db!.insert(users).values({ email, password: hash, emailVerified: null, verificationToken: token });
  return { email, verificationToken: token };
}

export async function verifyUser(token: string) {
  ensureClient();
  if (useMemory) {
    for (const [email, user] of memoryStore.users.entries()) {
      if (user.verificationToken === token) {
        user.emailVerified = new Date();
        user.verificationToken = null; // Consume token
        return true;
      }
    }
    return false;
  }

  const users = await ensureTableExists();
  // This is a simplification. Drizzle doesn't have a simple "update where" without fetching first or using specific driver syntax in this setup.
  // For this "hybrid" db.ts, we might need raw SQL or a more robust query.
  // Let's try raw SQL for the update to be safe with the 'postgres' driver.
  if (client) {
    const result = await client`
      UPDATE "User" 
      SET "emailVerified" = NOW(), "verificationToken" = NULL 
      WHERE "verificationToken" = ${token}
      RETURNING id
    `;
    return result.length > 0;
  }
  return false;
}

export async function createGoogleUser(email: string) {
  ensureClient();
  if (useMemory) {
    if (memoryStore.users.has(email)) {
        const u = memoryStore.users.get(email)!;
        u.emailVerified = new Date(); // Ensure verified
        return u;
    }
    const id = memoryStore.nextId++;
    const u = { id, email, password: '', emailVerified: new Date(), verificationToken: null };
    memoryStore.users.set(email, u);
    return u;
  }

  const users = await ensureTableExists();
  // Check if exists
  const existing = await db!.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
      // Ensure verified
      if (client) {
          await client`UPDATE "User" SET "emailVerified" = NOW() WHERE email = ${email}`;
      }
      return existing[0];
  }
  
  // Create
  await db!.insert(users).values({ email, password: '', emailVerified: new Date(), verificationToken: null });
  return { email };
}

async function ensureTableExists() {
  // In DB mode only
  if (useMemory) {
    // return a simple table descriptor compatible with Drizzle usage
    const table = pgTable('User', {
      id: serial('id').primaryKey(),
      email: varchar('email', { length: 64 }),
      password: varchar('password', { length: 64 }),
      emailVerified: varchar('emailVerified', { length: 64 }), // Storing date as string/varchar for simplicity in this hybrid setup or use timestamp
      verificationToken: varchar('verificationToken', { length: 64 }),
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
        password VARCHAR(64),
        "emailVerified" TIMESTAMP,
        "verificationToken" VARCHAR(64)
      );`;
  } else {
      // Migration: Check if columns exist, if not add them (simple migration for dev)
      try {
        await client!`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP`;
        await client!`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationToken" VARCHAR(64)`;
      } catch (e) {
          // ignore if exists
      }
  }

  const table = pgTable('User', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 64 }),
    password: varchar('password', { length: 64 }),
    emailVerified: varchar('emailVerified', { length: 64 }), // Drizzle definition
    verificationToken: varchar('verificationToken', { length: 64 }),
  });

  return table;
}
