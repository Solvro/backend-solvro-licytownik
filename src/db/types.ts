export interface ItemRow {
  id: number;
  slug: string;
  displayName: string;
  emoji: string | null;
  unit: string;
  maxQuantity: number;
}

export interface OfferRow {
  id: number;
  forumPostId: string;
  channelId: string;
  title: string;
  status: "open" | "closed";
  summaryMessageId: string | null;
  createdAt: number;
}

export interface BidRow {
  id: number;
  offerId: number;
  userId: string;
  userName: string;
  itemId: number;
  quantity: number;
  createdAt: number;
}

export interface SettingRow {
  key: string;
  value: string;
}
