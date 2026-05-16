import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
  AttachmentBuilder,
  MessageFlags,
} from "discord.js";
import { getAllOffers } from "../../db/queries/offers.js";
import { getAllItems } from "../../db/queries/items.js";
import { getAllBidsWithItems } from "../../db/queries/bids.js";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub.setName("export-bids").setDescription("Wyeksportuj wszystkie licytacje do pliku JSON");

export async function handle(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const [allOffers, allItems, allBids] = await Promise.all([
    getAllOffers(),
    getAllItems(),
    getAllBidsWithItems(),
  ]);

  type BidRowWithItem = {
    offerId: number;
    userId: string;
    userName: string;
    itemId: number;
    quantity: number;
    createdAt: number;
    displayName: string;
    emoji: string | null;
    unit: string;
  };

  const itemSlugById = new Map<number, string>(
    allItems.map((i) => [i.id, i.slug])
  );

  const bidsByOffer = new Map<number, BidRowWithItem[]>();
  for (const b of allBids as BidRowWithItem[]) {
    const arr = bidsByOffer.get(b.offerId) ?? [];
    arr.push(b);
    bidsByOffer.set(b.offerId, arr);
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    offers: allOffers.map((o) => ({
      id: o.id,
      forumPostId: o.forumPostId,
      title: o.title,
      status: o.status,
      createdAt: o.createdAt,
      summaryMessageId: o.summaryMessageId,
      bids: (bidsByOffer.get(o.id) ?? []).map((b) => ({
        userId: b.userId,
        userName: b.userName,
        itemSlug: itemSlugById.get(b.itemId) ?? null,
        itemDisplayName: b.displayName,
        quantity: Number(b.quantity),
        createdAt: b.createdAt,
      })),
    })),
    items: allItems.map((i) => ({
      slug: i.slug,
      displayName: i.displayName,
      emoji: i.emoji,
      unit: i.unit,
      maxQuantity: i.maxQuantity,
    })),
  };

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
  const filename = `licytownik-export-${stamp}.json`;

  const buffer = Buffer.from(JSON.stringify(payload, null, 2), "utf8");
  const attachment = new AttachmentBuilder(buffer, { name: filename });

  await interaction.editReply({
    content: `Eksport gotowy: **${allOffers.length}** ofert, **${(allBids as unknown[]).length}** licytacji, **${allItems.length}** przedmiotow.`,
    files: [attachment],
  });
}
