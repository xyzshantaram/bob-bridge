import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import {
  resolveBridgedDiscordChannel,
  resolveDiscordMessageText,
  resolveQuotedMessageContent,
} from "../bridge/resolver.ts";
import { createTestRuntime } from "./test_runtime.ts";

Deno.test("resolveBridgedDiscordChannel accepts bridge threads", async () => {
  const { runtime } = createTestRuntime();
  assertEquals(await resolveBridgedDiscordChannel(runtime, 300n), {
    bridged: true,
    threadName: "thread-zone",
  });
});

Deno.test("resolveBridgedDiscordChannel rejects unrelated channels", async () => {
  const { runtime } = createTestRuntime();
  assertEquals(await resolveBridgedDiscordChannel(runtime, 400n), {
    bridged: false,
    threadName: "",
  });
});

Deno.test("resolveDiscordMessageText resolves mentions through helpers", async () => {
  const { runtime } = createTestRuntime();
  assertEquals(
    await resolveDiscordMessageText(runtime, {
      content: "hello <@1> in <#400> for <@&3>",
      guildId: 200n,
      mentionedChannelIds: [400n],
      mentionedUserIds: [1n],
    } as never),
    "hello @user-1 in #general for @[Role](mods)",
  );
});

Deno.test("resolveQuotedMessageContent returns empty string without reference", async () => {
  const { runtime } = createTestRuntime();
  assertEquals(
    await resolveQuotedMessageContent(runtime, {
      channelId: 100n,
    } as never),
    "",
  );
});

Deno.test("resolveQuotedMessageContent loads referenced message content", async () => {
  const { runtime } = createTestRuntime();
  assertEquals(
    await resolveQuotedMessageContent(runtime, {
      channelId: 100n,
      messageReference: { messageId: 555n },
    } as never),
    "quoted source message",
  );
});
