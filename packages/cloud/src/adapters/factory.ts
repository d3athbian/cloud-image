import type { PlatformType } from "../core/types";
import { createMemoryAdapter } from "./memory";
import { createTizenAdapter } from "./tizen";
import type { AdapterConfig, PlatformAdapter } from "./types";
import { createWebAdapter } from "./web";
import { createWebOSAdapter } from "./webos";

export function detectPlatform(): PlatformType {
  if (typeof window === "undefined") {
    return "memory";
  }

  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes("tizen")) {
    return "tizen";
  }

  if (ua.includes("webos") || ua.includes("lgnetcast") || ua.includes("lge;")) {
    return "webos";
  }

  return "web";
}

const adapters: Record<PlatformType, () => PlatformAdapter> = {
  memory: createMemoryAdapter,
  web: createWebAdapter,
  tizen: createTizenAdapter,
  webos: createWebOSAdapter,
};

export function createAdapter(config: AdapterConfig = {}): PlatformAdapter {
  const platform = config.platformOverride ?? detectPlatform();
  const createFn = adapters[platform] ?? adapters.memory;
  return createFn();
}

export type {
  AdapterConfig,
  MemoryAdapter,
  PlatformAdapter,
  PlatformType,
  TizenAdapter,
  WebAdapter,
  WebOSAdapter,
} from "./types";
export { createMemoryAdapter, createTizenAdapter, createWebAdapter, createWebOSAdapter };
