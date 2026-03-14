import { LRUCache } from "npm:lru-cache@11.0.0";
import type { BridgeConfig } from "../app/config.ts";
import type { BridgeRuntime } from "../app/runtime.ts";

export function createTestRuntime() {
  const ircMessages: string[] = [];
  const sentDiscordMessages: Array<{ channelId: bigint; content: string }> = [];
  const namesRequests: string[] = [];
  const clientHandlers: Record<
    string,
    (...args: unknown[]) => Promise<void> | void
  > = {};
  const clientOnceHandlers: Record<
    string,
    (...args: unknown[]) => Promise<void> | void
  > = {};

  const config: BridgeConfig = {
    DISCORD_BRIDGE_CHANNEL: "100",
    DISCORD_BRIDGE_SERVER: "200",
    DISCORD_TOKEN: "token",
    IRC_USER: "bridge",
    IRC_PASSWORD: "password",
    LOG_ALL_MESSAGES: false,
    IRC_CHANNEL: "#bridge",
    PREFIX: "$",
    IRC_CHANNEL_PASSWORD: "",
    IRC_SERVER: "irc.example.test",
    IRC_PORT: 6697,
  };

  const bot = {
    id: 999n,
    events: {},
    helpers: {
      getChannel: (channelId: bigint) => {
        if (channelId === 100n) return { name: "bridge", parentId: undefined };
        if (channelId === 300n) return { name: "thread-zone", parentId: 100n };
        if (channelId === 400n) return { name: "general", parentId: undefined };
        return { name: undefined, parentId: undefined };
      },
      getUser: (userId: bigint) => ({ username: `user-${userId}` }),
      getRoles: () => new Map([[3n, { name: "mods" }]]),
      getMember: (_guildId: bigint, memberId: bigint) => ({
        id: memberId,
        user: { username: "alice" },
      }),
      getMessage: (_channelId: bigint, messageId: string) => {
        if (messageId === "555") return { content: "quoted source message" };
        return { content: "reacted target" };
      },
      getMembers: () => [],
      sendMessage: (channelId: bigint, payload: { content: string }) => {
        sentDiscordMessages.push({ channelId, content: payload.content });
      },
    },
  };

  const client = {
    privmsg: (_target: string, content: string) => {
      ircMessages.push(content);
    },
    names: (channel: string) => {
      namesRequests.push(channel);
    },
    join: () => undefined,
    connect: () => Promise.resolve(),
    on: (
      event: string,
      handler: (...args: unknown[]) => Promise<void> | void,
    ) => {
      clientHandlers[event] = handler;
    },
    once: (
      event: string,
      handler: (...args: unknown[]) => Promise<void> | void,
    ) => {
      clientOnceHandlers[event] = handler;
    },
  };

  const runtime = {
    config,
    channelId: 100n,
    guildId: 200n,
    bot,
    client,
    members: {},
    cache: new LRUCache({ max: 1000 }),
  } as unknown as BridgeRuntime;

  return {
    runtime,
    ircMessages,
    sentDiscordMessages,
    namesRequests,
    clientHandlers,
    clientOnceHandlers,
  };
}
