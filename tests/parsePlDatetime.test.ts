process.env.TZ = "UTC";
process.env.BOT_TOKEN = process.env.BOT_TOKEN ?? "test-token";
process.env.CLIENT_ID = process.env.CLIENT_ID ?? "test-client";
process.env.GUILD_ID = process.env.GUILD_ID ?? "test-guild";

import { describe, it, expect, vi } from "vitest";

// Stub the db layer (auto-close.ts transitively imports it via queries).
// We only exercise parse/format functions, which don't touch the DB.
vi.mock("../src/db/index.js", () => ({ db: {}, isPostgres: false }));
vi.mock("../src/db/queries/settings.js", () => ({ getSetting: async () => null }));
vi.mock("../src/db/queries/offers.js", () => ({
  getOpenOffers: async () => [],
  closeOffer: async () => {},
  getOfferById: async () => null,
}));
vi.mock("../src/db/queries/bids.js", () => ({ getLastBidTime: async () => null }));
vi.mock("../src/utils/summary.js", () => ({ updateSummaryMessage: async () => {} }));
vi.mock("../src/utils/embeds.js", () => ({ buildSummaryEmbed: async () => ({}) }));

const { parsePlDatetime, formatPlDatetime } = await import(
  "../src/utils/auto-close.js"
);

describe("parsePlDatetime / formatPlDatetime (Europe/Warsaw)", () => {
  it("parses summer DST datetime (April, UTC+2)", () => {
    // 14.04.2026 12:00 Warsaw == 10:00 UTC
    const expected = Math.floor(Date.UTC(2026, 3, 14, 10, 0, 0) / 1000);
    expect(parsePlDatetime("14.04.2026 12:00")).toBe(expected);
  });

  it("parses winter datetime (January, UTC+1)", () => {
    // 15.01.2026 12:00 Warsaw == 11:00 UTC
    const expected = Math.floor(Date.UTC(2026, 0, 15, 11, 0, 0) / 1000);
    expect(parsePlDatetime("15.01.2026 12:00")).toBe(expected);
  });

  it("round-trips through formatPlDatetime", () => {
    const unix = parsePlDatetime("14.04.2026 12:00");
    expect(unix).not.toBeNull();
    expect(formatPlDatetime(unix as number)).toBe("14.04.2026 12:00");
  });

  it("returns null for invalid input", () => {
    expect(parsePlDatetime("not a date")).toBeNull();
  });

  it("handles DST edge (29.03.2026 03:30, post-jump)", () => {
    const result = parsePlDatetime("29.03.2026 03:30");
    expect(result).not.toBeNull();
    expect(Number.isFinite(result as number)).toBe(true);
  });
});
