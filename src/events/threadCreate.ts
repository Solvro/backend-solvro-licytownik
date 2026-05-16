import { Client, Events, ThreadChannel } from "discord.js";
import { createOffer, getOfferByThreadId, setSummaryMessageId } from "../db/queries/offers.js";
import { buildSummaryEmbed } from "../utils/embeds.js";
import { getForumChannelId } from "../db/queries/settings.js";

// Forum posts with attachments (images) delay the starter message — ThreadCreate
// fires before the thread is fully ready, and an immediate thread.send() can race.
async function waitForStarterMessage(thread: ThreadChannel, attempts = 8, delayMs = 500) {
  for (let i = 0; i < attempts; i++) {
    try {
      const msg = await thread.fetchStarterMessage();
      if (msg) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

export function registerThreadCreateEvent(client: Client) {
  client.on(Events.ThreadCreate, async (thread) => {
    if (!(thread instanceof ThreadChannel)) return;
    const forumChannelId = await getForumChannelId();
    if (!forumChannelId) return;
    if (thread.parentId !== forumChannelId) return;

    const existing = await getOfferByThreadId(thread.id);
    if (existing) return;

    await waitForStarterMessage(thread);

    const offer = await createOffer(thread.id, thread.parentId ?? "", thread.name);
    const embed = await buildSummaryEmbed(offer.id, offer.title);

    let message;
    try {
      message = await thread.send({ embeds: [embed] });
    } catch (err) {
      console.error(`Failed to send summary embed in thread ${thread.id}:`, err);
      return;
    }

    try {
      await message.pin();
    } catch {
      // pin may fail if no permission, not critical
    }

    await setSummaryMessageId(offer.id, message.id);
    console.log(`Nowa oferta utworzona: "${offer.title}" (thread ${thread.id})`);
  });
}
