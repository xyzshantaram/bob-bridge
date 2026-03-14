export const truncate = (
  str: string,
  n: number,
) => (str.length > n ? `${str.substring(0, n)}…` : str);

export const getQuoteStr = (str: string) => ` [> ${truncate(str, 25)}]`;
export const getThreadStr = (str: string) => ` [in ${truncate(str, 15)}]`;

export function chunk(str: string, chunkSize: number = 440): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.slice(i, i + chunkSize));
  }
  return chunks;
}

export type IrcAttachmentLike = {
  filename?: string;
  contentType?: string | null;
  url: string;
};

export type IrcEmbedLike = {
  title?: string;
  description?: string;
  url?: string;
};

export type IrcStickerLike = {
  name?: string;
};

export type IrcMediaMessageLike = {
  attachments?: Array<IrcAttachmentLike | null | undefined>;
  embeds?: Array<IrcEmbedLike | null | undefined>;
  stickerItems?: Array<IrcStickerLike | null | undefined>;
};

export const formatAttachmentForIrc = (attachment: IrcAttachmentLike) => {
  const parts = ["[attachment]"];
  if (attachment.filename) parts.push(attachment.filename);
  if (attachment.contentType) parts.push(`(${attachment.contentType})`);
  parts.push(attachment.url);
  return parts.join(" ");
};

export const formatEmbedForIrc = (embed: IrcEmbedLike) => {
  const parts = ["[embed]"];
  if (embed.title) parts.push(truncate(embed.title, 80));
  if (embed.description) {
    parts.push(truncate(embed.description.replace(/\s+/g, " "), 160));
  }
  if (embed.url) parts.push(embed.url);
  return parts.join(" - ");
};

export const formatStickerForIrc = (sticker: IrcStickerLike) =>
  `[sticker] ${sticker.name || "Sticker"}`;

export const getDiscordMediaLines = (
  msg: IrcMediaMessageLike,
  username: string,
) => {
  const lines: string[] = [];

  for (const attachment of msg.attachments || []) {
    if (attachment) {
      lines.push(`<${username}> ${formatAttachmentForIrc(attachment)}`);
    }
  }

  for (const embed of msg.embeds || []) {
    if (embed) {
      lines.push(`<${username}> ${formatEmbedForIrc(embed)}`);
    }
  }

  for (const sticker of msg.stickerItems || []) {
    if (sticker) {
      lines.push(`<${username}> ${formatStickerForIrc(sticker)}`);
    }
  }

  return lines;
};

export const getReactionLabel = (
  emoji: { id?: bigint | null; name?: string | null },
) => {
  if (emoji.name) return emoji.name;
  return emoji.name || "an emoji";
};
