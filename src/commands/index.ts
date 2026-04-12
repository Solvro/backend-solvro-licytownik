import type { Command } from "../types/command.js";
import { bidCommand } from "./bid.js";
import { offerStatusCommand } from "./offer-status.js";
import { myBidsCommand } from "./my-bids.js";
import { adminCommand } from "./admin.js";

export const commands: Command[] = [bidCommand, offerStatusCommand, myBidsCommand, adminCommand];
