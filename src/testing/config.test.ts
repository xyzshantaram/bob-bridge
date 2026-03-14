import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.203.0/assert/mod.ts";
import { parseConfig } from "../app/config.ts";

const validConfig = {
  DISCORD_BRIDGE_CHANNEL: "123",
  DISCORD_BRIDGE_SERVER: "456",
  DISCORD_TOKEN: "token",
  IRC_USER: "bridge",
  IRC_PASSWORD: "password",
  IRC_CHANNEL: "#bridge",
  PREFIX: "$",
  IRC_SERVER: "irc.example.test",
  IRC_PORT: 6697,
};

Deno.test("parseConfig accepts valid config and defaults LOG_ALL_MESSAGES", () => {
  assertEquals(parseConfig(validConfig), {
    ...validConfig,
    IRC_CHANNEL_PASSWORD: undefined,
    LOG_ALL_MESSAGES: false,
  });
});

Deno.test("parseConfig rejects missing required fields", () => {
  assertThrows(
    () => parseConfig({ ...validConfig, DISCORD_TOKEN: "" }),
    Error,
    'config.json is missing required string "DISCORD_TOKEN"',
  );
});

Deno.test("parseConfig rejects non-numeric discord ids", () => {
  assertThrows(
    () => parseConfig({ ...validConfig, DISCORD_BRIDGE_CHANNEL: "abc" }),
    Error,
    'config.json field "DISCORD_BRIDGE_CHANNEL" must contain only digits',
  );
});

Deno.test("parseConfig rejects invalid IRC ports", () => {
  assertThrows(
    () => parseConfig({ ...validConfig, IRC_PORT: 70000 }),
    Error,
    'config.json field "IRC_PORT" must be between 1 and 65535',
  );
});

Deno.test("parseConfig rejects non-boolean LOG_ALL_MESSAGES", () => {
  assertThrows(
    () => parseConfig({ ...validConfig, LOG_ALL_MESSAGES: "yes" as never }),
    Error,
    'config.json field "LOG_ALL_MESSAGES" must be a boolean',
  );
});

Deno.test("parseConfig accepts optional IRC_CHANNEL_PASSWORD when present", () => {
  assertEquals(
    parseConfig({ ...validConfig, IRC_CHANNEL_PASSWORD: "secret" }),
    {
      ...validConfig,
      IRC_CHANNEL_PASSWORD: "secret",
      LOG_ALL_MESSAGES: false,
    },
  );
});

Deno.test("parseConfig allows IRC_PASSWORD to be omitted", () => {
  assertEquals(
    parseConfig({ ...validConfig, IRC_PASSWORD: "" }),
    {
      ...validConfig,
      IRC_PASSWORD: undefined,
      IRC_CHANNEL_PASSWORD: undefined,
      LOG_ALL_MESSAGES: false,
    },
  );
});
