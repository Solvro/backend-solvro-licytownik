import { z } from "zod/v4";

const envSchema = z.object({
  BOT_TOKEN: z.string(),
  CLIENT_ID: z.string(),
  GUILD_ID: z.string(),
  FORUM_CHANNEL_ID: z.string().optional(),
  DATABASE_URL: z.string().optional(),
});

export const config = envSchema.parse(process.env);
