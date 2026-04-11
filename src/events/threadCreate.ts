import { Client, Events, ThreadChannel } from "discord.js";
import { config } from "../config.js";
import { createOffer, getOfferByThreadId, setSummaryMessageId } from "../db/queries/offers.js";
import { buildSummaryEmbed } from "../utils/embeds.js";

export function registerThreadCreateEvent(client: Client) {
  client.on(Events.ThreadCreate, async (thread) => {
    if (!(thread instanceof ThreadChannel)) return;
    if (thread.parentId !== config.FORUM_CHANNEL_ID) return;

    const existing = await getOfferByThreadId(thread.id);
    if (existing) return;

    const offer = await createOffer(thread.id, thread.parentId ?? "", thread.name);
    const embed = await buildSummaryEmbed(offer.id, offer.title);
    const message = await thread.send({ embeds: [embed] });

    try {
      await message.pin();
    } catch {
      // pin may fail if no permission, not critical
    }

    await setSummaryMessageId(offer.id, message.id);
    console.log(`Nowa oferta utworzona: "${offer.title}" (thread ${thread.id})`);
  });
}
