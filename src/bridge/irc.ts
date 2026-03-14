import { ircMsgToDiscord } from "./relay.ts";
import type { BridgeRuntime } from "../app/runtime.ts";

export function registerIrcHandlers(runtime: BridgeRuntime) {
  const { bot, channelId, client, config, members } = runtime;
  let joined = false;

  const joinBridgeChannel = () => {
    if (joined) return;
    joined = true;
    client.join([config.IRC_CHANNEL, config.IRC_CHANNEL_PASSWORD || ""]);
  };

  client.on("privmsg:channel", async (payload) => {
    if (payload.source?.name === config.IRC_USER) return;
    if (payload.params.target !== config.IRC_CHANNEL) return;

    if (payload.params.text.startsWith(config.PREFIX)) {
      if (payload.params.text === "$listnicks") {
        client.privmsg(
          config.IRC_CHANNEL,
          `Discord users: @${
            Object.keys(members).map((i) =>
              (i.includes(",") || i.includes(" ")) ? `"${i}"` : i
            ).join(" @")
          }`,
        );
      }
    }

    await bot.helpers.sendMessage(channelId, {
      content: `<${payload.source?.name || "User"}> ${
        ircMsgToDiscord(runtime, payload.params.text)
      }`,
    });
  });

  client.on("ctcp_action", async (payload) => {
    await bot.helpers.sendMessage(channelId, {
      content: `*** * ${payload.source?.name || "User"} ${
        ircMsgToDiscord(runtime, payload.params.text)
      }`,
    });
  });

  client.once("raw:rpl_saslsuccess", async () => {
    await bot.helpers.sendMessage(channelId, {
      content: "Bridge connected to IRC and registered via SASL.",
    });
    joinBridgeChannel();
  });

  client.on("register", () => {
    joinBridgeChannel();
  });

  client.on("join", async (payload) => {
    if (payload.source?.name === config.IRC_USER) {
      return await bot.helpers.sendMessage(channelId, {
        content: `*** Bridge joined ${config.IRC_CHANNEL}`,
      });
    }

    await bot.helpers.sendMessage(channelId, {
      content: `*** ${payload.source?.name || "Someone"} joined the channel`,
    });
  });

  client.on("part", async (payload) => {
    if (payload.source?.name === config.IRC_USER) return;
    await bot.helpers.sendMessage(channelId, {
      content: `*** ${
        payload.source?.name || "Someone"
      } has left the channel [${payload.params.comment || "No part message"}]`,
    });
  });

  client.on("quit", async (payload) => {
    if (payload.source?.name === config.IRC_USER) return;
    await bot.helpers.sendMessage(channelId, {
      content: `*** ${payload.source?.name || "Someone"} quit [${
        payload.params.comment || "No quit message"
      }]`,
    });
  });

  client.on("nick", async (payload) => {
    if (payload.source?.name === config.IRC_USER) return;
    await bot.helpers.sendMessage(channelId, {
      content: `*** ${
        payload.source?.name || "Someone"
      } is now known as ${payload.params.nick}`,
    });
  });

  client.on("names_reply", async (msg) => {
    const content = `Users in **${msg.params.channel}**: ${
      Object.keys(msg.params.names).join(", ")
    }`;
    await bot.helpers.sendMessage(channelId, { content });
  });
}

export async function startIrc(runtime: BridgeRuntime) {
  await runtime.client.connect(
    runtime.config.IRC_SERVER,
    runtime.config.IRC_PORT,
    true,
  );
}
