import { startBridge } from "../bridge/index.ts";
import { loadConfig } from "./config.ts";

if (import.meta.main) {
  await startBridge(await loadConfig());
}
