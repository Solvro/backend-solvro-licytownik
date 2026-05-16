import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
  MessageFlags,
} from "discord.js";
import { getItemBySlug, addItem } from "../../db/queries/items.js";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub
    .setName("add-item")
    .setDescription("Dodaj nowy przedmiot do licytacji")
    .addStringOption((opt) =>
      opt.setName("name").setDescription("Nazwa wyswietlana").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("slug").setDescription("Unikalny identyfikator (np. piwo)").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("emoji").setDescription("Emoji przedmiotu").setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("unit").setDescription("Jednostka (np. sztuka, paczka, litr)").setRequired(false)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("max-quantity")
        .setDescription("Globalny limit (0 = brak limitu)")
        .setRequired(false)
        .setMinValue(0)
    );

export async function handle(interaction: ChatInputCommandInteraction): Promise<void> {
  const name = interaction.options.getString("name", true);
  const slug = interaction.options.getString("slug", true);
  const emoji = interaction.options.getString("emoji") ?? "";
  const unit = interaction.options.getString("unit") ?? "sztuka";
  const maxQuantity = interaction.options.getInteger("max-quantity") ?? 0;

  const existing = await getItemBySlug(slug);
  if (existing) {
    await interaction.reply({
      content: `Przedmiot o slug "${slug}" juz istnieje.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await addItem(slug, name, emoji, unit, maxQuantity);
  await interaction.reply({
    content: `Dodano przedmiot: ${emoji} **${name}** (slug: \`${slug}\`, limit: ${maxQuantity === 0 ? "brak" : maxQuantity} ${unit}).`,
    flags: MessageFlags.Ephemeral,
  });
}
