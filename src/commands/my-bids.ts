import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../types/command.js";
import { config } from "../config.js";
import { getUserOfferIds, getLastBidder, getAggregateBids } from "../db/queries/bids.js";

export const myBidsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("my-bids")
    .setDescription("Pokaz oferty w ktorych licytowales"),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;
    const userOffers = await getUserOfferIds(userId);

    if (userOffers.length === 0) {
      await interaction.reply({
        content: "Nie licytowales jeszcze w zadnej ofercie.",
        ephemeral: true,
      });
      return;
    }

    const lines: string[] = [];
    const owned = new Map<
      number,
      { displayName: string; emoji: string | null; unit: string; total: number }
    >();
    for (const offer of userOffers) {
      const lastBidder = await getLastBidder(offer.offerId);
      const isWinner = lastBidder?.userId === userId;
      const status = isWinner ? "**Wygrywasz**" : "Przebity/a";
      const link = `https://discord.com/channels/${config.GUILD_ID}/${offer.forumPostId}`;
      lines.push(`${isWinner ? "🏆" : "❌"} [${offer.title}](${link}) — ${status}`);

      if (isWinner) {
        const agg = await getAggregateBids(offer.offerId);
        for (const row of agg) {
          const existing = owned.get(row.itemId);
          const qty = Number(row.totalQuantity);
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
      }
    }

    const embed = new EmbedBuilder()
      .setTitle("Twoje licytacje")
      .setColor(0x5865f2)
      .setDescription(lines.join("\n"))
      .setTimestamp();

    if (owned.size > 0) {
      const ownedLines = Array.from(owned.values())
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
        .map((i) => `${i.emoji ?? ""} **${i.displayName}**: ${i.total} ${i.unit}`);
      embed.addFields({
        name: "Przedmioty do dostarczenia",
        value: ownedLines.join("\n"),
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
