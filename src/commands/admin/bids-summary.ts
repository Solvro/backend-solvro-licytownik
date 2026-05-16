import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { config } from "../../config.js";
import { getAllOffers } from "../../db/queries/offers.js";
import { getAllBidsWithItems } from "../../db/queries/bids.js";
import {
  aggregateBidsByUser,
  type BidWithItem,
} from "../../utils/aggregate.js";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub
    .setName("bids-summary")
    .setDescription("Pokaz wygrane oferty i zagregowane przedmioty per uzytkownik")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("Konkretny uzytkownik (puste = wszyscy)").setRequired(false)
    );

export async function handle(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const filterUser = interaction.options.getUser("user");
  const allOffers = await getAllOffers();

  const allBids = (await getAllBidsWithItems()) as BidWithItem[];
  const byUser = aggregateBidsByUser(
    allBids,
    allOffers.map((o) => ({
      id: o.id,
      forumPostId: o.forumPostId,
      title: o.title,
    })),
    filterUser?.id
  );

  if (byUser.size === 0) {
    await interaction.editReply({
      content: filterUser
        ? `${filterUser} nie wygrywa zadnej oferty.`
        : "Nikt jeszcze nie wygrywa zadnej oferty.",
    });
    return;
  }

  if (filterUser) {
    const [userId, s] = byUser.entries().next().value!;
    const offersList = s.wonOffers
      .map(
        (o) =>
          `• [${o.title}](https://discord.com/channels/${config.GUILD_ID}/${o.forumPostId})`
      )
      .join("\n");
    const itemsList = Array.from(s.items.values())
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map((i) => `${i.emoji ?? ""} **${i.displayName}**: ${i.total} ${i.unit}`)
      .join("\n");

    const embed = new EmbedBuilder()
      .setTitle(s.userName)
      .setColor(0x5865f2)
      .setDescription(`<@${userId}>`)
      .addFields(
        { name: "Wygrywane oferty", value: offersList || "—" },
        { name: "Przedmioty do dostarczenia", value: itemsList || "—" }
      );
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const sections: string[] = [];
  for (const [userId, s] of byUser) {
    const offersList = s.wonOffers
      .map(
        (o) =>
          `• [${o.title}](https://discord.com/channels/${config.GUILD_ID}/${o.forumPostId})`
      )
      .join("\n");
    const itemsList = Array.from(s.items.values())
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map((i) => `${i.emoji ?? ""} ${i.displayName}: ${i.total} ${i.unit}`)
      .join("\n");
    sections.push(
      `**<@${userId}>**\n__Wygrywane oferty:__\n${offersList}\n__Przedmioty do dostarczenia:__\n${itemsList}`
    );
  }

  const MAX_DESC = 4000;
  const pages: string[] = [];
  let current = "";
  for (const section of sections) {
    if (current.length + section.length + 2 > MAX_DESC) {
      if (current) pages.push(current);
      current = section;
    } else {
      current = current ? `${current}\n\n${section}` : section;
    }
  }
  if (current) pages.push(current);

  for (let i = 0; i < pages.length; i++) {
    const embed = new EmbedBuilder()
      .setTitle(
        pages.length > 1
          ? `Podsumowanie licytacji (${i + 1}/${pages.length})`
          : "Podsumowanie licytacji"
      )
      .setColor(0x5865f2)
      .setDescription(pages[i]);
    if (i === pages.length - 1) embed.setTimestamp();

    if (i === 0) {
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  }
}
