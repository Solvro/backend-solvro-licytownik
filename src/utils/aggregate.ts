export interface BidWithItem {
  offerId: number;
  userId: string;
  userName: string;
  itemId: number;
  quantity: number;
  createdAt: number;
  displayName: string;
  emoji: string | null;
  unit: string;
}

export interface AggregatedItem {
  displayName: string;
  emoji: string | null;
  unit: string;
  total: number;
}

export interface WonOffer {
  offerId: number;
  forumPostId: string;
  title: string;
}

export interface UserSummary {
  userName: string;
  wonOffers: WonOffer[];
  items: Map<number, AggregatedItem>;
}

export interface OfferLite {
  id: number;
  forumPostId: string;
  title: string;
}

/**
 * Determine the winner per offer from a bids list. The bids must be ordered
 * by createdAt DESC (newest first) — the first occurrence of an offerId is
 * the latest bidder, who wins.
 */
export function winnerByOffer(
  bids: BidWithItem[]
): Map<number, { userId: string; userName: string }> {
  const winners = new Map<number, { userId: string; userName: string }>();
  for (const row of bids) {
    if (!winners.has(row.offerId)) {
      winners.set(row.offerId, { userId: row.userId, userName: row.userName });
    }
  }
  return winners;
}

/**
 * Aggregate bids by winning user. For every offer in `offers`, looks up the
 * winning user (latest bidder) and attributes all bid items on that offer to
 * that user.
 *
 * If `filterUserId` is set, only the entry for that user is returned (or an
 * empty map if the user did not win anything).
 */
export function aggregateBidsByUser(
  bids: BidWithItem[],
  offers: OfferLite[],
  filterUserId?: string
): Map<string, UserSummary> {
  const byUser = new Map<string, UserSummary>();
  const winners = winnerByOffer(bids);

  // offerId -> winning userId, but only for offers attributed
  const winnerUserIdByOffer = new Map<number, string>();

  for (const offer of offers) {
    const winner = winners.get(offer.id);
    if (!winner) continue;
    if (filterUserId && winner.userId !== filterUserId) continue;

    let summary = byUser.get(winner.userId);
    if (!summary) {
      summary = { userName: winner.userName, wonOffers: [], items: new Map() };
      byUser.set(winner.userId, summary);
    }
    summary.wonOffers.push({
      offerId: offer.id,
      forumPostId: offer.forumPostId,
      title: offer.title,
    });
    winnerUserIdByOffer.set(offer.id, winner.userId);
  }

  for (const row of bids) {
    const winnerUserId = winnerUserIdByOffer.get(row.offerId);
    if (!winnerUserId) continue;
    const summary = byUser.get(winnerUserId);
    if (!summary) continue;
    const qty = Number(row.quantity);
    const existing = summary.items.get(row.itemId);
    if (existing) {
      existing.total += qty;
    } else {
      summary.items.set(row.itemId, {
        displayName: row.displayName,
        emoji: row.emoji,
        unit: row.unit,
        total: qty,
      });
    }
  }

  return byUser;
}

/**
 * Aggregate the items a single user owes for the offers they are currently
 * winning. Returns a map keyed by itemId.
 */
export function aggregateItemsForWinningUser(
  bids: BidWithItem[],
  userId: string
): Map<number, AggregatedItem> {
  const winners = winnerByOffer(bids);
  const wonOfferIds = new Set<number>();
  for (const [offerId, w] of winners) {
    if (w.userId === userId) wonOfferIds.add(offerId);
  }

  const owned = new Map<number, AggregatedItem>();
  for (const row of bids) {
    if (!wonOfferIds.has(row.offerId)) continue;
    const qty = Number(row.quantity);
    const existing = owned.get(row.itemId);
    if (existing) {
      existing.total += qty;
    } else {
      owned.set(row.itemId, {
        displayName: row.displayName,
        emoji: row.emoji,
        unit: row.unit,
        total: qty,
      });
    }
  }
  return owned;
}
