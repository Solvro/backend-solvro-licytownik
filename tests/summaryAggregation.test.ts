import { describe, it, expect } from "vitest";
import {
  aggregateBidsByUser,
  aggregateItemsForWinningUser,
  winnerByOffer,
  type BidWithItem,
  type OfferLite,
} from "../src/utils/aggregate.js";

function bid(partial: Partial<BidWithItem> & { offerId: number; userId: string; itemId: number; createdAt: number }): BidWithItem {
  return {
    offerId: partial.offerId,
    userId: partial.userId,
    userName: partial.userName ?? `user-${partial.userId}`,
    itemId: partial.itemId,
    quantity: partial.quantity ?? 1,
    createdAt: partial.createdAt,
    displayName: partial.displayName ?? `item-${partial.itemId}`,
    emoji: partial.emoji ?? null,
    unit: partial.unit ?? "sztuka",
  };
}

function offer(id: number, title = `offer-${id}`): OfferLite {
  return { id, forumPostId: `thread-${id}`, title };
}

// Bids are expected ordered DESC by createdAt — emulate the query order.
function sortDesc(bids: BidWithItem[]): BidWithItem[] {
  return [...bids].sort((a, b) => b.createdAt - a.createdAt);
}

describe("winnerByOffer", () => {
  it("returns empty map for no bids", () => {
    expect(winnerByOffer([]).size).toBe(0);
  });

  it("picks the latest bidder as winner (DESC ordered input)", () => {
    const bids = sortDesc([
      bid({ offerId: 1, userId: "alice", itemId: 1, createdAt: 100 }),
      bid({ offerId: 1, userId: "bob", itemId: 1, createdAt: 200 }),
    ]);
    const winners = winnerByOffer(bids);
    expect(winners.get(1)?.userId).toBe("bob");
  });
});

describe("aggregateBidsByUser", () => {
  it("returns empty map for empty inputs", () => {
    expect(aggregateBidsByUser([], []).size).toBe(0);
  });

  it("aggregates overlapping items across two offers won by the same user", () => {
    const bids = sortDesc([
      bid({ offerId: 1, userId: "alice", itemId: 10, quantity: 2, createdAt: 100 }),
      bid({ offerId: 1, userId: "alice", itemId: 11, quantity: 3, createdAt: 101 }),
      bid({ offerId: 2, userId: "alice", itemId: 10, quantity: 5, createdAt: 200 }),
      bid({ offerId: 2, userId: "alice", itemId: 12, quantity: 1, createdAt: 201 }),
    ]);
    const result = aggregateBidsByUser(bids, [offer(1), offer(2)]);
    expect(result.size).toBe(1);
    const summary = result.get("alice");
    expect(summary).toBeDefined();
    expect(summary?.wonOffers.map((o) => o.offerId).sort()).toEqual([1, 2]);
    expect(summary?.items.get(10)?.total).toBe(7); // 2 + 5
    expect(summary?.items.get(11)?.total).toBe(3);
    expect(summary?.items.get(12)?.total).toBe(1);
  });

  it("attributes a contested offer to the latest bidder", () => {
    const bids = sortDesc([
      bid({ offerId: 1, userId: "alice", itemId: 10, quantity: 2, createdAt: 100 }),
      bid({ offerId: 1, userId: "bob", itemId: 10, quantity: 4, createdAt: 200 }),
    ]);
    const result = aggregateBidsByUser(bids, [offer(1)]);
    expect(result.size).toBe(1);
    expect(result.get("bob")).toBeDefined();
    // Bob's bid wins; both bid rows on this offer get attributed to the winner.
    // Existing behavior attributes ALL bids on the won offer to the winner.
    expect(result.get("bob")?.items.get(10)?.total).toBe(6);
  });

  it("reflects winner per offer when a user is outbid on one but wins another", () => {
    const bids = sortDesc([
      // Offer 1: alice outbid by bob
      bid({ offerId: 1, userId: "alice", itemId: 10, quantity: 2, createdAt: 100 }),
      bid({ offerId: 1, userId: "bob", itemId: 10, quantity: 3, createdAt: 150 }),
      // Offer 2: alice wins
      bid({ offerId: 2, userId: "alice", itemId: 11, quantity: 7, createdAt: 200 }),
    ]);
    const result = aggregateBidsByUser(bids, [offer(1), offer(2)]);
    expect(result.size).toBe(2);
    expect(result.get("alice")?.wonOffers.map((o) => o.offerId)).toEqual([2]);
    expect(result.get("bob")?.wonOffers.map((o) => o.offerId)).toEqual([1]);
    expect(result.get("alice")?.items.get(11)?.total).toBe(7);
    expect(result.get("alice")?.items.has(10)).toBe(false);
  });

  it("filters by user id when provided", () => {
    const bids = sortDesc([
      bid({ offerId: 1, userId: "alice", itemId: 10, quantity: 2, createdAt: 100 }),
      bid({ offerId: 2, userId: "bob", itemId: 11, quantity: 3, createdAt: 200 }),
    ]);
    const result = aggregateBidsByUser(bids, [offer(1), offer(2)], "alice");
    expect(result.size).toBe(1);
    expect(result.get("alice")).toBeDefined();
    expect(result.get("bob")).toBeUndefined();
  });
});

describe("aggregateItemsForWinningUser", () => {
  it("returns empty map when user wins nothing", () => {
    const bids = sortDesc([
      bid({ offerId: 1, userId: "alice", itemId: 10, quantity: 2, createdAt: 100 }),
      bid({ offerId: 1, userId: "bob", itemId: 10, quantity: 4, createdAt: 200 }),
    ]);
    expect(aggregateItemsForWinningUser(bids, "alice").size).toBe(0);
  });

  it("aggregates items across multiple won offers", () => {
    const bids = sortDesc([
      bid({ offerId: 1, userId: "alice", itemId: 10, quantity: 2, createdAt: 100 }),
      bid({ offerId: 2, userId: "alice", itemId: 10, quantity: 5, createdAt: 200 }),
      bid({ offerId: 2, userId: "alice", itemId: 11, quantity: 1, createdAt: 201 }),
    ]);
    const owned = aggregateItemsForWinningUser(bids, "alice");
    expect(owned.get(10)?.total).toBe(7);
    expect(owned.get(11)?.total).toBe(1);
  });
});
