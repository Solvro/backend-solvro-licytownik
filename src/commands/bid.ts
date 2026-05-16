import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  MessageFlags,
} from "discord.js";
import type { Command } from "../types/command.js";
import { getAllItems, getItemBySlug } from "../db/queries/items.js";
import { requireForumThread } from "../utils/guards.js";
import {
  getGlobalUsageAll,
  getLastBidder,
  insertBidWithLimitCheck,
} from "../db/queries/bids.js";
import { getOfferByThreadId, createOffer } from "../db/queries/offers.js";
import { isBiddingEnabled } from "../db/queries/settings.js";
import { updateSummaryMessage } from "../utils/summary.js";
import type { ItemRow } from "../db/types.js";

export const bidCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("bid")
    .setDescription("Zalicytuj przedmiot na aktualnej ofercie")
    .addStringOption((option) =>
      option
        .setName("item")
        .setDescription("Przedmiot do zalicytowania")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("quantity")
        .setDescription("Ilosc (domyslnie 1)")
        .setRequired(false)
        .setMinValue(1)
    ),

  async autocomplete(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const allItems = await getAllItems();
    const usageRows = await getGlobalUsageAll();
    const usageMap = new Map<number, number>(
      usageRows.map((u: { itemId: number; total: number }) => [u.itemId, Number(u.total)])
    );

    const available: ItemRow[] = [];
    for (const item of allItems) {
      if (item.maxQuantity > 0) {
        const used = usageMap.get(item.id) ?? 0;
        if (used >= item.maxQuantity) continue;
      }
      if (
        item.slug.toLowerCase().includes(focused) ||
        item.displayName.toLowerCase().includes(focused)
      ) {
        available.push(item);
      }
    }

    await interaction.respond(
      available.slice(0, 25).map((item) => ({
        name: `${item.emoji ?? ""} ${item.displayName} (${item.unit})`,
        value: item.slug,
      }))
    );
  },

  async execute(interaction: ChatInputCommandInteraction) {
    const channel = await requireForumThread(interaction);
    if (!channel) return;

    if (!(await isBiddingEnabled())) {
      await interaction.reply({
        content: "Licytacja jest obecnie wylaczona.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const slug = interaction.options.getString("item", true);
    const quantity = interaction.options.getInteger("quantity") ?? 1;

    if (quantity < 1) {
      await interaction.reply({
        content: "Ilosc musi byc >= 1.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const item = await getItemBySlug(slug);
    if (!item) {
      await interaction.reply({
        content: `Przedmiot "${slug}" nie istnieje.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Lazy-create offer if bot missed threadCreate
    let offer = await getOfferByThreadId(channel.id);
    if (!offer) {
      offer = await createOffer(channel.id, channel.parentId ?? "", channel.name);
    }

    if (offer.status === "closed") {
      await interaction.reply({
        content: "Ta oferta jest zamknieta. Licytacja zakonczona.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const member = interaction.member;
    const userName =
      (member && "displayName" in member ? member.displayName : null) ??
      interaction.user.displayName ??
      interaction.user.username;
    const previousWinner = await getLastBidder(offer.id);
    const result = await insertBidWithLimitCheck(
      offer.id,
      interaction.user.id,
      userName,
      item.id,
      quantity,
      item.maxQuantity
    );
    if (!result.ok) {
      const { used, remaining } = result;
      await interaction.reply({
        content:
          remaining <= 0
            ? `${item.emoji ?? ""} **${item.displayName}** osiagnal globalny limit (${item.maxQuantity} ${item.unit}). Wybierz inny przedmiot.`
            : `${item.emoji ?? ""} **${item.displayName}**: mozesz zalicytowac max ${remaining} ${item.unit} (uzyto ${used}/${item.maxQuantity} globalnie).`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    let content = `${item.emoji ?? ""} **${userName}** licytuje +${quantity} ${item.displayName}`;
    if (previousWinner && previousWinner.userId !== interaction.user.id) {
      content += ` przebijajac <@${previousWinner.userId}>!`;
    } else {
      content += `!`;
    }

    await interaction.reply({ content });

    await updateSummaryMessage(channel, offer);
  },
};
