import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { offers } from "../schema.js";
import type { OfferRow } from "../types.js";

export async function createOffer(forumPostId: string, channelId: string, title: string): Promise<OfferRow> {
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
