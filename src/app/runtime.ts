import { Client } from "@irc/client";
import { createBot, Intents, type Message } from "@discordeno";
import { LRUCache } from "lru-cache";

export type BridgeConfig = {
  DISCORD_BRIDGE_CHANNEL: string;
  DISCORD_BRIDGE_SERVER: string;
  DISCORD_TOKEN: string;
  IRC_USER: string;
  IRC_PASSWORD?: string;
  LOG_ALL_MESSAGES?: boolean;
  IRC_CHANNEL: string;
  PREFIX: string;
  IRC_CHANNEL_PASSWORD?: string;
  IRC_SERVER: string;
  IRC_PORT: number;
};

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
      Intents.GuildMembers | Intents.GuildMessageReactions,
  });

  const clientOptions = {
    nick: config.IRC_USER,
    verbose: config.LOG_ALL_MESSAGES ? "raw" : undefined,
  } as {
    authMethod?: "sasl";
    nick: string;
    password?: string;
    verbose?: "raw";
  };

  if (config.IRC_PASSWORD) {
    clientOptions.authMethod = "sasl";
    clientOptions.password = config.IRC_PASSWORD;
  }

  const client = new Client(clientOptions);

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
