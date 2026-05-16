import { config } from "../config.js";
import type * as sqliteSchema from "./schema.sqlite.js";

// Re-export the appropriate schema based on database type.
// Both schemas define identical table structures with the same column names,
// so query code works unchanged regardless of dialect. We statically type the
// re-exports as the SQLite schema (the default backend); the postgres branch
// is structurally compatible at runtime.

const isPostgres = !!config.DATABASE_URL;

const schema = (isPostgres
  ? await import("./schema.pg.js")
  : await import("./schema.sqlite.js")) as unknown as typeof sqliteSchema;

export const items = schema.items;
export const offers = schema.offers;
export const bids = schema.bids;
export const settings = schema.settings;
