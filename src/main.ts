import config from "../config.json" with { type: "json" };
import { startBridge } from "./bridge/index.ts";
import type { BridgeConfig } from "./app/runtime.ts";

if (import.meta.main) {
  await startBridge(config as BridgeConfig);
}
