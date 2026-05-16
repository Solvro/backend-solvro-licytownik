import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
  MessageFlags,
} from "discord.js";
import { getOfferByThreadId, reopenOffer } from "../../db/queries/offers.js";
import { requireForumThread } from "../../utils/guards.js";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub.setName("reopen-offer").setDescription("Otworz ponownie licytacje w tym watku");

export async function handle(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = await requireForumThread(interaction);
  if (!channel) return;

  const offer = await getOfferByThreadId(channel.id);
  if (!offer) {
    await interaction.reply({ content: "Nie znaleziono oferty.", flags: MessageFlags.Ephemeral });
    return;
  }

  await reopenOffer(offer.id);
  await interaction.reply({ content: "Oferta zostala **otwarta** ponownie." });
}
