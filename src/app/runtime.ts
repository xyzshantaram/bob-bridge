import { Client } from "jsr:@irc/client@0.17.2";
import {
  createBot,
  Intents,
  type Message,
} from "https://deno.land/x/discordeno@18.0.1/mod.ts";
import { LRUCache } from "npm:lru-cache@11.0.0";
import type { BridgeConfig } from "./config.ts";

export type BridgeBot = ReturnType<typeof createBot>;

export type BridgeRuntime = {
  config: BridgeConfig;
  channelId: bigint;
  guildId: bigint;
  bot: BridgeBot;
  client: Client;
  members: Record<string, string>;
  cache: LRUCache<bigint, Message>;
};

export function createRuntime(config: BridgeConfig): BridgeRuntime {
  const bot = createBot({
    token: config.DISCORD_TOKEN,
    intents: Intents.GuildMessages | Intents.Guilds | Intents.MessageContent |
      Intents.GuildMembers,
  });

  const client = new Client({
    authMethod: "sasl",
    nick: config.IRC_USER,
    password: config.IRC_PASSWORD,
    verbose: config.LOG_ALL_MESSAGES ? "raw" : undefined,
  });

  return {
    config,
    channelId: BigInt(config.DISCORD_BRIDGE_CHANNEL),
    guildId: BigInt(config.DISCORD_BRIDGE_SERVER),
    bot,
    client,
    members: {},
    cache: new LRUCache<bigint, Message>({ max: 1000 }),
  };
}
