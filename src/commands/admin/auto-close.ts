import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
  MessageFlags,
} from "discord.js";
import { setSetting } from "../../db/queries/settings.js";
import {
  getAutoCloseConfig,
  parsePlDatetime,
  formatPlDatetime,
} from "../../utils/auto-close.js";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub
    .setName("auto-close")
    .setDescription("Skonfiguruj automatyczne zamykanie ofert po nieaktywnosci")
    .addBooleanOption((opt) =>
      opt.setName("enabled").setDescription("Wlacz/wylacz automatyczne zamykanie").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("datetime")
        .setDescription("Data startu w formacie DD.MM.YYYY HH:mm")
        .setRequired(false)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("min-after-inactivity")
        .setDescription("Minuty nieaktywnosci po ktorych oferta sie zamyka")
        .setRequired(false)
        .setMinValue(1)
    );

export async function handle(interaction: ChatInputCommandInteraction): Promise<void> {
  const enabled = interaction.options.getBoolean("enabled", true);
  const datetimeStr = interaction.options.getString("datetime");
  const minInactivity = interaction.options.getInteger("min-after-inactivity");

  if (!enabled) {
    await setSetting("auto_close_enabled", "false");
    await interaction.reply({
      content: "Automatyczne zamykanie ofert zostalo **wylaczone**.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const current = await getAutoCloseConfig();

  let datetimeUnix = current.datetime;
  if (datetimeStr) {
    const parsed = parsePlDatetime(datetimeStr);
    if (!parsed) {
      await interaction.reply({
        content: "Nieprawidlowy format daty. Uzyj `DD.MM.YYYY HH:mm` (np. `14.04.2026 12:00`).",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    datetimeUnix = parsed;
  }

  let inactivitySec = current.inactivity;
  if (minInactivity !== null) {
    inactivitySec = minInactivity * 60;
  }

  if (!datetimeUnix || !inactivitySec) {
    await interaction.reply({
      content:
        "Przy pierwszym wlaczeniu musisz podac `datetime` oraz `min-after-inactivity`.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await setSetting("auto_close_enabled", "true");
  await setSetting("auto_close_datetime", String(datetimeUnix));
  await setSetting("auto_close_inactivity_sec", String(inactivitySec));

  await interaction.reply({
    content: `Automatyczne zamykanie **wlaczone**.\nStart: **${formatPlDatetime(datetimeUnix)}**\nNieaktywnosc: **${Math.round(inactivitySec / 60)} min**`,
    flags: MessageFlags.Ephemeral,
  });
}
