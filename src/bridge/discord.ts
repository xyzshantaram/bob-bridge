import { startBot } from "@discordeno";
import { getQuoteStr } from "./formatting.ts";
import {
  discordMsgToIrc,
  relayDiscordMessageToIrc,
  relayReactionToIrc,
} from "./relay.ts";
import {
  resolveBridgedDiscordChannel,
  resolveQuotedMessageContent,
} from "./resolver.ts";
import type { BridgeRuntime } from "../app/runtime.ts";

export function registerDiscordHandlers(runtime: BridgeRuntime) {
  const { bot, cache, client, config, guildId, members } = runtime;

  bot.events.messageCreate = async (bot, msg) => {
    if (!msg.guildId || !msg.member) return;
    const { bridged, threadName } = await resolveBridgedDiscordChannel(
      runtime,
      msg.channelId,
    );
    if (!bridged) return;

    cache.set(msg.id, msg);

    const quoteContent = await resolveQuotedMessageContent(runtime, msg);

    if (msg.member.id !== bot.id) {
      if (msg.content.startsWith(config.PREFIX)) {
        const cmd = msg.content.slice(config.PREFIX.length);
        if (cmd === "listnicks") {
          client.names(config.IRC_CHANNEL);
        } else if (cmd === "ping") {
          await bot.helpers.sendMessage(msg.channelId, { content: "Pong!" });
        }
      }

      const member = await bot.helpers.getMember(msg.guildId, msg.member.id);
      await relayDiscordMessageToIrc(
        runtime,
        msg,
        threadName,
        quoteContent,
        member.user?.username || "UnknownUser",
      );
    }
  };

  bot.events.messageUpdate = async (bot, msg) => {
    if (!msg.guildId || !msg.member) return;
    const member = await bot.helpers.getMember(msg.guildId, msg.member.id);
    const oldMsg = cache.get(msg.id);
    if (!oldMsg) return;
    client.privmsg(
      config.IRC_CHANNEL,
      `*** ${member.user?.username || "UnknownUser"} edited: ${
        getQuoteStr(oldMsg.content)
      } to \`${await discordMsgToIrc(runtime, msg)}\``,
    );
    cache.set(msg.id, msg);
  };

  bot.events.ready = async (bot, _) => {
    const gottenMembers = await bot.helpers.getMembers(guildId, {
      limit: 1000,
    });
    gottenMembers.forEach((member) => {
      members[member.user?.username || ""] = member.id.toString();
    });
    console.log("Discord side ready...");
  };

  bot.events.reactionAdd = async (bot, payload) => {
    if (payload.userId === bot.id) return;

    const { bridged, threadName } = await resolveBridgedDiscordChannel(
      runtime,
      payload.channelId,
    );
    if (!bridged) return;

    const user = payload.user || await bot.helpers.getUser(payload.userId);
    const message = await bot.helpers.getMessage(
      payload.channelId,
      payload.messageId.toString(),
    );
    await relayReactionToIrc(
      runtime,
      user.username,
      "reacted with",
      payload.emoji,
      message.content,
      threadName,
    );
  };

  bot.events.reactionRemove = async (bot, payload) => {
    if (payload.userId === bot.id) return;

    const { bridged, threadName } = await resolveBridgedDiscordChannel(
      runtime,
      payload.channelId,
    );
    if (!bridged) return;

    const user = await bot.helpers.getUser(payload.userId);
    const message = await bot.helpers.getMessage(
      payload.channelId,
      payload.messageId.toString(),
    );
    await relayReactionToIrc(
      runtime,
      user.username,
      "removed reaction",
      payload.emoji,
      message.content,
      threadName,
    );
  };
}

export async function startDiscord(runtime: BridgeRuntime) {
  await startBot(runtime.bot);
}
