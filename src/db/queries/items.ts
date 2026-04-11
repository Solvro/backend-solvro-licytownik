import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { items } from "../schema.js";
import type { ItemRow } from "../types.js";

export async function getAllItems(): Promise<ItemRow[]> {
  return await db.select().from(items);
}

export async function getItemBySlug(slug: string): Promise<ItemRow | undefined> {
  const rows = await db.select().from(items).where(eq(items.slug, slug));
  return rows[0];
}

export async function getItemById(id: number): Promise<ItemRow | undefined> {
  const rows = await db.select().from(items).where(eq(items.id, id));
  return rows[0];
}

export async function addItem(slug: string, displayName: string, emoji: string, unit: string, maxQuantity: number): Promise<ItemRow> {
  const rows = await db
    .insert(items)
    .values({ slug, displayName, emoji, unit, maxQuantity })
    .returning();
  return rows[0];
}

export async function setLimit(slug: string, maxQuantity: number) {
  await db.update(items).set({ maxQuantity }).where(eq(items.slug, slug));
}

export async function removeItem(slug: string) {
  await db.delete(items).where(eq(items.slug, slug));
}
