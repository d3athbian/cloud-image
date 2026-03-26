const FETCH_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_TIMEOUT = 30000;

const DB_NAME = 'cloud-image-cache';
const STORE_NAME = 'images';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;
let circuitBreakerFailures = 0;
let circuitBreakerLastFailure = 0;
let circuitBreakerOpen = false;

const stats = { hits: 0, misses: 0 };

interface CacheEntry {
  url: string;
  data: ArrayBuffer;
  metadata: {
    size: number;
    mimeType: string;
    cachedAt: number;
    accessedAt: number;
    accessCount: number;
  };
  qualityTier: 'low' | 'medium' | 'high';
  upgradeable: boolean;
}

async function openDB(): Promise<IDBDatabase> {
  if (db) return db;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'url' });
      }
    };
  });
}

async function getFromIDB(url: string): Promise<CacheEntry | null> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(url);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function saveToIDB(entry: CacheEntry): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(entry);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function deleteFromIDB(url: string): Promise<boolean> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(url);
    request.onsuccess = () => resolve(true);
    request.onerror = () => resolve(false);
  });
}

async function clearIDB(): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getStatsFromIDB() {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const entries = request.result || [];
      const totalSize = entries.reduce((sum, e) => sum + (e.metadata?.size || 0), 0);
      const total = stats.hits + stats.misses;
      resolve({
        itemCount: entries.length,
        totalSize,
        hitRate: total > 0 ? stats.hits / total : 0,
        missRate: total > 0 ? stats.misses / total : 0,
        evictionCount: 0,
      });
    };
    request.onerror = () => reject(request.error);
  });
}

function isImageURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'];
    const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));
    const isPicsum = urlObj.hostname.includes('picsum');
    return hasImageExtension || isPicsum;
  } catch {
    return false;
  }
}

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activating...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const url = event.request.url;

  if (!isImageURL(url)) return;
  if (event.request.mode === 'navigate') return;

  event.respondWith(handleFetch(url));
});

async function handleFetch(url: string): Promise<Response> {
  if (circuitBreakerOpen) {
    if (Date.now() - circuitBreakerLastFailure > CIRCUIT_BREAKER_TIMEOUT) {
      circuitBreakerOpen = false;
      circuitBreakerFailures = 0;
    } else {
      const cached = await getFromIDB(url);
      if (cached) {
        stats.hits++;
        return createCachedResponse(cached);
      }
      return new Response('Service unavailable', { status: 503 });
    }
  }

  const cached = await getFromIDB(url);
  if (cached) {
    stats.hits++;
    return createCachedResponse(cached);
  }

  stats.misses++;

  if (!navigator.onLine) {
    return new Response('Offline', { status: 503 });
  }

  try {
    const response = await fetchWithRetry(url);
    if (response.ok) {
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      // Get mimeType from blob or infer from URL
      let mimeType = blob.type;
      if (!mimeType || mimeType === 'application/octet-stream') {
        const urlObj = new URL(url);
        const ext = urlObj.pathname.split('.').pop()?.toLowerCase();
        const extToMime: Record<string, string> = {
          'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
          'webp': 'image/webp', 'gif': 'image/gif', 'svg': 'image/svg+xml',
        };
        mimeType = ext && extToMime[ext] ? extToMime[ext] : 'image/jpeg';
      }
      
      const entry: CacheEntry = {
        url,
        data: arrayBuffer,
        metadata: {
          size: arrayBuffer.byteLength,
          mimeType: mimeType,
          cachedAt: Date.now(),
          accessedAt: Date.now(),
          accessCount: 1,
        },
        qualityTier: 'high',
        upgradeable: false,
      };
      await saveToIDB(entry);
    }
    circuitBreakerFailures = 0;
    return response;
  } catch (error) {
    circuitBreakerFailures++;
    circuitBreakerLastFailure = Date.now();
    if (circuitBreakerFailures >= CIRCUIT_BREAKER_THRESHOLD) {
      circuitBreakerOpen = true;
    }
    return new Response('Fetch failed', { status: 500 });
  }
}

async function fetchWithRetry(url: string, attempt = 1): Promise<Response> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    const response = await fetch(url, { 
      signal: controller.signal, 
      cache: 'no-store',
      redirect: 'follow',
      credentials: 'include'
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 100));
      return fetchWithRetry(url, attempt + 1);
    }
    throw error;
  }
}

function createCachedResponse(entry: CacheEntry): Response {
  const blob = new Blob([entry.data], { type: entry.metadata.mimeType });
  return new Response(blob, {
    headers: { 'Content-Type': entry.metadata.mimeType, 'X-Cache-Status': 'HIT' },
  });
}

self.addEventListener('message', async (event: MessageEvent) => {
  const { id, type, payload } = event.data;
  console.log('[SW] Received message:', type, id);
  
  try {
    let response: unknown;
    switch (type) {
      case 'fetch': {
        const url = payload.url;
        console.log('[SW] Fetch request for:', url);
        const cached = await getFromIDB(url);
        if (cached) {
          console.log('[SW] Found in cache:', url);
          const blobUrl = URL.createObjectURL(new Blob([cached.data], { type: cached.metadata.mimeType }));
          response = { blobUrl, fromCache: true, size: cached.data.byteLength, mimeType: cached.metadata.mimeType };
        } else {
          console.log('[SW] Not in cache, fetching:', url);
          const fetchResp = await fetch(url, { 
            redirect: 'follow',
            credentials: 'include'
          });
          if (fetchResp.ok) {
            const blob = await fetchResp.blob();
            const arrayBuffer = await blob.arrayBuffer();
            
            // Get mimeType from blob or infer from URL
            let mimeType = blob.type;
            if (!mimeType || mimeType === 'application/octet-stream') {
              // Try to infer from URL extension
              const urlObj = new URL(url);
              const ext = urlObj.pathname.split('.').pop()?.toLowerCase();
              const extToMime: Record<string, string> = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'webp': 'image/webp',
                'gif': 'image/gif',
                'svg': 'image/svg+xml',
              };
              mimeType = ext && extToMime[ext] ? extToMime[ext] : 'image/jpeg';
            }
            
            const entry: CacheEntry = {
              url,
              data: arrayBuffer,
              metadata: {
                size: arrayBuffer.byteLength,
                mimeType: mimeType,
                cachedAt: Date.now(),
                accessedAt: Date.now(),
                accessCount: 1,
              },
              qualityTier: 'high',
              upgradeable: false,
            };
            await saveToIDB(entry);
            console.log('[SW] Cached new image:', url, 'size:', arrayBuffer.byteLength);
            const blobUrl = URL.createObjectURL(blob);
            response = { blobUrl, fromCache: false, size: arrayBuffer.byteLength, mimeType: blob.type };
          } else {
            console.log('[SW] Fetch failed with status:', fetchResp.status);
            response = { error: 'Fetch failed', status: fetchResp.status };
          }
        }
        break;
      }
      case 'cache-get': {
        const entry = await getFromIDB(payload.url);
        response = entry ? { found: true, data: entry.data, metadata: entry.metadata } : { found: false };
        break;
      }
      case 'cache-set': {
        const entry: CacheEntry = {
          url: payload.url,
          data: payload.data,
          metadata: payload.metadata,
          qualityTier: 'high',
          upgradeable: false,
        };
        await saveToIDB(entry);
        response = { stored: true };
        break;
      }
      case 'cache-delete': {
        response = { deleted: await deleteFromIDB(payload.url) };
        break;
      }
      case 'cache-clear': {
        await clearIDB();
        response = { cleared: true };
        break;
      }
      case 'stats': {
        response = await getStatsFromIDB();
        break;
      }
      case 'ping': {
        response = { alive: true };
        break;
      }
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
    self.clients.matchAll().then(clients => {
      clients.forEach(client => client.postMessage({ id, type: 'success', payload: response }));
    });
  } catch (error) {
    console.log('[SW] Error handling message:', error);
    self.clients.matchAll().then(clients => {
      clients.forEach(client => client.postMessage({ id, type: 'error', error: error instanceof Error ? error.message : 'Unknown error' }));
    });
  }
});

export interface SWRequest<T = unknown> {
  id: string;
  type: string;
  payload?: T;
  timestamp: number;
}

export interface SWResponse<T = unknown> {
  id: string;
  type: 'success' | 'error';
  payload?: T;
  error?: string;
  timestamp: number;
}