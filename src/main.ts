import type { BridgeConfig } from "./app/runtime.ts";
import { startBridge } from "./bridge/index.ts";

async function loadConfig(): Promise<BridgeConfig> {
  const env = Deno.env;

  if (env.has("DISCORD_TOKEN")) {
    return {
      DISCORD_BRIDGE_CHANNEL: env.get("DISCORD_BRIDGE_CHANNEL") ?? "",
      DISCORD_BRIDGE_SERVER: env.get("DISCORD_BRIDGE_SERVER") ?? "",
      DISCORD_TOKEN: env.get("DISCORD_TOKEN") ?? "",
      IRC_USER: env.get("IRC_USER") ?? "",
      IRC_PASSWORD: env.get("IRC_PASSWORD") ?? "",
      LOG_ALL_MESSAGES: env.get("LOG_ALL_MESSAGES") === "true",
      IRC_CHANNEL: env.get("IRC_CHANNEL") ?? "",
      PREFIX: env.get("PREFIX") ?? "$",
      IRC_CHANNEL_PASSWORD: env.get("IRC_CHANNEL_PASSWORD") ?? "",
      IRC_SERVER: env.get("IRC_SERVER") ?? "",
      IRC_PORT: Number(env.get("IRC_PORT")) || 6697,
    } as BridgeConfig;
  }

  const { default: config } = await import("../config.json", {
    with: { type: "json" },
  });
  return config as BridgeConfig;
}

if (import.meta.main) {
  await startBridge(await loadConfig());
}
