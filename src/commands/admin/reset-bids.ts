import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
  MessageFlags,
} from "discord.js";
import { countOffers, deleteAllOffers } from "../../db/queries/offers.js";
import { countBids, deleteAllBids } from "../../db/queries/bids.js";
import { db } from "../../db/index.js";

export const data = (sub: SlashCommandSubcommandBuilder) =>
  sub
    .setName("reset-bids")
    .setDescription("Usun WSZYSTKIE oferty i licytacje (wymaga potwierdzenia tokenem)")
    .addStringOption((opt) =>
      opt
        .setName("confirm")
        .setDescription("Token potwierdzajacy z poprzedniego wywolania")
        .setRequired(false)
    );

const RESET_TOKEN_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const RESET_TOKEN_LEN = 6;
const RESET_TOKEN_TTL_MS = 60_000;

const pendingResets: Map<string, { token: string; expiresAt: number }> = new Map();

function generateResetToken(): string {
  let out = "";
  for (let i = 0; i < RESET_TOKEN_LEN; i++) {
    out += RESET_TOKEN_ALPHABET.charAt(
      Math.floor(Math.random() * RESET_TOKEN_ALPHABET.length)
    );
  }
  return out;
}

async function issueResetToken(
  interaction: ChatInputCommandInteraction,
  prefix: string
) {
  const [offerCount, bidCount] = await Promise.all([countOffers(), countBids()]);
  const token = generateResetToken();
  pendingResets.set(interaction.user.id, {
    token,
    expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
  });
  await interaction.reply({
    content:
      `${prefix}\n` +
      `**UWAGA:** Ta operacja usunie **${offerCount}** ofert oraz **${bidCount}** licytacji. Przedmioty i ustawienia pozostana nietkniete.\n` +
      `Aby potwierdzic, w ciagu **60 sekund** uruchom:\n` +
      `\`/admin reset-bids confirm:${token}\``,
    flags: MessageFlags.Ephemeral,
  });
}

export async function handle(interaction: ChatInputCommandInteraction): Promise<void> {
  const confirm = interaction.options.getString("confirm");
  const userId = interaction.user.id;

  if (!confirm) {
    await issueResetToken(interaction, "Potwierdzenie wymagane.");
    return;
  }

  const pending = pendingResets.get(userId);
  const now = Date.now();
  if (!pending || pending.expiresAt < now || pending.token !== confirm) {
    pendingResets.delete(userId);
    await issueResetToken(
      interaction,
      "Token nieprawidlowy lub wygasl. Wygenerowano nowy."
    );
    return;
  }

  pendingResets.delete(userId);

  const result = await db.transaction(async (tx) => {
    const deletedBids = await deleteAllBids(tx);
    const deletedOffers = await deleteAllOffers(tx);
    return { deletedBids, deletedOffers };
  });

  await interaction.reply({
    content:
      `Reset wykonany. Usunieto **${result.deletedOffers}** ofert oraz **${result.deletedBids}** licytacji.`,
    flags: MessageFlags.Ephemeral,
  });
}
