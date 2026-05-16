import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import type { Command } from "../types/command.js";
import { getOfferByThreadId } from "../db/queries/offers.js";
import { buildSummaryEmbed } from "../utils/embeds.js";
import { requireForumThread } from "../utils/guards.js";

export const offerStatusCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("offer-status")
    .setDescription("Pokaz aktualna oferte dla tej licytacji"),

  async execute(interaction: ChatInputCommandInteraction) {
    const channel = await requireForumThread(interaction);
    if (!channel) return;

    const offer = await getOfferByThreadId(channel.id);
    if (!offer) {
      await interaction.reply({
        content: "Nie znaleziono oferty dla tego watku.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const embed = await buildSummaryEmbed(offer.id, offer.title);
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
