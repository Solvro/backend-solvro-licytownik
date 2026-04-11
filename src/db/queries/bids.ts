import { eq, sql } from "drizzle-orm";
import { db } from "../index.js";
import { bids, items } from "../schema.js";
import type { BidRow } from "../types.js";

export async function insertBid(
  offerId: number,
  userId: string,
  userName: string,
  itemId: number,
  quantity: number
): Promise<BidRow> {
  const rows = await db
    .insert(bids)
    .values({
      offerId,
      userId,
      userName,
      itemId,
      quantity,
      createdAt: Math.floor(Date.now() / 1000),
    })
    .returning();
  return rows[0];
}

export async function getAggregateBids(offerId: number) {
  return await db
    .select({
      itemId: bids.itemId,
      slug: items.slug,
      displayName: items.displayName,
      emoji: items.emoji,
      unit: items.unit,
      totalQuantity: sql<number>`SUM(${bids.quantity})`.as("total_quantity"),
    })
    .from(bids)
    .innerJoin(items, eq(bids.itemId, items.id))
    .where(eq(bids.offerId, offerId))
    .groupBy(bids.itemId, items.slug, items.displayName, items.emoji, items.unit);
}

export async function getRecentBids(offerId: number, limit = 10) {
  return await db
    .select({
      userName: bids.userName,
      quantity: bids.quantity,
      displayName: items.displayName,
      emoji: items.emoji,
      unit: items.unit,
      createdAt: bids.createdAt,
    })
    .from(bids)
    .innerJoin(items, eq(bids.itemId, items.id))
    .where(eq(bids.offerId, offerId))
    .orderBy(sql`${bids.createdAt} DESC`)
    .limit(limit);
}

export async function getLastBidder(offerId: number) {
  const rows = await db
    .select({
      userId: bids.userId,
      userName: bids.userName,
    })
    .from(bids)
    .where(eq(bids.offerId, offerId))
    .orderBy(sql`${bids.createdAt} DESC`)
    .limit(1);
  return rows[0] as { userId: string; userName: string } | undefined;
}

export async function getGlobalUsage(itemId: number): Promise<number> {
  const rows = await db
    .select({
      total: sql<number>`COALESCE(SUM(${bids.quantity}), 0)`.as("total"),
    })
    .from(bids)
    .where(eq(bids.itemId, itemId));
  return rows[0]?.total ?? 0;
}

export async function getGlobalUsageAll() {
  return await db
    .select({
      itemId: bids.itemId,
      total: sql<number>`COALESCE(SUM(${bids.quantity}), 0)`.as("total"),
    })
    .from(bids)
    .groupBy(bids.itemId);
}

export async function deleteBidsByItemId(itemId: number) {
  await db.delete(bids).where(eq(bids.itemId, itemId));
}

export async function getOfferIdsWithItem(itemId: number) {
  return await db
    .selectDistinct({ offerId: bids.offerId })
    .from(bids)
    .where(eq(bids.itemId, itemId));
}
