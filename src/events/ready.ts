import { Client, Events } from "discord.js";

export function registerReadyEvent(client: Client) {
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Bot zalogowany jako ${readyClient.user.tag}`);
  });
}
