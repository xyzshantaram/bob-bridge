import type { Message } from "https://deno.land/x/discordeno@18.0.1/mod.ts";
import {
  chunk,
  getDiscordMediaLines,
  getQuoteStr,
  getReactionLabel,
  getThreadStr,
} from "./formatting.ts";
import type { BridgeRuntime } from "../app/runtime.ts";
import { ircMsgToDiscord as ircTextToDiscord } from "./transforms.ts";
import { resolveDiscordMessageText } from "./resolver.ts";

export const delay = (duration: number) =>
  new Promise((resolve) => setTimeout(resolve, duration));

export async function sendIrcLines(
  runtime: BridgeRuntime,
  lines: string[],
  pauseMs = 250,
) {
  for (const line of lines) {
    for (const piece of chunk(line, 400)) {
      runtime.client.privmsg(runtime.config.IRC_CHANNEL, piece);
      await delay(pauseMs);
    }
  }
}

export function ircMsgToDiscord(runtime: BridgeRuntime, text: string) {
  return ircTextToDiscord(runtime.members, text);
}

export async function discordMsgToIrc(
  runtime: BridgeRuntime,
  msg: Message,
) {
  return await resolveDiscordMessageText(runtime, msg);
}

export function buildDiscordMessageLine(
  username: string,
  messageText: string,
  threadName: string,
  quoteContent: string,
) {
  let prelude = `<${username}>`;
  if (threadName) prelude += getThreadStr(threadName);
  if (quoteContent) prelude += getQuoteStr(quoteContent);
  return `${prelude} ${messageText}`;
}

export function buildReactionLine(
  username: string,
  action: "reacted with" | "removed reaction",
  emoji: { id?: bigint | null; name?: string | null },
  messageContent: string,
  threadName: string,
) {
  let content = `*** ${username} ${action} ${getReactionLabel(emoji)}`;
  if (threadName) content += getThreadStr(threadName);
  if (messageContent) content += getQuoteStr(messageContent);
  return content;
}

export async function relayDiscordMessageToIrc(
  runtime: BridgeRuntime,
  msg: Message,
  threadName: string,
  quoteContent: string,
  username: string,
) {
  if (msg.content?.trim()) {
    const content = buildDiscordMessageLine(
      username,
      await discordMsgToIrc(runtime, msg),
      threadName,
      quoteContent,
    );
    await sendIrcLines(runtime, [content]);
  }

  await sendIrcLines(runtime, getDiscordMediaLines(msg, username), 500);
}

export async function relayReactionToIrc(
  runtime: BridgeRuntime,
  username: string,
  action: "reacted with" | "removed reaction",
  emoji: { id?: bigint | null; name?: string | null },
  messageContent: string,
  threadName: string,
) {
  await sendIrcLines(runtime, [
    buildReactionLine(username, action, emoji, messageContent, threadName),
  ]);
}
