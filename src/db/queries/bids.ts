import { count, eq, sql } from "drizzle-orm";
import { db } from "../index.js";
import type { Db } from "../index.js";
import { bids, items, offers } from "../schema.js";
import type { BidRow } from "../types.js";

export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

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

export type InsertBidWithLimitResult =
  | { ok: true; bid: BidRow }
  | { ok: false; used: number; remaining: number };

export async function insertBidWithLimitCheck(
  offerId: number,
  userId: string,
  userName: string,
  itemId: number,
  quantity: number,
  maxQuantity: number
): Promise<InsertBidWithLimitResult> {
  return await db.transaction(async (tx: Tx) => {
    if (maxQuantity > 0) {
      const rows = await tx
        .select({
          total: sql<number>`COALESCE(SUM(${bids.quantity}), 0)`.as("total"),
        })
        .from(bids)
        .where(eq(bids.itemId, itemId));
      const used = Number(rows[0]?.total ?? 0);
      const remaining = maxQuantity - used;
      if (quantity > remaining) {
        return { ok: false, used, remaining } as const;
      }
    }
    const inserted = await tx
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
    return { ok: true, bid: inserted[0] as BidRow } as const;
  });
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

export async function getLastBidTime(offerId: number): Promise<number | null> {
  const rows = await db
    .select({ createdAt: bids.createdAt })
    .from(bids)
    .where(eq(bids.offerId, offerId))
    .orderBy(sql`${bids.createdAt} DESC`)
    .limit(1);
  return rows[0]?.createdAt ?? null;
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

export async function deleteAllBids(tx?: Tx): Promise<number> {
  const runner = tx ?? db;
  const rows = await runner.select({ value: count() }).from(bids);
  await runner.delete(bids);
  return rows[0].value;
}

export async function countBids(): Promise<number> {
  const rows = await db.select({ value: count() }).from(bids);
  return rows[0].value;
}

export async function getOfferIdsWithItem(itemId: number) {
  return await db
    .selectDistinct({ offerId: bids.offerId })
    .from(bids)
    .where(eq(bids.itemId, itemId));
}

export async function getAllBidsWithItems() {
  return await db
    .select({
      offerId: bids.offerId,
      userId: bids.userId,
      userName: bids.userName,
      itemId: bids.itemId,
      quantity: bids.quantity,
      createdAt: bids.createdAt,
      displayName: items.displayName,
      emoji: items.emoji,
      unit: items.unit,
    })
    .from(bids)
    .innerJoin(items, eq(bids.itemId, items.id))
    .orderBy(sql`${bids.createdAt} DESC`);
}

export async function getUserOfferIds(userId: string) {
  return await db
    .selectDistinct({
      offerId: bids.offerId,
      forumPostId: offers.forumPostId,
      title: offers.title,
    })
    .from(bids)
    .innerJoin(offers, eq(bids.offerId, offers.id))
    .where(eq(bids.userId, userId));
}
