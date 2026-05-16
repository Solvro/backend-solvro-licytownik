import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
  MessageFlags,
} from "discord.js";
import { setSetting } from "../../db/queries/settings.js";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub
    .setName("toggle-bidding")
    .setDescription("Wlacz/wylacz licytacje globalnie")
    .addBooleanOption((opt) =>
      opt.setName("enabled").setDescription("Czy licytacja wlaczona?").setRequired(true)
    );

export async function handle(interaction: ChatInputCommandInteraction): Promise<void> {
  const enabled = interaction.options.getBoolean("enabled", true);
  await setSetting("bidding_enabled", String(enabled));
  await interaction.reply({
    content: enabled
      ? "Licytacja zostala **wlaczona**."
      : "Licytacja zostala **wylaczona**.",
    flags: MessageFlags.Ephemeral,
  });
}
