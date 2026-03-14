import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { registerIrcHandlers } from "../bridge/irc.ts";
import { createTestRuntime } from "./test_runtime.ts";

Deno.test("irc integration relays channel messages to Discord", async () => {
  const { runtime, clientHandlers, sentDiscordMessages } = createTestRuntime();
  runtime.members.alice = "123";
  registerIrcHandlers(runtime);

  const handler = clientHandlers["privmsg:channel"];
  await handler({
    source: { name: "irc-alice" },
    params: { target: "#bridge", text: "hi @alice \x02bold\x02" },
  });

  assertEquals(sentDiscordMessages, [{
    channelId: 100n,
    content: "<irc-alice> hi <@123> **bold**",
  }]);
});

Deno.test("irc integration listnicks command writes the nick list back to IRC", async () => {
  const { runtime, clientHandlers, ircMessages } = createTestRuntime();
  runtime.members["Alice Example"] = "123";
  runtime.members.bob = "456";
  registerIrcHandlers(runtime);

  const handler = clientHandlers["privmsg:channel"];
  await handler({
    source: { name: "irc-alice" },
    params: { target: "#bridge", text: "$listnicks" },
  });

  assertEquals(ircMessages, ['Discord users: @"Alice Example" @bob']);
});

Deno.test("irc integration names reply is relayed to Discord", async () => {
  const { runtime, clientHandlers, sentDiscordMessages } = createTestRuntime();
  registerIrcHandlers(runtime);

  const handler = clientHandlers["names_reply"];
  await handler({
    params: { channel: "#bridge", names: { alice: {}, bob: {} } },
  });

  assertEquals(sentDiscordMessages, [{
    channelId: 100n,
    content: "Users in **#bridge**: alice, bob",
  }]);
});
