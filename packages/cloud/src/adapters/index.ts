// Adapters module - platform-specific storage implementations
export * from './types';
export * from './factory';
export { MemoryAdapter, createMemoryAdapter } from './memory';
export { WebAdapter, createWebAdapter } from './web';
export { TizenAdapter, createTizenAdapter } from './tizen';
export { WebOSAdapter, createWebOSAdapter } from './webos';
