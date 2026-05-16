import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
  MessageFlags,
} from "discord.js";
import { getOfferByThreadId, removeOffer } from "../../db/queries/offers.js";
import { requireForumThread } from "../../utils/guards.js";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub.setName("remove-offer").setDescription("Usun oferte i wszystkie licytacje w tym watku");

export async function handle(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = await requireForumThread(interaction);
  if (!channel) return;

  const offer = await getOfferByThreadId(channel.id);
  if (!offer) {
    await interaction.reply({ content: "Nie znaleziono oferty.", flags: MessageFlags.Ephemeral });
    return;
  }

  if (offer.summaryMessageId) {
    try {
      const msg = await channel.messages.fetch(offer.summaryMessageId);
      await msg.delete();
    } catch {
      // not critical
    }
  }

  await removeOffer(offer.id);
  await interaction.reply({ content: "Oferta i wszystkie licytacje zostaly **usuniete**.", flags: MessageFlags.Ephemeral });
}
