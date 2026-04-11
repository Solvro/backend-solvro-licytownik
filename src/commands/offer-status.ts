import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../types/command.js";
import { config } from "../config.js";
import { getOfferByThreadId } from "../db/queries/offers.js";
import { buildSummaryEmbed } from "../utils/embeds.js";

export const offerStatusCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("offer-status")
    .setDescription("Pokaz aktualna oferte dla tej licytacji"),

  async execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.channel;
    if (
      !channel ||
      !channel.isThread() ||
      channel.parentId !== config.FORUM_CHANNEL_ID
    ) {
      await interaction.reply({
        content: "Ta komenda dziala tylko w watkach na kanale licytacji.",
        ephemeral: true,
      });
      return;
    }

    const offer = await getOfferByThreadId(channel.id);
    if (!offer) {
      await interaction.reply({
        content: "Nie znaleziono oferty dla tego watku.",
        ephemeral: true,
      });
      return;
    }

    const embed = await buildSummaryEmbed(offer.id, offer.title);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
