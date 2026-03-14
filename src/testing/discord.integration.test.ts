import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { registerDiscordHandlers } from "../bridge/discord.ts";
import { createTestRuntime } from "./test_runtime.ts";

Deno.test("discord integration relays bridged thread messages to IRC", async () => {
  const { runtime, ircMessages } = createTestRuntime();
  registerDiscordHandlers(runtime);

  const handler = (
    runtime.bot.events as unknown as Record<
      string,
      (...args: unknown[]) => Promise<void>
    >
  ).messageCreate;

  await handler(runtime.bot, {
    id: 1n,
    guildId: 200n,
    channelId: 300n,
    member: { id: 42n },
    content: "hello <@1> in <#400> for <@&3>\n**bold**",
    mentionedChannelIds: [400n],
    mentionedUserIds: [1n],
    messageReference: { messageId: 555n },
    attachments: [],
    embeds: [],
    stickerItems: [],
  });

  assertEquals(ircMessages, [
    "<alice> [in thread-zone] [> quoted source message] hello @user-1 in #general for @[Role](mods) / \x02bold\x02",
  ]);
});

Deno.test("discord integration ignores messages outside the bridged channel tree", async () => {
  const { runtime, ircMessages } = createTestRuntime();
  registerDiscordHandlers(runtime);

  const handler = (
    runtime.bot.events as unknown as Record<
      string,
      (...args: unknown[]) => Promise<void>
    >
  ).messageCreate;

  await handler(runtime.bot, {
    id: 2n,
    guildId: 200n,
    channelId: 400n,
    member: { id: 42n },
    content: "hello from elsewhere",
    mentionedChannelIds: [],
    mentionedUserIds: [],
    attachments: [],
    embeds: [],
    stickerItems: [],
  });

  assertEquals(ircMessages, []);
});

Deno.test("discord integration message update relays edited content to IRC", async () => {
  const { runtime, ircMessages } = createTestRuntime();
  registerDiscordHandlers(runtime);
  runtime.cache.set(5n, { content: "before edit" } as never);

  const handler = (
    runtime.bot.events as unknown as Record<
      string,
      (...args: unknown[]) => Promise<void>
    >
  ).messageUpdate;

  await handler(runtime.bot, {
    id: 5n,
    guildId: 200n,
    channelId: 100n,
    member: { id: 42n },
    content: "after <@1>",
    mentionedChannelIds: [],
    mentionedUserIds: [1n],
  });

  assertEquals(ircMessages, [
    "*** alice edited:  [> before edit] to `after @user-1`",
  ]);
});

Deno.test("discord integration listnicks command requests IRC names", async () => {
  const { runtime, namesRequests } = createTestRuntime();
  registerDiscordHandlers(runtime);

  const handler = (
    runtime.bot.events as unknown as Record<
      string,
      (...args: unknown[]) => Promise<void>
    >
  ).messageCreate;

  await handler(runtime.bot, {
    id: 3n,
    guildId: 200n,
    channelId: 100n,
    member: { id: 42n },
    content: "$listnicks",
    mentionedChannelIds: [],
    mentionedUserIds: [],
    attachments: [],
    embeds: [],
    stickerItems: [],
  });

  assertEquals(namesRequests, ["#bridge"]);
});

Deno.test("discord integration relays reactions to IRC", async () => {
  const { runtime, ircMessages } = createTestRuntime();
  registerDiscordHandlers(runtime);

  const handler = (
    runtime.bot.events as unknown as Record<
      string,
      (...args: unknown[]) => Promise<void>
    >
  ).reactionAdd;

  await handler(runtime.bot, {
    userId: 42n,
    channelId: 300n,
    messageId: 777n,
    emoji: { id: 1n, name: "party_parrot" },
    user: { username: "alice" },
  });

  assertEquals(ircMessages, [
    "*** alice reacted with :party_parrot: [in thread-zone] [> reacted target]",
  ]);
});
