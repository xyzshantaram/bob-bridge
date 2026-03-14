// deno-lint-ignore-file no-control-regex
export type DiscordMentionContext = {
  channelNames: string[];
  userNames: string[];
  roleNames: Map<bigint, string>;
};

export function ircMsgToDiscord(
  members: Record<string, string>,
  text: string,
) {
  if (!text) return "";

  const italicRegex = /\x1D(.+)\x1D/g;
  const boldRegex = /\x02(.+)\x02/g;
  const struckRegex = /\x1E(.+)\x1E/g;

  return text.replace(
    /@((?:"[\w\d ,+_\.]+")|(?:[\w\d,+_\.]+))/g,
    (match) => {
      const member = members[match.slice(1).replace(/"(.+)"/, "$1")];
      if (!member) return `${match}`;
      return `<@${member}>`;
    },
  )
    .replace(italicRegex, "_$1_")
    .replace(boldRegex, "**$1**")
    .replace(struckRegex, "~~$1~~");
}

export function discordTextToIrc(
  content: string,
  context: DiscordMentionContext,
) {
  const floodSafe = content.split("\n").join(" / ");
  let channelCount = 0;
  let userCount = 0;

  return floodSafe.replace(/<(@|#|@&)(\d+)>/g, (_, ...args) => {
    const id = BigInt(args[1]);
    if (args[0] === "#") {
      const channel = context.channelNames[channelCount++];
      return "#" + (channel || "UnknownChannel");
    } else if (args[0] === "@") {
      const user = context.userNames[userCount++];
      return "@" + (user || "UnknownUser");
    }
    return "@[Role](" + (context.roleNames.get(id) || "UnknownRole") + ")";
  })
    .replace(/\*\*(.+?)\*\*/g, "\x02$1\x02")
    .replace(/\*(.+?)\*/g, "\x1D$1\x1D")
    .replace(/~~(.+?)~~/g, "\x1E$1\x1E");
}
