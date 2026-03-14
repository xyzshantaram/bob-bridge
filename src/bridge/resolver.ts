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

type DiscordTarget = {
  channelId: bigint;
  text: string;
};

const THREAD_PREFIX_RE = /^\[in ([^\]]+)\]\s*/;

function normalizeThreadName(name: string) {
  return name.trim().toLowerCase();
}

export async function resolveBridgedDiscordThreads(runtime: BridgeRuntime) {
  const activeThreads = await runtime.bot.helpers.getActiveThreads(
    runtime.guildId,
  );
  return [...activeThreads.threads.values()].filter((channel) =>
    channel.parentId === runtime.channelId && channel.name
  );
}

export async function resolveDiscordTargetFromIrc(
  runtime: BridgeRuntime,
  text: string,
): Promise<DiscordTarget> {
  const match = text.match(THREAD_PREFIX_RE);
  if (!match) {
    return { channelId: runtime.channelId, text };
  }

  const requestedName = normalizeThreadName(match[1]);
  const trimmedText = text.slice(match[0].length);
  const bridgedThreads = await resolveBridgedDiscordThreads(runtime);

  const exactMatch = bridgedThreads.find((channel) =>
    normalizeThreadName(channel.name || "") === requestedName
  );
  if (exactMatch) {
    return { channelId: exactMatch.id, text: trimmedText };
  }

  const prefix = requestedName.endsWith("…")
    ? requestedName.slice(0, -1)
    : requestedName;
  const prefixMatches = bridgedThreads.filter((channel) =>
    normalizeThreadName(channel.name || "").startsWith(prefix)
  );

  if (prefixMatches.length === 1) {
    return { channelId: prefixMatches[0].id, text: trimmedText };
  }

  return { channelId: runtime.channelId, text };
}
