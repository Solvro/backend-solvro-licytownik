import { config } from "../config.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let db: any;
export let isPostgres: boolean;

if (config.DATABASE_URL) {
  // PostgreSQL via postgres.js
  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const pgSchema = await import("./schema.pg.js");

  const client = postgres(config.DATABASE_URL);
  db = drizzle(client, { schema: pgSchema });
  isPostgres = true;
} else {
  // SQLite via better-sqlite3
  const { default: Database } = await import("better-sqlite3");
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  const sqliteSchema = await import("./schema.sqlite.js");
  const { existsSync, mkdirSync } = await import("fs");

  const DB_PATH = "./data/licytownik.db";
  if (!existsSync("./data")) {
    mkdirSync("./data", { recursive: true });
  }

  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  db = drizzle(sqlite, { schema: sqliteSchema });
  isPostgres = false;
}
