import { DEFAULT_ITEMS } from "../constants/items.js";
import { getAllItems, addItem } from "./queries/items.js";

export async function seedItems() {
  const existing = await getAllItems();
  const existingSlugs = new Set(existing.map((i) => i.slug));

  for (const item of DEFAULT_ITEMS) {
    if (!existingSlugs.has(item.slug)) {
      await addItem(item.slug, item.displayName, item.emoji, item.unit, item.maxQuantity);
    }
  }
  console.log("Items seeded successfully.");
}
