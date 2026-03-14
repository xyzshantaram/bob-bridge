# ircbridge

A simple Discord&lt;--&gt;IRC bridge designed for use in Burned Out Bastards.

## Structure

```text
.
├── config.example.json
├── src
│   ├── main.ts
│   ├── app
│   │   └── runtime.ts
│   └── bridge
│       ├── index.ts
│       ├── discord.ts
│       ├── irc.ts
│       ├── relay.ts
│       ├── resolver.ts
│       ├── transforms.ts
│       └── formatting.ts
└── deno.json
```

## Run

`deno run --allow-net --allow-read --allow-import src/main.ts`

or

`deno task run`

`IRC_PASSWORD` may be left empty to connect without SASL/NickServ
authentication. `DISCORD_TOKEN` still needs to be a real bot token. The
`--allow-import` flag is required because a transitive `discordeno` dependency
loads code from `unpkg.com`.

## Validate

- `deno lint src src/bridge`
- `deno check --allow-import src/main.ts src/bridge/index.ts`
- `deno task validate`
