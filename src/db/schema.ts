import { config } from "../config.js";

// Re-export the appropriate schema based on database type.
// Both schemas define identical table structures with the same column names,
// so query code works unchanged regardless of dialect.

const isPostgres = !!config.DATABASE_URL;

const schema = isPostgres
  ? await import("./schema.pg.js")
  : await import("./schema.sqlite.js");

export const items = schema.items;
export const offers = schema.offers;
export const bids = schema.bids;
export const settings = schema.settings;
