import { Client } from "discord.js";
import { getSetting } from "../db/queries/settings.js";
import { getOpenOffers, closeOffer, getOfferById } from "../db/queries/offers.js";
import { getLastBidTime } from "../db/queries/bids.js";
import { updateSummaryMessage } from "./summary.js";
import { buildSummaryEmbed } from "./embeds.js";

const CHECK_INTERVAL_MS = 60_000;

export async function getAutoCloseConfig() {
  const enabled = (await getSetting("auto_close_enabled")) === "true";
  const datetimeStr = await getSetting("auto_close_datetime");
  const inactivityStr = await getSetting("auto_close_inactivity_sec");
  const datetime = datetimeStr ? Number(datetimeStr) : null;
  const inactivity = inactivityStr ? Number(inactivityStr) : null;
  return { enabled, datetime, inactivity };
}

export function parsePlDatetime(input: string): number | null {
  const m = input.trim().match(
    /^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})[ T](\d{1,2}):(\d{2})$/
  );
  if (!m) return null;
  const [, d, mo, y, h, mi] = m;
  const date = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    0
  );
  if (isNaN(date.getTime())) return null;
  return Math.floor(date.getTime() / 1000);
}

export function formatPlDatetime(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function runCheck(client: Client) {
  const { enabled, datetime, inactivity } = await getAutoCloseConfig();
  if (!enabled || !datetime || !inactivity) return;

  const now = Math.floor(Date.now() / 1000);
  if (now < datetime) return;

  const openOffers = await getOpenOffers();
  for (const offer of openOffers) {
    const lastBidAt = await getLastBidTime(offer.id);
    const inactiveSince = lastBidAt ?? offer.createdAt;
    const closeAt = Math.max(datetime, inactiveSince + inactivity);
    if (now < closeAt) continue;

    await closeOffer(offer.id);
    try {
      const thread = await client.channels.fetch(offer.forumPostId);
      if (thread?.isThread()) {
        const refreshed = await getOfferById(offer.id);
        if (refreshed) await updateSummaryMessage(thread, refreshed);
        const embed = await buildSummaryEmbed(offer.id, offer.title);
        await thread.send({
          content: "⏰ Licytacja zostala automatycznie **zamknieta** (brak aktywnosci).",
          embeds: [embed],
        });
      }
    } catch {
      // best effort
    }
  }
}

export function startAutoCloseLoop(client: Client) {
  const tick = () => {
    runCheck(client).catch((err) => console.error("auto-close error:", err));
  };
  setInterval(tick, CHECK_INTERVAL_MS);
  tick();
}
