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

const WARSAW_TZ = "Europe/Warsaw";

// Returns the offset (in ms) of Europe/Warsaw vs UTC at the given UTC instant.
// Needed because the host runs in UTC but admins type Warsaw wall-clock time,
// and the offset shifts +1h/+2h across DST transitions.
function warsawOffsetMs(utcMs: number): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: WARSAW_TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") === 24 ? 0 : get("hour"),
    get("minute"),
    get("second")
  );
  return asUtc - utcMs;
}

export function parsePlDatetime(input: string): number | null {
  const m = input.trim().match(
    /^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})[ T](\d{1,2}):(\d{2})$/
  );
  if (!m) return null;
  const [, d, mo, y, h, mi] = m;
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  const hour = Number(h);
  const minute = Number(mi);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return null;
  }
  // Two-pass trick: start by treating the wall-clock as UTC, then subtract
  // the Warsaw offset at that instant to get the real UTC. Repeat once so
  // the offset is sampled near the actual instant (handles DST correctly).
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  let guess = naiveUtc - warsawOffsetMs(naiveUtc);
  guess = naiveUtc - warsawOffsetMs(guess);
  if (isNaN(guess)) return null;
  return Math.floor(guess / 1000);
}

export function formatPlDatetime(unixSec: number): string {
  const dtf = new Intl.DateTimeFormat("pl-PL", {
    timeZone: WARSAW_TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = dtf.formatToParts(new Date(unixSec * 1000));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("day")}.${get("month")}.${get("year")} ${hour}:${get("minute")}`;
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
