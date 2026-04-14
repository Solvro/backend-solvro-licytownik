import { client } from "./client.js";
import { config } from "./config.js";
import { commands } from "./commands/index.js";
import { registerReadyEvent } from "./events/ready.js";
import { registerInteractionEvent } from "./events/interactionCreate.js";
import { registerThreadCreateEvent } from "./events/threadCreate.js";
import { seedItems } from "./db/seed.js";
import { db, isPostgres } from "./db/index.js";
import { startAutoCloseLoop } from "./utils/auto-close.js";

// Run migrations
if (isPostgres) {
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  await migrate(db, { migrationsFolder: "./drizzle-pg" });
} else {
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  migrate(db, { migrationsFolder: "./drizzle" });
}

// Seed default items
await seedItems();

// Register commands
for (const command of commands) {
  client.commands.set(command.data.name, command);
}

// Register events
registerReadyEvent(client);
registerInteractionEvent(client);
registerThreadCreateEvent(client);

// Start background tasks
client.once("ready", () => startAutoCloseLoop(client));

// Login
client.login(config.BOT_TOKEN);
