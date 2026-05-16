import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
  MessageFlags,
} from "discord.js";
import { getItemBySlug, removeItem } from "../../db/queries/items.js";
import { getOfferById } from "../../db/queries/offers.js";
import { deleteBidsByItemId, getOfferIdsWithItem } from "../../db/queries/bids.js";
import { updateSummaryMessage } from "../../utils/summary.js";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub
    .setName("remove-item")
    .setDescription("Usun przedmiot i wszystkie powiazane licytacje")
    .addStringOption((opt) =>
      opt
        .setName("slug")
        .setDescription("Slug przedmiotu do usuniecia")
        .setRequired(true)
        .setAutocomplete(true)
    );

export async function handle(interaction: ChatInputCommandInteraction): Promise<void> {
  const slug = interaction.options.getString("slug", true);

  const item = await getItemBySlug(slug);
  if (!item) {
    await interaction.reply({
      content: `Przedmiot "${slug}" nie istnieje.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const affectedOffers = await getOfferIdsWithItem(item.id);

  await deleteBidsByItemId(item.id);
  await removeItem(slug);

  const guild = interaction.guild;
  if (guild) {
    for (const { offerId } of affectedOffers) {
      try {
        const offer = await getOfferById(offerId);
        if (!offer) continue;
        const thread = await guild.channels.fetch(offer.forumPostId);
        if (thread?.isThread()) {
          await updateSummaryMessage(thread, offer);
        }
      } catch {
        // best effort
      }
    }
  }

  await interaction.reply({
    content: `Usunieto przedmiot ${item.emoji ?? ""} **${item.displayName}** i wszystkie powiazane licytacje.`,
    flags: MessageFlags.Ephemeral,
  });
}
