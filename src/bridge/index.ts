import type { BridgeConfig } from "../app/runtime.ts";
import { registerDiscordHandlers, startDiscord } from "./discord.ts";
import { registerIrcHandlers, startIrc } from "./irc.ts";
import { createRuntime } from "../app/runtime.ts";

export async function startBridge(config: BridgeConfig) {
  const runtime = createRuntime(config);

  registerIrcHandlers(runtime);
  registerDiscordHandlers(runtime);

  await startDiscord(runtime);
  await startIrc(runtime);
  console.log("running");

  Deno.addSignalListener("SIGINT", async () => {
    const content = "Goodbye, cruel world! (jk, caught a SIGINT, bbl)";
    await runtime.bot.helpers.sendMessage(runtime.channelId, { content });
    runtime.client.privmsg(runtime.config.IRC_CHANNEL, content);
    Deno.exit(0);
  });
}
