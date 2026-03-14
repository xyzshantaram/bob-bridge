# Repository Guidelines

## Project Structure & Module Organization

This repository is a small Deno-based Discord-to-IRC bridge. The runtime
entrypoint lives at `src/app/main.ts`. Runtime setup and config loading live
under `src/app/`, bridge behavior and protocol handlers live under
`src/bridge/`, and tests live under `src/testing/`. Top-level docs are minimal:
`README.md` is the short project overview, `CHANGELOG.md` tracks user-visible
changes, and `deno.lock` pins external dependencies. A local `config.json` is
required at the repo root for tokens, channel IDs, and IRC settings, but it
should not be committed. `config.example.json` provides a safe template, and
`docs/ARCHITECTURE.md` is the main source walkthrough for new contributors.
`IRC_PASSWORD` may be left empty when connecting to IRC without SASL/NickServ
authentication.

## Build, Test, and Development Commands

Use Deno directly; there is no `package.json` or Makefile in this repo.

- `deno run --allow-net --allow-read --allow-import src/app/main.ts` starts the
  bridge locally.
- `deno task run` starts the bridge using the committed Deno task config.
- `cp config.example.json config.json` creates a starting config file with
  placeholders.
- `deno fmt src/app src/bridge src/testing AGENTS.md` formats source and docs.
- `deno lint src/app src/bridge src/testing` runs the configured Deno linter.
- `deno check --allow-import src/app/main.ts src/bridge/index.ts` type-checks
  the main runtime modules without starting the bot.
- `deno test --allow-import src/testing` runs the committed unit and
  integration-style tests.
- `deno task validate` runs the full formatter, linter, type-check, and test
  suite.

Run commands from the repository root so relative imports such as
`../config.json` resolve correctly.

## Coding Style & Naming Conventions

Follow the existing TypeScript style in the `src/app/` and `src/bridge/`
modules: 2-space indentation, semicolons omitted, double quotes for strings, and
`const` by default. Prefer descriptive camelCase names for functions and
variables such as `discordMsgToIrc` and `ircMsgToDiscord`. Keep
protocol-specific wiring in `src/bridge/discord.ts` and `src/bridge/irc.ts`,
pure conversion logic in `src/bridge/transforms.ts` and
`src/bridge/formatting.ts`, and avoid expanding event handlers inline when a
helper can carry the logic more clearly. Use `deno fmt` and `deno lint` before
submitting changes.

For architecture and code-path orientation, read `docs/ARCHITECTURE.md` before
making structural changes.

## Testing Guidelines

There is a committed `deno test` suite under `src/testing/`. Treat `deno lint`,
`deno check --allow-import`, and `deno test --allow-import src/testing` as the
minimum validation gate, then verify the changed bridge path manually against a
disposable Discord/IRC setup when changing live relay behavior. Keep new tests
under `src/testing/` as `*.test.ts` files and prefer unit coverage for pure
helpers plus integration-style coverage for Discord/IRC handler wiring.

## Commit & Pull Request Guidelines

Recent history favors short, imperative commit subjects like `fix long messages`
and `handle message edits`. Keep that style, but avoid vague summaries. Pull
requests should explain the bridge behavior changed, note any `config.json` or
permission implications, and include relay examples or screenshots when message
formatting/output changed.

## Security & Configuration Tips

Never commit Discord tokens, IRC credentials, or populated `config.json` files.
Sanitize logs and screenshots before sharing them in issues or PRs.
