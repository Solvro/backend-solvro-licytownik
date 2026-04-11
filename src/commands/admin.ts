import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import type { Command } from "../types/command.js";
import { config } from "../config.js";
import { setSetting } from "../db/queries/settings.js";
import {
  getOfferByThreadId,
  getOfferById,
  closeOffer,
  reopenOffer,
  removeOffer,
} from "../db/queries/offers.js";
import {
  getAllItems,
  getItemBySlug,
  addItem,
  setLimit,
  removeItem,
} from "../db/queries/items.js";
import {
  getGlobalUsageAll,
  deleteBidsByItemId,
  getOfferIdsWithItem,
} from "../db/queries/bids.js";
import { updateSummaryMessage } from "../utils/summary.js";

export const adminCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Komendy administracyjne")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("toggle-bidding")
        .setDescription("Wlacz/wylacz licytacje globalnie")
        .addBooleanOption((opt) =>
          opt.setName("enabled").setDescription("Czy licytacja wlaczona?").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("close-offer").setDescription("Zamknij licytacje w tym watku")
    )
    .addSubcommand((sub) =>
      sub.setName("reopen-offer").setDescription("Otworz ponownie licytacje w tym watku")
    )
    .addSubcommand((sub) =>
      sub.setName("remove-offer").setDescription("Usun oferte i wszystkie licytacje w tym watku")
    )
    .addSubcommand((sub) =>
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
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove-item")
        .setDescription("Usun przedmiot i wszystkie powiazane licytacje")
        .addStringOption((opt) =>
          opt
            .setName("slug")
            .setDescription("Slug przedmiotu do usuniecia")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((sub) =>
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
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("view-limits")
        .setDescription("Pokaz limity i zuzycie przedmiotow")
        .addStringOption((opt) =>
          opt
            .setName("slug")
            .setDescription("Slug przedmiotu (puste = wszystkie)")
            .setRequired(false)
            .setAutocomplete(true)
        )
    ),

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
    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case "toggle-bidding":
        return handleToggleBidding(interaction);
      case "close-offer":
        return handleCloseOffer(interaction);
      case "reopen-offer":
        return handleReopenOffer(interaction);
      case "remove-offer":
        return handleRemoveOffer(interaction);
      case "add-item":
        return handleAddItem(interaction);
      case "remove-item":
        return handleRemoveItem(interaction);
      case "set-limit":
        return handleSetLimit(interaction);
      case "view-limits":
        return handleViewLimits(interaction);
    }
  },
};

async function handleToggleBidding(interaction: ChatInputCommandInteraction) {
  const enabled = interaction.options.getBoolean("enabled", true);
  await setSetting("bidding_enabled", String(enabled));
  await interaction.reply({
    content: enabled
      ? "Licytacja zostala **wlaczona**."
      : "Licytacja zostala **wylaczona**.",
    ephemeral: true,
  });
}

async function handleCloseOffer(interaction: ChatInputCommandInteraction) {
  const channel = interaction.channel;
  if (!channel?.isThread() || channel.parentId !== config.FORUM_CHANNEL_ID) {
    await interaction.reply({
      content: "Ta komenda dziala tylko w watkach na kanale licytacji.",
      ephemeral: true,
    });
    return;
  }

  const offer = await getOfferByThreadId(channel.id);
  if (!offer) {
    await interaction.reply({ content: "Nie znaleziono oferty.", ephemeral: true });
    return;
  }

  await closeOffer(offer.id);
  await interaction.reply({ content: "Oferta zostala **zamknieta**." });
}

async function handleReopenOffer(interaction: ChatInputCommandInteraction) {
  const channel = interaction.channel;
  if (!channel?.isThread() || channel.parentId !== config.FORUM_CHANNEL_ID) {
    await interaction.reply({
      content: "Ta komenda dziala tylko w watkach na kanale licytacji.",
      ephemeral: true,
    });
    return;
  }

  const offer = await getOfferByThreadId(channel.id);
  if (!offer) {
    await interaction.reply({ content: "Nie znaleziono oferty.", ephemeral: true });
    return;
  }

  await reopenOffer(offer.id);
  await interaction.reply({ content: "Oferta zostala **otwarta** ponownie." });
}

async function handleRemoveOffer(interaction: ChatInputCommandInteraction) {
  const channel = interaction.channel;
  if (!channel?.isThread() || channel.parentId !== config.FORUM_CHANNEL_ID) {
    await interaction.reply({
      content: "Ta komenda dziala tylko w watkach na kanale licytacji.",
      ephemeral: true,
    });
    return;
  }

  const offer = await getOfferByThreadId(channel.id);
  if (!offer) {
    await interaction.reply({ content: "Nie znaleziono oferty.", ephemeral: true });
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
  await interaction.reply({ content: "Oferta i wszystkie licytacje zostaly **usuniete**.", ephemeral: true });
}

async function handleAddItem(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString("name", true);
  const slug = interaction.options.getString("slug", true);
  const emoji = interaction.options.getString("emoji") ?? "";
  const unit = interaction.options.getString("unit") ?? "sztuka";
  const maxQuantity = interaction.options.getInteger("max-quantity") ?? 0;

  const existing = await getItemBySlug(slug);
  if (existing) {
    await interaction.reply({
      content: `Przedmiot o slug "${slug}" juz istnieje.`,
      ephemeral: true,
    });
    return;
  }

  await addItem(slug, name, emoji, unit, maxQuantity);
  await interaction.reply({
    content: `Dodano przedmiot: ${emoji} **${name}** (slug: \`${slug}\`, limit: ${maxQuantity === 0 ? "brak" : maxQuantity} ${unit}).`,
    ephemeral: true,
  });
}

async function handleRemoveItem(interaction: ChatInputCommandInteraction) {
  const slug = interaction.options.getString("slug", true);

  const item = await getItemBySlug(slug);
  if (!item) {
    await interaction.reply({
      content: `Przedmiot "${slug}" nie istnieje.`,
      ephemeral: true,
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
    ephemeral: true,
  });
}

async function handleSetLimit(interaction: ChatInputCommandInteraction) {
  const slug = interaction.options.getString("slug", true);
  const quantity = interaction.options.getInteger("quantity", true);

  const item = await getItemBySlug(slug);
  if (!item) {
    await interaction.reply({
      content: `Przedmiot "${slug}" nie istnieje.`,
      ephemeral: true,
    });
    return;
  }

  await setLimit(slug, quantity);
  await interaction.reply({
    content:
      quantity === 0
        ? `${item.emoji ?? ""} **${item.displayName}**: limit usuniety (bez limitu).`
        : `${item.emoji ?? ""} **${item.displayName}**: nowy limit = ${quantity} ${item.unit}.`,
    ephemeral: true,
  });
}

async function handleViewLimits(interaction: ChatInputCommandInteraction) {
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
      ephemeral: true,
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
  await interaction.reply({ embeds: [embed], ephemeral: true });
}
