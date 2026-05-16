# Licytownik - Solvro Auction Bot

Discord bot for running licitations (auctions) in a student organization. Items are auctioned not for money, but for goods needed at integrations (beer, snacks, drinks, etc.). Ideal before internal events. Made for spring 2026 integraion retreat by Dawid Linek. 

## How it works

1. A Discord **forum channel** is designated for auctions (configurable at runtime via `/admin set-forum-channel`)
2. Each **forum post** is a separate auction offer
3. Members bid using `/bid` — bids are **cumulative** (everyone's bids stack up)
4. The **last person to bid** is the current winner
5. Admins can set **global limits** per item (e.g. max 80 beers across all offers)
6. Items that reached their limit are automatically hidden from autocomplete
7. Offers can be auto-closed after a configurable period of inactivity (Europe/Warsaw time)

## Commands

### Public

| Command | Description |
|---------|-------------|
| `/bid <item> [quantity=1]` | Bid on the current offer (autocomplete enabled) |
| `/offer-status` | Show aggregated bid summary for the current offer |
| `/my-bids` | Show all offers you've bid on, marked as winning/outbid, plus aggregated items to deliver |

### Admin (requires Manage Server)

| Command | Description |
|---------|-------------|
| `/admin toggle-bidding <enabled>` | Enable/disable bidding globally |
| `/admin close-offer` | Close bidding on the current offer (posts final summary embed) |
| `/admin reopen-offer` | Reopen bidding on the current offer |
| `/admin remove-offer` | Delete the offer and all its bids |
| `/admin add-item <name> <slug> [emoji] [unit] [max-quantity]` | Add a new biddable item |
| `/admin remove-item <slug>` | Remove an item and all related bids |
| `/admin set-limit <slug> <quantity>` | Set global limit for an item (0 = no limit) |
| `/admin view-limits [slug]` | Show limits and usage for all or one item |
| `/admin auto-close <enabled> [datetime] [min-after-inactivity]` | Configure auto-close (datetime in `DD.MM.YYYY HH:mm`, Europe/Warsaw) |
| `/admin bids-summary [user]` | Show won offers + items to deliver per user (or one specific user) |
| `/admin set-forum-channel <channel>` | Set the forum channel used for auctions |
| `/admin export-bids` | Export all offers, bids, and items as a JSON attachment |
| `/admin reset-bids` | Wipe all offers and bids (keeps items + settings). Two-step token confirmation. Use to reuse the bot across seasons/years. |

## Setup

### Prerequisites

- Node.js 20+
- pnpm
- A Discord bot with the following permissions: Send Messages, Embed Links, Manage Messages, Read Message History
- A Discord server with a **forum channel**

### Installation

```bash
pnpm install
```

### Configuration

Copy `.env.example` to `.env` and fill in:

```env
BOT_TOKEN=your-bot-token
CLIENT_ID=your-application-client-id
GUILD_ID=your-discord-server-id

# Optional: bootstraps the forum channel setting on first boot only.
# Once the setting is written, use `/admin set-forum-channel` to change it.
FORUM_CHANNEL_ID=your-forum-channel-id

# Optional: use PostgreSQL instead of SQLite
# DATABASE_URL=postgresql://user:password@localhost:5432/licytownik
```

Note: `FORUM_CHANNEL_ID` is no longer required at runtime — it's used once on first boot to seed the `forum_channel_id` setting. After that, change it any time with `/admin set-forum-channel`.

### Database

**SQLite** (default) — no setup needed, the file is created automatically in `data/`.

**PostgreSQL** — set `DATABASE_URL` in `.env`. Generate migrations with:

```bash
pnpm db:generate:pg
```

### Running

```bash
# Register slash commands (run once, or after command changes)
pnpm deploy-commands

# Start the bot (development)
pnpm dev

# Build and start (production)
pnpm build
pnpm start
```

### Tests

```bash
pnpm test          # one-shot
pnpm test:watch    # watch mode
```

Covers timezone parsing (DST-aware Europe/Warsaw) and winner / per-user bid aggregation.

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start bot in dev mode (tsx, loads `.env`) |
| `pnpm build` | Build for production (tsup) |
| `pnpm start` | Run production build (expects env vars from the environment, not `.env`) |
| `pnpm deploy-commands` | Register slash commands with Discord |
| `pnpm test` | Run vitest tests |
| `pnpm db:generate` | Generate SQLite migrations |
| `pnpm db:generate:pg` | Generate PostgreSQL migrations |

## Season rollover

To reuse the bot for a new season/year:

1. `/admin export-bids` — download a JSON archive of the current season
2. `/admin reset-bids` — wipes offers and bids (items, limits, settings are preserved). Two-step token confirmation prevents accidents.

## Tech stack

- **TypeScript** + **Node.js**
- **discord.js** v14
- **Drizzle ORM** + **SQLite** (better-sqlite3) or **PostgreSQL** (postgres.js)
- **Zod** for config validation
- **Vitest** for tests

## Default items

The bot comes pre-seeded with 21 items commonly needed at student integrations (beer, vodka, sausages, bread, chips, etc.). Admins can add or remove items at any time using `/admin add-item` and `/admin remove-item`.
