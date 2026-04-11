import { ThreadChannel } from "discord.js";
import { buildSummaryEmbed } from "./embeds.js";
import { setSummaryMessageId } from "../db/queries/offers.js";
import type { OfferRow } from "../db/types.js";

export async function updateSummaryMessage(thread: ThreadChannel, offer: OfferRow) {
  const embed = await buildSummaryEmbed(offer.id, offer.title);

  if (offer.summaryMessageId) {
    try {
      const msg = await thread.messages.fetch(offer.summaryMessageId);
      await msg.edit({ embeds: [embed] });
      return;
    } catch {
      // message may have been deleted, create a new one
    }
  }

  const message = await thread.send({ embeds: [embed] });
  try {
    await message.pin();
  } catch {
    // not critical
  }
  await setSummaryMessageId(offer.id, message.id);
}
