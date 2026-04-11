import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { settings } from "../schema.js";

export async function getSetting(key: string): Promise<string | undefined> {
  const rows = await db.select().from(settings).where(eq(settings.key, key));
  return rows[0]?.value;
}

export async function setSetting(key: string, value: string) {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

export async function isBiddingEnabled(): Promise<boolean> {
  const value = await getSetting("bidding_enabled");
  return value !== "false";
}
