import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  PermissionFlagsBits,
} from "discord.js";
import type { Command } from "../types/command.js";
import { getAllItems } from "../db/queries/items.js";
import * as toggleBidding from "./admin/toggle-bidding.js";
import * as closeOffer from "./admin/close-offer.js";
import * as reopenOffer from "./admin/reopen-offer.js";
import * as removeOffer from "./admin/remove-offer.js";
import * as addItem from "./admin/add-item.js";
import * as removeItem from "./admin/remove-item.js";
import * as setLimitCmd from "./admin/set-limit.js";
import * as viewLimits from "./admin/view-limits.js";
import * as bidsSummary from "./admin/bids-summary.js";
import * as autoClose from "./admin/auto-close.js";
import * as setForumChannel from "./admin/set-forum-channel.js";
import * as exportBids from "./admin/export-bids.js";
import * as resetBids from "./admin/reset-bids.js";

export const adminCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Komendy administracyjne")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(toggleBidding.data)
    .addSubcommand(closeOffer.data)
    .addSubcommand(reopenOffer.data)
    .addSubcommand(removeOffer.data)
    .addSubcommand(addItem.data)
    .addSubcommand(removeItem.data)
    .addSubcommand(setLimitCmd.data)
    .addSubcommand(autoClose.data)
    .addSubcommand(bidsSummary.data)
    .addSubcommand(setForumChannel.data)
    .addSubcommand(exportBids.data)
    .addSubcommand(resetBids.data)
    .addSubcommand(viewLimits.data),

  async autocomplete(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const allItems = await getAllItems();

    const filtered = allItems.filter(
      (item) =>
        item.slug.toLowerCase().includes(focused) ||
        item.displayName.toLowerCase().includes(focused)
    );

    await interaction.respond(
      filtered.slice(0, 25).map((item) => ({
        name: `${item.emoji ?? ""} ${item.displayName}`,
        value: item.slug,
      }))
    );
  },

  async execute(interaction: ChatInputCommandInteraction) {
    const handlers: Record<string, (i: ChatInputCommandInteraction) => Promise<void>> = {
      "toggle-bidding": toggleBidding.handle,
      "close-offer": closeOffer.handle,
      "reopen-offer": reopenOffer.handle,
      "remove-offer": removeOffer.handle,
      "add-item": addItem.handle,
      "remove-item": removeItem.handle,
      "set-limit": setLimitCmd.handle,
      "view-limits": viewLimits.handle,
      "bids-summary": bidsSummary.handle,
      "auto-close": autoClose.handle,
      "set-forum-channel": setForumChannel.handle,
      "export-bids": exportBids.handle,
      "reset-bids": resetBids.handle,
    };
    await handlers[interaction.options.getSubcommand()]?.(interaction);
  },
};
