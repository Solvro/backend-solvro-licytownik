import { count, eq } from "drizzle-orm";
import { db } from "../index.js";
import { offers } from "../schema.js";
import type { OfferRow } from "../types.js";
import type { Tx } from "./bids.js";

export async function createOffer(forumPostId: string, channelId: string, title: string): Promise<OfferRow> {
  try {
    const rows = await db
      .insert(offers)
      .values({
        forumPostId,
        channelId,
        title,
        createdAt: Math.floor(Date.now() / 1000),
      })
      .returning();
    return rows[0];
  } catch (err) {
    // Race: another path (e.g. threadCreate) created this offer concurrently.
    // Both backends throw on the unique forumPostId constraint; recover by
    // returning the existing row.
    const existing = await getOfferByThreadId(forumPostId);
    if (existing) return existing;
    throw err;
  }
}

export async function getOfferByThreadId(forumPostId: string): Promise<OfferRow | undefined> {
  const rows = await db.select().from(offers).where(eq(offers.forumPostId, forumPostId));
  return rows[0];
}

export async function setSummaryMessageId(offerId: number, messageId: string) {
  await db.update(offers).set({ summaryMessageId: messageId }).where(eq(offers.id, offerId));
}

export async function closeOffer(offerId: number) {
  await db.update(offers).set({ status: "closed" }).where(eq(offers.id, offerId));
}

export async function reopenOffer(offerId: number) {
  await db.update(offers).set({ status: "open" }).where(eq(offers.id, offerId));
}

export async function removeOffer(offerId: number) {
  await db.delete(offers).where(eq(offers.id, offerId));
}

export async function getOfferById(offerId: number): Promise<OfferRow | undefined> {
  const rows = await db.select().from(offers).where(eq(offers.id, offerId));
  return rows[0];
}

export async function getAllOffers(): Promise<OfferRow[]> {
  return await db.select().from(offers);
}

export async function getOpenOffers(): Promise<OfferRow[]> {
  return await db.select().from(offers).where(eq(offers.status, "open"));
}

export async function deleteAllOffers(tx?: Tx): Promise<number> {
  const runner = tx ?? db;
  const rows = await runner.select({ value: count() }).from(offers);
  await runner.delete(offers);
  return rows[0].value;
}

export async function countOffers(): Promise<number> {
  const rows = await db.select({ value: count() }).from(offers);
  return rows[0].value;
}
