import {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  SharedSlashCommand,
} from "discord.js";

export interface Command {
  data: SharedSlashCommand;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
  autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
}
