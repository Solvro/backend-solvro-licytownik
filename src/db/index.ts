import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { config } from "../config.js";
import type * as sqliteSchema from "./schema.sqlite.js";

// The project uses only the structural intersection of the better-sqlite3 and
// postgres-js drizzle APIs (select/insert/update/delete/transaction). Both
// schema modules expose identical table/column names, so the SQLite-typed
// surface is safe for either backend. The postgres branch casts its drizzle()
// result to this type for that reason.
export type Db = BetterSQLite3Database<typeof sqliteSchema>;

export let db: Db;
export let isPostgres: boolean;

if (config.DATABASE_URL) {
  // PostgreSQL via postgres.js
  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const pgSchema = await import("./schema.pg.js");

  const client = postgres(config.DATABASE_URL);
  db = drizzle(client, { schema: pgSchema }) as unknown as Db;
  isPostgres = true;
} else {
  // SQLite via better-sqlite3
  const { default: Database } = await import("better-sqlite3");
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  const sqliteSchemaMod = await import("./schema.sqlite.js");
  const { existsSync, mkdirSync } = await import("fs");

  const DB_PATH = "./data/licytownik.db";
  if (!existsSync("./data")) {
    mkdirSync("./data", { recursive: true });
  }

  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  db = drizzle(sqlite, { schema: sqliteSchemaMod });
  isPostgres = false;
}
