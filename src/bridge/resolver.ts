import type { Message } from "@discordeno";
import type { BridgeRuntime } from "../app/runtime.ts";
import { discordTextToIrc } from "./transforms.ts";

export async function resolveBridgedDiscordChannel(
  runtime: BridgeRuntime,
  channelId: bigint,
) {
  if (channelId === runtime.channelId) {
    return { bridged: true, threadName: "" };
  }

  const channel = await runtime.bot.helpers.getChannel(channelId);
  if (channel.parentId !== runtime.channelId) {
    return { bridged: false, threadName: "" };
  }

  return { bridged: true, threadName: channel.name || "Thread" };
}

export async function resolveDiscordMessageText(
  runtime: BridgeRuntime,
  msg: Message,
) {
  const channelNames = await Promise.all(
    msg.mentionedChannelIds.map(async (channelId) =>
      (await runtime.bot.helpers.getChannel(channelId)).name || "UnknownChannel"
    ),
  );
  const userNames = await Promise.all(
    msg.mentionedUserIds.map(async (userId) =>
      (await runtime.bot.helpers.getUser(userId)).username || "UnknownUser"
    ),
  );
  const roles = await runtime.bot.helpers.getRoles(msg.guildId!);

  return discordTextToIrc(msg.content, {
    channelNames,
    userNames,
    roleNames: new Map(
      [...roles.entries()].map((
        [id, role],
      ) => [id, role.name || "UnknownRole"]),
    ),
  });
}

export async function resolveQuotedMessageContent(
  runtime: BridgeRuntime,
  msg: Message,
) {
  if (!msg.messageReference?.messageId) return "";

  const message = await runtime.bot.helpers.getMessage(
    msg.channelId,
    msg.messageReference.messageId.toString(),
  );
  return message.content;
}
