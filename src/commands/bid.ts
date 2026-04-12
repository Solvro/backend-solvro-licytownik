import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from "discord.js";
import type { Command } from "../types/command.js";
import { config } from "../config.js";
import { getAllItems, getItemBySlug } from "../db/queries/items.js";
import { getGlobalUsage, getLastBidder, insertBid } from "../db/queries/bids.js";
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

    const available: ItemRow[] = [];
    for (const item of allItems) {
      if (item.maxQuantity > 0) {
        const used = await getGlobalUsage(item.id);
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

    if (!(await isBiddingEnabled())) {
      await interaction.reply({
        content: "Licytacja jest obecnie wylaczona.",
        ephemeral: true,
      });
      return;
    }

    const slug = interaction.options.getString("item", true);
    const quantity = interaction.options.getInteger("quantity") ?? 1;

    if (quantity < 1) {
      await interaction.reply({
        content: "Ilosc musi byc >= 1.",
        ephemeral: true,
      });
      return;
    }

    const item = await getItemBySlug(slug);
    if (!item) {
      await interaction.reply({
        content: `Przedmiot "${slug}" nie istnieje.`,
        ephemeral: true,
      });
      return;
    }

    // Check global limit
    if (item.maxQuantity > 0) {
      const used = await getGlobalUsage(item.id);
      const remaining = item.maxQuantity - used;
      if (quantity > remaining) {
        await interaction.reply({
          content:
            remaining <= 0
              ? `${item.emoji ?? ""} **${item.displayName}** osiagnal globalny limit (${item.maxQuantity} ${item.unit}). Wybierz inny przedmiot.`
              : `${item.emoji ?? ""} **${item.displayName}**: mozesz zalicytowac max ${remaining} ${item.unit} (uzyto ${used}/${item.maxQuantity} globalnie).`,
          ephemeral: true,
        });
        return;
      }
    }

    // Lazy-create offer if bot missed threadCreate
    let offer = await getOfferByThreadId(channel.id);
    if (!offer) {
      offer = await createOffer(channel.id, channel.parentId ?? "", channel.name);
    }

    if (offer.status === "closed") {
      await interaction.reply({
        content: "Ta oferta jest zamknieta. Licytacja zakonczona.",
        ephemeral: true,
      });
      return;
    }

    const member = interaction.member;
    const userName =
      (member && "displayName" in member ? member.displayName : null) ??
      interaction.user.displayName ??
      interaction.user.username;
    const previousWinner = await getLastBidder(offer.id);
    await insertBid(offer.id, interaction.user.id, userName, item.id, quantity);

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
