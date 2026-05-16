import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
  MessageFlags,
} from "discord.js";
import { getOfferByThreadId, closeOffer } from "../../db/queries/offers.js";
import { buildSummaryEmbed } from "../../utils/embeds.js";
import { requireForumThread } from "../../utils/guards.js";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub.setName("close-offer").setDescription("Zamknij licytacje w tym watku");

export async function handle(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = await requireForumThread(interaction);
  if (!channel) return;

  const offer = await getOfferByThreadId(channel.id);
  if (!offer) {
    await interaction.reply({ content: "Nie znaleziono oferty.", flags: MessageFlags.Ephemeral });
    return;
  }

  await closeOffer(offer.id);
  const embed = await buildSummaryEmbed(offer.id, offer.title);
  await interaction.reply({ content: "Oferta zostala **zamknieta**.", embeds: [embed] });
}
