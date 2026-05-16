import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
  MessageFlags,
} from "discord.js";
import { getItemBySlug, setLimit } from "../../db/queries/items.js";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub
    .setName("set-limit")
    .setDescription("Ustaw globalny limit dla przedmiotu")
    .addStringOption((opt) =>
      opt
        .setName("slug")
        .setDescription("Slug przedmiotu")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("quantity")
        .setDescription("Nowy limit (0 = brak limitu)")
        .setRequired(true)
        .setMinValue(0)
    );

export async function handle(interaction: ChatInputCommandInteraction): Promise<void> {
  const slug = interaction.options.getString("slug", true);
  const quantity = interaction.options.getInteger("quantity", true);

  const item = await getItemBySlug(slug);
  if (!item) {
    await interaction.reply({
      content: `Przedmiot "${slug}" nie istnieje.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await setLimit(slug, quantity);
  await interaction.reply({
    content:
      quantity === 0
        ? `${item.emoji ?? ""} **${item.displayName}**: limit usuniety (bez limitu).`
        : `${item.emoji ?? ""} **${item.displayName}**: nowy limit = ${quantity} ${item.unit}.`,
    flags: MessageFlags.Ephemeral,
  });
}
