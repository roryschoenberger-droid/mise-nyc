import { createClient, type Client } from "@libsql/client";
import { env } from "./env";

// Turso (libSQL) client, created once and reused. Storage modules call getDb()
// to read/write. Credentials come from env (TURSO_DATABASE_URL / TURSO_AUTH_TOKEN,
// set in .env.local) — never hard-coded.
let client: Client | null = null;

export function isDbConfigured(): boolean {
  return Boolean(env.TURSO_DATABASE_URL && env.TURSO_AUTH_TOKEN);
}

export function getDb(): Client {
  if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
    throw new Error(
      "Turso isn't configured — set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local.",
    );
  }
  if (!client) {
    client = createClient({
      url: env.TURSO_DATABASE_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

// Create the tables if they don't exist. Cached so it runs once per process;
// every storage call awaits it first, so the schema is always ready.
let schemaReady: Promise<void> | null = null;
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    const db = getDb();
    schemaReady = db
      .batch(
        [
          `CREATE TABLE IF NOT EXISTS challenges (
            id TEXT PRIMARY KEY,
            object TEXT NOT NULL DEFAULT 'challenge',
            source TEXT NOT NULL,
            market TEXT,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            threshold_count INTEGER NOT NULL DEFAULT 0,
            fly_reward_value TEXT NOT NULL DEFAULT '0',
            fly_reward_currency TEXT NOT NULL DEFAULT 'FLY',
            join_fee_fly_wei TEXT NOT NULL DEFAULT '0',
            start_time TEXT NOT NULL DEFAULT '',
            end_time TEXT NOT NULL DEFAULT '',
            terms TEXT NOT NULL DEFAULT '',
            joined_by TEXT NOT NULL DEFAULT '[]',
            restaurant_id TEXT
          )`,
          `CREATE TABLE IF NOT EXISTS suggestions (
            id TEXT PRIMARY KEY,
            restaurant_id TEXT NOT NULL,
            market TEXT NOT NULL DEFAULT '',
            text TEXT NOT NULL,
            created_at TEXT NOT NULL
          )`,
        ],
        "write",
      )
      .then(() => undefined)
      .catch((e) => {
        schemaReady = null; // allow a retry on the next call
        throw e;
      });
  }
  return schemaReady;
}
