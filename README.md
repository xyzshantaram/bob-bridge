# ircbridge

A simple Discord&lt;--&gt;IRC bridge designed for use in Burned Out Bastards.

Architecture and source walkthrough:

- `docs/ARCHITECTURE.md`

## Run

`deno run --allow-net --allow-read --unstable src/app/main.ts`

or

`deno task run`

## Validate

- `deno lint src/app src/bridge src/testing`
- `deno check --allow-import src/app/main.ts src/bridge/index.ts`
- `deno test --allow-import src/testing`
- `deno task validate`
