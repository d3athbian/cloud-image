import type { PlatformType } from '../core/types';
import type { PlatformAdapter, AdapterConfig } from './types';
import { createMemoryAdapter } from './memory';
import { createWebAdapter } from './web';
import { createTizenAdapter } from './tizen';
import { createWebOSAdapter } from './webos';

export function detectPlatform(): PlatformType {
  if (typeof window === 'undefined') {
    return 'memory';
  }

  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('tizen')) {
    return 'tizen';
  }

  if (ua.includes('webos') || ua.includes('lgnetcast') || ua.includes('lge;')) {
    return 'webos';
  }

  return 'web';
}

export function createAdapter(config: AdapterConfig = {}): PlatformAdapter {
  const platform = config.platformOverride ?? detectPlatform();

  switch (platform) {
    case 'memory':
      return createMemoryAdapter();
    case 'web':
      return createWebAdapter();
    case 'tizen':
      return createTizenAdapter();
    case 'webos':
      return createWebOSAdapter();
    default:
      return createMemoryAdapter();
  }
}

export { type PlatformType, type PlatformAdapter, type AdapterConfig } from './types';
export { MemoryAdapter, createMemoryAdapter } from './memory';
export { WebAdapter, createWebAdapter } from './web';
export { TizenAdapter, createTizenAdapter } from './tizen';
export { WebOSAdapter, createWebOSAdapter } from './webos';
