import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { getAllItems } from "../../db/queries/items.js";
import { getGlobalUsageAll } from "../../db/queries/bids.js";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub
    .setName("view-limits")
    .setDescription("Pokaz limity i zuzycie przedmiotow")
    .addStringOption((opt) =>
      opt
        .setName("slug")
        .setDescription("Slug przedmiotu (puste = wszystkie)")
        .setRequired(false)
        .setAutocomplete(true)
    );

export async function handle(interaction: ChatInputCommandInteraction): Promise<void> {
  const slug = interaction.options.getString("slug");
  const allItems = await getAllItems();
  const globalUsage = await getGlobalUsageAll();
  const usageMap = new Map(globalUsage.map((u: { itemId: number; total: number }) => [u.itemId, u.total]));

  const itemsToShow = slug
    ? allItems.filter((i) => i.slug === slug)
    : allItems;

  if (itemsToShow.length === 0) {
    await interaction.reply({
      content: slug ? `Przedmiot "${slug}" nie istnieje.` : "Brak przedmiotow.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("Limity przedmiotow")
    .setColor(0x5865f2)
    .setTimestamp();

  const lines = itemsToShow.map((item) => {
    const used = usageMap.get(item.id) ?? 0;
    const limit = item.maxQuantity === 0 ? "brak limitu" : `${used}/${item.maxQuantity}`;
    return `${item.emoji ?? ""} **${item.displayName}** — ${limit} ${item.unit}`;
  });

  embed.setDescription(lines.join("\n"));
  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
