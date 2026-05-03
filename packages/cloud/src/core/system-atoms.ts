import { atom } from 'jotai';
import type { ImageEngine } from './engine';
import { StateSync } from './state-sync';

export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'LOW_BANDWIDTH';
export type PressureLevel = 'low' | 'medium' | 'high';

let stateSyncInstance: StateSync | null = null;

export function getStateSync(): StateSync {
  if (!stateSyncInstance) {
    stateSyncInstance = new StateSync();
    stateSyncInstance.init().catch(() => {});
  }
  return stateSyncInstance;
}

export interface CacheState {
  totalItems: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  lastAccessTime: number;
}

export interface NetworkState {
  status: ConnectionStatus;
  rtt: number;
  lastChecked: number;
}

export interface MemoryState {
  isUnderPressure: boolean;
  pressureLevel: PressureLevel;
  usedJSHeapSize?: number;
  jsHeapSizeLimit?: number;
}

const initialCacheState: CacheState = {
  totalItems: 0,
  totalSize: 0,
  hitCount: 0,
  missCount: 0,
  lastAccessTime: 0,
};

const initialNetworkState: NetworkState = {
  status: 'ONLINE',
  rtt: 0,
  lastChecked: 0,
};

const initialMemoryState: MemoryState = {
  isUnderPressure: false,
  pressureLevel: 'low',
};

export const cacheAtom = atom<CacheState>(initialCacheState);
export const networkAtom = atom<NetworkState>(initialNetworkState);
export const memoryAtom = atom<MemoryState>(initialMemoryState);

export const engineAtom = atom<ImageEngine | null>(null);

export interface CacheStatsDerived {
  itemCount: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
}

export const cacheStatsAtom = atom<CacheStatsDerived>((get) => {
  const cache = get(cacheAtom);
  const total = cache.hitCount + cache.missCount;
  return {
    itemCount: cache.totalItems,
    totalSize: cache.totalSize,
    hitRate: total > 0 ? cache.hitCount / total : 0,
    missRate: total > 0 ? cache.missCount / total : 0,
    evictionCount: 0,
  };
});

export const setCacheAtom = atom(
  (get) => get(cacheAtom),
  (_get, set, update: Partial<CacheState>) => {
    const current = _get(cacheAtom);
    const newState = { ...current, ...update };
    set(cacheAtom, newState);
    getStateSync().syncState('cache', newState);
  },
);

export const setNetworkAtom = atom(
  (get) => get(networkAtom),
  (_get, set, update: Partial<NetworkState>) => {
    const current = _get(networkAtom);
    const newState = { ...current, ...update };
    set(networkAtom, newState);
    getStateSync().syncState('network', newState);
  },
);

export const setMemoryAtom = atom(
  (get) => get(memoryAtom),
  (_get, set, update: Partial<MemoryState>) => {
    const current = _get(memoryAtom);
    const newState = { ...current, ...update };
    set(memoryAtom, newState);
    getStateSync().syncState('memory', newState);
  },
);

let cacheUpdater: ((data: Partial<CacheState>) => void) | null = null;
let networkUpdater: ((data: Partial<NetworkState>) => void) | null = null;
let memoryUpdater: ((data: Partial<MemoryState>) => void) | null = null;

export function registerStateUpdater(
  cache: (data: Partial<CacheState>) => void,
  network: (data: Partial<NetworkState>) => void,
  memory: (data: Partial<MemoryState>) => void,
) {
  cacheUpdater = cache;
  networkUpdater = network;
  memoryUpdater = memory;
}

export function updateCache(data: Partial<CacheState>) {
  if (cacheUpdater) {
    cacheUpdater(data);
  }
  const sync = getStateSync();
  sync.syncState('cache', { ...data });
}

export function updateNetwork(data: Partial<NetworkState>) {
  if (networkUpdater) {
    networkUpdater(data);
  }
  const sync = getStateSync();
  sync.syncState('network', { ...data });
}

export function updateMemory(data: Partial<MemoryState>) {
  if (memoryUpdater) {
    memoryUpdater(data);
  }
  const sync = getStateSync();
  sync.syncState('memory', { ...data });
}

export async function hydrateState(
  setCache: (value: CacheState) => void,
  setNetwork: (value: NetworkState) => void,
  setMemory: (value: MemoryState) => void,
): Promise<void> {
  const sync = getStateSync();
  await sync.init();

  const cache = await sync.readState<CacheState>('cache');
  if (cache) setCache(cache);

  const network = await sync.readState<NetworkState>('network');
  if (network) setNetwork(network);

  const memory = await sync.readState<MemoryState>('memory');
  if (memory) setMemory(memory);
}
