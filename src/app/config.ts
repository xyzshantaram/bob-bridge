export type BridgeConfig = {
  DISCORD_BRIDGE_CHANNEL: string;
  DISCORD_BRIDGE_SERVER: string;
  DISCORD_TOKEN: string;
  IRC_USER: string;
  IRC_PASSWORD?: string;
  LOG_ALL_MESSAGES?: boolean;
  IRC_CHANNEL: string;
  PREFIX: string;
  IRC_CHANNEL_PASSWORD?: string;
  IRC_SERVER: string;
  IRC_PORT: number;
};

type RawConfig = Record<string, unknown>;

function expectString(
  raw: RawConfig,
  key: keyof BridgeConfig,
): string;
function expectString(
  raw: RawConfig,
  key: keyof BridgeConfig,
  options: { optional: true },
): string | undefined;
function expectString(
  raw: RawConfig,
  key: keyof BridgeConfig,
  { optional = false }: { optional?: boolean } = {},
): string | undefined {
  const value = raw[key];
  if (value === undefined || value === null || value === "") {
    if (optional) return undefined;
    throw new Error(`config.json is missing required string "${key}"`);
  }
  if (typeof value !== "string") {
    throw new Error(`config.json field "${key}" must be a string`);
  }
  return value;
}

function expectBoolean(
  raw: RawConfig,
  key: keyof BridgeConfig,
  defaultValue: boolean,
) {
  const value = raw[key];
  if (value === undefined) return defaultValue;
  if (typeof value !== "boolean") {
    throw new Error(`config.json field "${key}" must be a boolean`);
  }
  return value;
}

function expectPort(raw: RawConfig, key: keyof BridgeConfig) {
  const value = raw[key];
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`config.json field "${key}" must be an integer`);
  }
  if (value < 1 || value > 65535) {
    throw new Error(`config.json field "${key}" must be between 1 and 65535`);
  }
  return value;
}

function expectSnowflakeString(raw: RawConfig, key: keyof BridgeConfig) {
  const value = expectString(raw, key);
  if (!/^\d+$/.test(value)) {
    throw new Error(`config.json field "${key}" must contain only digits`);
  }
  return value;
}

export function parseConfig(raw: RawConfig): BridgeConfig {
  return {
    DISCORD_BRIDGE_CHANNEL: expectSnowflakeString(
      raw,
      "DISCORD_BRIDGE_CHANNEL",
    ),
    DISCORD_BRIDGE_SERVER: expectSnowflakeString(raw, "DISCORD_BRIDGE_SERVER"),
    DISCORD_TOKEN: expectString(raw, "DISCORD_TOKEN"),
    IRC_USER: expectString(raw, "IRC_USER"),
    IRC_PASSWORD: expectString(raw, "IRC_PASSWORD", { optional: true }),
    LOG_ALL_MESSAGES: expectBoolean(raw, "LOG_ALL_MESSAGES", false),
    IRC_CHANNEL: expectString(raw, "IRC_CHANNEL"),
    PREFIX: expectString(raw, "PREFIX"),
    IRC_CHANNEL_PASSWORD: expectString(raw, "IRC_CHANNEL_PASSWORD", {
      optional: true,
    }),
    IRC_SERVER: expectString(raw, "IRC_SERVER"),
    IRC_PORT: expectPort(raw, "IRC_PORT"),
  };
}

export async function loadConfig(): Promise<BridgeConfig> {
  const configUrl = new URL("../../config.json", import.meta.url);
  const configText = await Deno.readTextFile(configUrl);
  return parseConfig(JSON.parse(configText) as RawConfig);
}
