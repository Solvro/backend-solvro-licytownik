import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
  ChannelType,
  MessageFlags,
} from "discord.js";
import { setForumChannelId } from "../../db/queries/settings.js";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub
    .setName("set-forum-channel")
    .setDescription("Ustaw kanal forum dla licytacji")
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setDescription("Kanal forum")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildForum)
    );

export async function handle(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = interaction.options.getChannel("channel", true);
  await setForumChannelId(channel.id);
  await interaction.reply({
    content: `Kanal licytacji ustawiony na <#${channel.id}>.`,
    flags: MessageFlags.Ephemeral,
  });
}
