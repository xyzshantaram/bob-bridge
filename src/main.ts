// deno-lint-ignore-file no-control-regex
import { Client } from "https://deno.land/x/irc@v0.14.0/mod.ts";
import { createBot, Intents, Message, startBot } from "https://deno.land/x/discordeno@18.0.1/mod.ts";
import config from "../config.json" with { type: 'json' };
import { LRUCache } from "npm:lru-cache@11.0.0";

const CHANNEL_ID = BigInt(config.DISCORD_BRIDGE_CHANNEL);
const GUILD_ID = BigInt(config.DISCORD_BRIDGE_SERVER);

const bot = createBot({
    token: config.DISCORD_TOKEN,
    intents: Intents.GuildMessages | Intents.Guilds | Intents.MessageContent | Intents.GuildMembers
});

const client = new Client({
    authMethod: "sasl",
    nick: config.IRC_USER,
    password: config.IRC_PASSWORD,
    verbose: config.LOG_ALL_MESSAGES ? 'raw' : undefined
})

const ircMsgToDiscord = (text: string) => {
    if (!text) return '';

    const italicRegex = /\x1D(.+)\x1D/g;
    const boldRegex = /\x02(.+)\x02/g;
    const struckRegex = /\x1E(.+)\x1E/g;

    return text.replace(/@((?:"[\w\d ,+_\.]+")|(?:[\w\d,+_\.]+))/g, (match, ...args) => {
        const member = members[match.slice(1).replace(/"(.+)"/, "$1")];
        console.log(member, args);
        if (!member) return `${match}`;
        return `<@${member}>`;
    })
        .replace(italicRegex, '_$1_')
        .replace(boldRegex, '**$1**')
        .replace(struckRegex, '~~$1~~');
}

client.on("privmsg:channel", async (payload) => {
    if (payload.source?.name === config.IRC_USER) return;
    if (payload.params.target !== config.IRC_CHANNEL) return;

    if (payload.params.text.startsWith(config.PREFIX)) {
        if (payload.params.text === '$listnicks') {
            client.privmsg(config.IRC_CHANNEL, `Discord users: @${Object.keys(members).map(i =>
                (i.includes(",") || i.includes(" ")) ? `"${i}"` : i
            ).join(' @')}`);
        }
    }

    await bot.helpers.sendMessage(CHANNEL_ID, {
        content: `<${payload.source?.name || 'User'}> ${ircMsgToDiscord(payload.params.text)}`
    })
})

client.on("ctcp_action", async (payload) => {
    await bot.helpers.sendMessage(CHANNEL_ID, {
        content: `*** * ${payload.source?.name || 'User'} ${ircMsgToDiscord(payload.params.text)}`
    })
})

client.once("raw:rpl_saslsuccess", async () => {
    await bot.helpers.sendMessage(CHANNEL_ID, {
        content: "Bridge connected to IRC and registered via SASL."
    })
    client.join([config.IRC_CHANNEL, config.IRC_CHANNEL_PASSWORD]);
});

client.on("join", async (payload) => {
    if (payload.source?.name === config.IRC_USER) {
        return await bot.helpers.sendMessage(CHANNEL_ID, {
            content: `*** Bridge joined ${config.IRC_CHANNEL}`
        })
    }

    await bot.helpers.sendMessage(CHANNEL_ID, {
        content: `*** ${payload.source?.name || "Someone"} joined the channel`
    })
})

client.on("part", async (payload) => {
    if (payload.source?.name === config.IRC_USER) return;
    await bot.helpers.sendMessage(CHANNEL_ID, {
        content: `*** ${payload.source?.name || "Someone"} has left the channel [${payload.params.comment || 'No part message'}]`
    })
})

client.on("quit", async (payload) => {
    if (payload.source?.name === config.IRC_USER) return;
    await bot.helpers.sendMessage(CHANNEL_ID, {
        content: `*** ${payload.source?.name || "Someone"} quit [${payload.params.comment || 'No quit message'}]`
    })
})

client.on("nick", async (payload) => {
    if (payload.source?.name === config.IRC_USER) return;
    await bot.helpers.sendMessage(CHANNEL_ID, {
        content: `*** ${payload.source?.name || "Someone"} is now known as ${payload.params.nick}`
    })
})

const discordMsgToIrc = async (msg: Message) => {
    const floodSafe = msg.content.split('\n').join(' / ');
    const channels = await Promise.all(
        msg.mentionedChannelIds.map(async channelId => (await bot.helpers.getChannel(channelId)).name));
    const users = await Promise.all(
        msg.mentionedUserIds.map(async userId => (await bot.helpers.getUser(userId)).username));
    const roles = await bot.helpers.getRoles(msg.guildId!);

    let channelCount = 0;
    let userCount = 0;

    return floodSafe.replace(/<(@|#|@&)(\d+)>/g, (_, ...args) => {
        const id = BigInt(args[1]);
        if (args[0] === '#') {
            const channel = channels[channelCount++];
            return '#' + (channel || 'UnknownChannel');
        }
        else if (args[0] === '@') {
            const user = users[userCount++];
            return '@' + (user || 'UnknownUser');
        }
        return '@[Role](' + (roles.get(id)?.name || 'UnknownRole') + ')';
    })
        .replace(/\*(.+?)\*/g, '\x1D$1\x1D')
        .replace(/\*\*(.+?)\*\*/g, '\x02$1\x02')
        .replace(/~~(.+?)~~/g, '\x1E$1\x1E');
}

client.on("names_reply", async (msg) => {
    const content = `Users in **${msg.params.channel}**: ${Object.keys(msg.params.names).join(', ')}`; // name of the channel
    await bot.helpers.sendMessage(CHANNEL_ID, { content });
});

const truncate = (str: string, n: number) => (str.length > n ? `${str.substring(0, n)}…` : str);
const getQuoteStr = (str: string) => ` [> ${truncate(str, 25)}]`;
const getThreadStr = (str: string) => ` [in ${truncate(str, 15)}]`;

const cache = new LRUCache<bigint, Message>({ max: 1000 });

bot.events.messageCreate = async (bot, msg) => {
    let threadName = '';
    if (!msg.guildId || !msg.member) return;
    if (msg.channelId !== CHANNEL_ID) {
        const id = msg.channelId;
        const chan = await bot.helpers.getChannel(id);
        if (chan.parentId !== CHANNEL_ID) return;
        threadName = chan.name || 'Thread';
    }

    cache.set(msg.id, msg);

    let quoteContent = '';
    if (msg.messageReference
        && msg.messageReference.messageId) {
        const message = await bot.helpers
            .getMessage(msg.channelId, msg.messageReference.messageId.toString());
        quoteContent = message.content;
    }

    if (msg.member.id !== bot.id) {
        if (msg.content.startsWith(config.PREFIX)) {
            if (msg.content === config.PREFIX + 'listnicks') {
                client.names(config.IRC_CHANNEL);
            }
        }

        const member = await bot.helpers.getMember(msg.guildId, msg.member.id);
        if (msg.content?.trim()) {
            let prelude = `<${member.user?.username || 'UnknownUser'}>`;
            if (threadName) prelude += getThreadStr(threadName);
            if (quoteContent) prelude += getQuoteStr(quoteContent);
            client.privmsg(config.IRC_CHANNEL, `${prelude} ${await discordMsgToIrc(msg)}`);
        }
        if (msg.attachments) {
            let timeout = 0;
            const fmt = (user: string, url: string) => `${user} sent ${url}`;
            for (let i = 0; i < msg.attachments.length; i++) {
                if (msg.attachments[i]) {
                    setTimeout(() =>
                        client.privmsg(config.IRC_CHANNEL, fmt(member.user?.username || "User", msg.attachments[i].url)),
                        (timeout += 500));
                }
            }
        }
    }
}

bot.events.messageUpdate = async (bot, msg) => {
    if (!msg.guildId || !msg.member) return;
    const member = await bot.helpers.getMember(msg.guildId, msg.member.id);
    const oldMsg = cache.get(msg.id);
    if (!oldMsg) return;
    client.privmsg(config.IRC_CHANNEL, `*** ${member.user?.username || 'UnknownUser'} edited: ${getQuoteStr(oldMsg.content)} to \`${await discordMsgToIrc(msg)}\``);
    cache.set(msg.id, msg);
}

bot.events.ready = async (bot, _) => {
    const gottenMembers = await bot.helpers.getMembers(GUILD_ID, { limit: 1000 });
    gottenMembers.forEach((member) => {
        members[member.user?.username || ""] = member.id.toString();
    })
    console.log('Discord side ready...')
}

await startBot(bot);
const members: Record<string, string> = {};
await client.connect(config.IRC_SERVER, config.IRC_PORT, true);
console.log('running');

Deno.addSignalListener('SIGINT', async () => {
    const content = "Goodbye, cruel world! (jk, caught a SIGINT, bbl)"
    await bot.helpers.sendMessage(CHANNEL_ID, { content });

    client.privmsg(config.IRC_CHANNEL, content);
    Deno.exit(0);
})
