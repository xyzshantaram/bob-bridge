# Architecture

This repository is a small Discord-to-IRC bridge with a deliberately split
layout:

- `src/app` Runtime entrypoint, config loading, and runtime object creation.
- `src/bridge` Bridge behavior: protocol handlers, message transforms,
  formatting, resolver helpers, and orchestration.
- `src/testing` Unit tests, integration-style handler tests, and shared fake
  runtime helpers.

## High-Level Flow

Startup path:

1. `src/app/main.ts` loads `config.json`.
2. `src/bridge/index.ts` creates the runtime and registers protocol handlers.
3. The Discord bot starts.
4. The IRC client connects.

Runtime flow:

- Discord gateway events are registered in `src/bridge/discord.ts`.
- IRC client events are registered in `src/bridge/irc.ts`.
- Shared bridge decisions and outbound IRC line building live in
  `src/bridge/relay.ts`.
- Discord API lookups needed to resolve channels, users, roles, and quoted
  messages live in `src/bridge/resolver.ts`.
- Pure text conversion between Discord/IRC formats lives in
  `src/bridge/transforms.ts`.
- Pure line-formatting helpers for quotes, threads, attachments, embeds,
  stickers, and reactions live in `src/bridge/formatting.ts`.

## Important Files

`src/app/main.ts`

- Minimal entrypoint.
- Calls `loadConfig()` and `startBridge()` only when run as the main module.

`src/app/config.ts`

- Defines `BridgeConfig`.
- Parses and validates `config.json`.
- This is the right place for new config fields and validation rules.

`src/app/runtime.ts`

- Creates the shared runtime object.
- Owns the bot instance, IRC client instance, member map, and edit cache.

`src/bridge/index.ts`

- Assembles the runtime.
- Registers Discord and IRC handlers.
- Starts both protocol clients.
- Installs the SIGINT shutdown relay.

`src/bridge/discord.ts`

- Handles Discord-side events:
  - `messageCreate`
  - `messageUpdate`
  - `reactionAdd`
  - `reactionRemove`
  - `ready`
- This is the main Discord -> IRC control path.

`src/bridge/irc.ts`

- Handles IRC-side events:
  - `privmsg:channel`
  - `ctcp_action`
  - `join`
  - `part`
  - `quit`
  - `nick`
  - `names_reply`
  - `raw:rpl_saslsuccess`
- This is the main IRC -> Discord control path.

`src/bridge/resolver.ts`

- Keeps Discord API lookups out of the pure transform layer.
- Important methods:
  - `resolveBridgedDiscordChannel()`
  - `resolveDiscordMessageText()`
  - `resolveQuotedMessageContent()`

`src/bridge/relay.ts`

- Shared transport and line-building helpers.
- Important methods:
  - `sendIrcLines()`
  - `buildDiscordMessageLine()`
  - `buildReactionLine()`
  - `relayDiscordMessageToIrc()`
  - `relayReactionToIrc()`

`src/bridge/transforms.ts`

- Pure conversion rules between Discord/IRC syntax.
- Important methods:
  - `ircMsgToDiscord()`
  - `discordTextToIrc()`

`src/bridge/formatting.ts`

- Pure string helpers and media-summary helpers.
- Important methods:
  - `truncate()`
  - `getQuoteStr()`
  - `getThreadStr()`
  - `getDiscordMediaLines()`
  - `getReactionLabel()`

## Main Code Paths

Discord message -> IRC:

1. `discord.ts:messageCreate` receives the event.
2. `resolver.ts` decides whether the channel belongs to the bridged channel or a
   bridged thread.
3. `resolver.ts` optionally loads quoted message content.
4. `relay.ts` resolves Discord message text to IRC-safe text.
5. `relay.ts` builds the final line with thread/quote context.
6. `relay.ts` chunks and sends lines to IRC.
7. Media summaries are emitted separately for attachments, embeds, and stickers.

Discord reaction -> IRC:

1. `discord.ts:reactionAdd` or `reactionRemove` receives the event.
2. `resolver.ts` checks whether the event belongs to the bridged channel tree.
3. The target message is fetched for quote context.
4. `relay.ts` builds a reaction line and sends it to IRC.

IRC message -> Discord:

1. `irc.ts:privmsg:channel` receives the event.
2. Messages from the bridge user or other channels are ignored.
3. `transforms.ts` converts IRC styles and `@name` references into Discord
   format.
4. The final line is sent into the bridged Discord channel.

IRC metadata -> Discord:

- `irc.ts` also forwards joins, parts, quits, nick changes, names replies, and
  CTCP actions into Discord with simple status formatting.

## State

Important mutable state in the runtime:

- `members` Username -> Discord user ID map used for IRC `@name` conversion.
- `cache` Recent Discord messages by ID, used for edit relay context.

Current caveat:

- `members` is populated on Discord `ready` and is not kept perfectly in sync
  after later guild-side renames or membership changes.

## Tests

Tests are under `src/testing`.

- Unit tests:
  - config parsing
  - formatting helpers
  - pure transforms
  - resolver behavior
  - relay line builders
- Integration-style tests:
  - Discord handler registration and Discord -> IRC paths
  - IRC handler registration and IRC -> Discord paths

The integration tests use `src/testing/test_runtime.ts`, which provides a fake
runtime with mocked bot/client behavior.

## Where To Change Things

If you want to add a config field:

- Update `src/app/config.ts`.
- Update `config.example.json`.
- Add/adjust tests in `src/testing/config.test.ts`.

If you want to change text conversion rules:

- Update `src/bridge/transforms.ts`.
- Update tests in `src/testing/transforms.test.ts`.

If you want to change line decoration or media summaries:

- Update `src/bridge/formatting.ts` or `src/bridge/relay.ts`.
- Update tests in `src/testing/formatting.test.ts` or
  `src/testing/relay.test.ts`.

If you want to change Discord event behavior:

- Update `src/bridge/discord.ts`.
- Add or update coverage in `src/testing/discord.integration.test.ts`.

If you want to change IRC event behavior:

- Update `src/bridge/irc.ts`.
- Add or update coverage in `src/testing/irc.integration.test.ts`.
