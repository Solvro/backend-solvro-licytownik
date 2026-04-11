import { EmbedBuilder } from "discord.js";
import { getAggregateBids, getLastBidder } from "../db/queries/bids.js";

interface AggregateBid {
  emoji: string | null;
  displayName: string;
  totalQuantity: number;
  unit: string;
}

export async function buildSummaryEmbed(offerId: number, offerTitle: string) {
  const aggregate = await getAggregateBids(offerId);
  const lastBidder = await getLastBidder(offerId);

  const embed = new EmbedBuilder()
    .setTitle(`Licytacja: ${offerTitle}`)
    .setColor(0x5865f2)
    .setTimestamp();

  if (aggregate.length === 0) {
    embed.setDescription("Brak ofert. Uzyj `/bid` aby zalicytowac!");
    return embed;
  }

  const aggregateLines = aggregate.map(
    (a: AggregateBid) => `${a.emoji ?? ""} **${a.displayName}**: ${a.totalQuantity} ${a.unit}`
  );
  embed.addFields({
    name: "Aktualna oferta",
    value: aggregateLines.join("\n"),
  });

  if (lastBidder) {
    embed.addFields({
      name: "Aktualny zwyciezca",
      value: `**${lastBidder.userName}**`,
      inline: true,
    });
  }

  return embed;
}
