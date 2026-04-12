import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../types/command.js";
import { config } from "../config.js";
import { getUserOfferIds, getLastBidder } from "../db/queries/bids.js";

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
    for (const offer of userOffers) {
      const lastBidder = await getLastBidder(offer.offerId);
      const isWinner = lastBidder?.userId === userId;
      const status = isWinner ? "**Wygrywasz**" : "Przebity/a";
      const link = `https://discord.com/channels/${config.GUILD_ID}/${offer.forumPostId}`;
      lines.push(`${isWinner ? "🏆" : "❌"} [${offer.title}](${link}) — ${status}`);
    }

    const embed = new EmbedBuilder()
      .setTitle("Twoje licytacje")
      .setColor(0x5865f2)
      .setDescription(lines.join("\n"))
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
