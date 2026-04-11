import { Client, Collection, GatewayIntentBits } from "discord.js";
import type { Command } from "./types/command.js";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

declare module "discord.js" {
  interface Client {
    commands: Collection<string, Command>;
  }
}

client.commands = new Collection();
