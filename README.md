# Licytownik - Solvro Auction Bot

Discord bot for running licitations (auctions) in a student organization. Items are auctioned not for money, but for goods needed at integrations (beer, snacks, drinks, etc.).

## How it works

1. A Discord **forum channel** is designated for auctions
2. Each **forum post** is a separate auction offer
3. Members bid using `/bid` — bids are **cumulative** (everyone's bids stack up)
4. The **last person to bid** is the current winner
5. Admins can set **global limits** per item (e.g. max 80 beers across all offers)
6. Items that reached their limit are automatically hidden from autocomplete

## Commands

### Public

| Command | Description |
|---------|-------------|
| `/bid <item> [quantity=1]` | Bid on the current offer (autocomplete enabled) |
| `/offer-status` | Show aggregated bid summary for the current offer |

### Admin (requires Manage Server)

| Command | Description |
|---------|-------------|
| `/admin toggle-bidding <enabled>` | Enable/disable bidding globally |
| `/admin close-offer` | Close bidding on the current offer |
| `/admin reopen-offer` | Reopen bidding on the current offer |
| `/admin remove-offer` | Delete the offer and all its bids |
| `/admin add-item <name> <slug> [emoji] [unit] [max-quantity]` | Add a new biddable item |
| `/admin remove-item <slug>` | Remove an item and all related bids |
| `/admin set-limit <slug> <quantity>` | Set global limit for an item (0 = no limit) |
| `/admin view-limits [slug]` | Show limits and usage for all or one item |

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
FORUM_CHANNEL_ID=your-forum-channel-id

# Optional: use PostgreSQL instead of SQLite
# DATABASE_URL=postgresql://user:password@localhost:5432/licytownik
```

### Database

**SQLite** (default) — no setup needed, database file is created automatically in `data/`.

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

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start bot in dev mode (tsx) |
| `pnpm build` | Build for production (tsup) |
| `pnpm start` | Run production build |
| `pnpm deploy-commands` | Register slash commands with Discord |
| `pnpm db:generate` | Generate SQLite migrations |
| `pnpm db:generate:pg` | Generate PostgreSQL migrations |

## Tech stack

- **TypeScript** + **Node.js**
- **discord.js** v14
- **Drizzle ORM** + **SQLite** (better-sqlite3) or **PostgreSQL** (postgres.js)
- **Zod** for config validation

## Default items

The bot comes pre-seeded with 21 items commonly needed at student integrations (beer, vodka, sausages, bread, chips, etc.). Admins can add or remove items at any time using `/admin add-item` and `/admin remove-item`.
