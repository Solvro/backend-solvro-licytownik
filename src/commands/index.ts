import type { Command } from "../types/command.js";
import { bidCommand } from "./bid.js";
import { offerStatusCommand } from "./offer-status.js";
import { adminCommand } from "./admin.js";

export const commands: Command[] = [bidCommand, offerStatusCommand, adminCommand];
