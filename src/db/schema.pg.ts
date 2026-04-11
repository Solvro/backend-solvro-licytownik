import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  emoji: text("emoji"),
  unit: text("unit").notNull(),
  maxQuantity: integer("max_quantity").notNull().default(0),
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  forumPostId: text("forum_post_id").notNull().unique(),
  channelId: text("channel_id").notNull(),
  title: text("title").notNull(),
  status: text("status", { enum: ["open", "closed"] }).notNull().default("open"),
  summaryMessageId: text("summary_message_id"),
  createdAt: integer("created_at").notNull(),
});

export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id")
    .notNull()
    .references(() => offers.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  itemId: integer("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: integer("created_at").notNull(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
