import { EmbedBuilder } from "discord.js";
import { getAggregateBids, getRecentBids, getLastBidder } from "../db/queries/bids.js";

interface AggregateBid {
  emoji: string | null;
  displayName: string;
  totalQuantity: number;
  unit: string;
}

interface RecentBid {
  userName: string;
  quantity: number;
  emoji: string | null;
  displayName: string;
}

export async function buildSummaryEmbed(offerId: number, offerTitle: string) {
  const aggregate = await getAggregateBids(offerId);
  const recent = await getRecentBids(offerId, 10);
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

  if (recent.length > 0) {
    const historyLines = recent.map(
      (b: RecentBid) => `**${b.userName}** +${b.quantity} ${b.emoji ?? ""} ${b.displayName}`
    );
    embed.addFields({
      name: "Ostatnie licytacje",
      value: historyLines.join("\n"),
    });
  }

  if (lastBidder) {
    embed.addFields({
      name: "Aktualny zwyciezca",
      value: `**${lastBidder.userName}**`,
      inline: true,
    });
  }

  return embed;
}
