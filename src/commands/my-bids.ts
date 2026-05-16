import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from "discord.js";
import type { Command } from "../types/command.js";
import { config } from "../config.js";
import { getUserOfferIds, getAllBidsWithItems } from "../db/queries/bids.js";
import {
  aggregateItemsForWinningUser,
  winnerByOffer,
  type BidWithItem,
} from "../utils/aggregate.js";

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
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const allBids = (await getAllBidsWithItems()) as BidWithItem[];
    const winners = winnerByOffer(allBids);

    const lines: string[] = [];
    for (const offer of userOffers) {
      const isWinner = winners.get(offer.offerId)?.userId === userId;
      const status = isWinner ? "**Wygrywasz**" : "Przebity/a";
      const link = `https://discord.com/channels/${config.GUILD_ID}/${offer.forumPostId}`;
      lines.push(`${isWinner ? "🏆" : "❌"} [${offer.title}](${link}) — ${status}`);
    }

    const owned = aggregateItemsForWinningUser(allBids, userId);

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

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
