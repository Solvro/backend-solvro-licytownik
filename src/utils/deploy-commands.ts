import { REST, Routes } from "discord.js";
import { config } from "../config.js";
import { commands } from "../commands/index.js";

const rest = new REST().setToken(config.BOT_TOKEN);

const commandData = commands.map((cmd) => cmd.data.toJSON());

console.log(`Rejestrowanie ${commandData.length} komend...`);

try {
  await rest.put(
    Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
    { body: commandData }
  );
  console.log("Komendy zarejestrowane pomyslnie.");
} catch (error) {
  console.error("Blad rejestracji komend:", error);
}
