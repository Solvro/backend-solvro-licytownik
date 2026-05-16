import { ChatInputCommandInteraction, ThreadChannel, MessageFlags } from "discord.js";
import { getForumChannelId } from "../db/queries/settings.js";

export async function requireForumThread(
  interaction: ChatInputCommandInteraction
): Promise<ThreadChannel | null> {
  const forumChannelId = await getForumChannelId();
  if (!forumChannelId) {
    await interaction.reply({
      content:
        "Kanal licytacji nie jest skonfigurowany. Uzyj `/admin set-forum-channel`.",
      flags: MessageFlags.Ephemeral,
    });
    return null;
  }

  const channel = interaction.channel;
  if (
    !channel ||
    !channel.isThread() ||
    channel.parentId !== forumChannelId
  ) {
    await interaction.reply({
      content: "Ta komenda dziala tylko w watkach na kanale licytacji.",
      flags: MessageFlags.Ephemeral,
    });
    return null;
  }

  return channel as ThreadChannel;
}
