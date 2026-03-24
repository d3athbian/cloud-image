import { getCacheManager, type CacheEntry } from './cache-manager';
import { getNetworkMonitor } from './network';

const FETCH_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_TIMEOUT = 30000;

let circuitBreakerFailures = 0;
let circuitBreakerLastFailure = 0;
let circuitBreakerOpen = false;

const cacheManager = getCacheManager();
const networkMonitor = getNetworkMonitor();

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('install', (event: ExtendableEvent) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);
  
  if (!url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
    return;
  }

  if (event.request.mode === 'navigate') {
    return;
  }

  event.respondWith(handleFetch(event.request));
});

async function handleFetch(request: Request): Promise<Response> {
  const url = request.url;

  if (circuitBreakerOpen) {
    if (Date.now() - circuitBreakerLastFailure > CIRCUIT_BREAKER_TIMEOUT) {
      circuitBreakerOpen = false;
      circuitBreakerFailures = 0;
    } else {
      const cached = await cacheManager.get(url);
      if (cached) {
        return createCachedResponse(cached);
      }
      return new Response('Service unavailable', { status: 503 });
    }
  }

  const cached = await cacheManager.get(url);
  if (cached) {
    return createCachedResponse(cached);
  }

  if (!navigator.onLine) {
    return new Response('Offline', { status: 503 });
  }

  try {
    const response = await fetchWithRetry(url);
    
    if (response.ok) {
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      const entry: CacheEntry = {
        url,
        data: arrayBuffer,
        metadata: {
          size: arrayBuffer.byteLength,
          mimeType: blob.type,
          cachedAt: Date.now(),
          accessedAt: Date.now(),
          accessCount: 1,
        },
        qualityTier: 'high',
        upgradeable: false,
      };

      await cacheManager.set(entry);
    }

    circuitBreakerFailures = 0;
    return response;
  } catch (error) {
    recordFailure();
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
    headers: { 
      'Content-Type': entry.metadata.mimeType,
      'X-Cache-Status': 'HIT'
    },
  });
}

function recordFailure(): void {
  circuitBreakerFailures++;
  circuitBreakerLastFailure = Date.now();
  
  if (circuitBreakerFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreakerOpen = true;
  }
}

self.addEventListener('message', async (event: MessageEvent) => {
  const { id, type, payload } = event.data;
  
  try {
    let response: unknown;
    
    switch (type) {
      case 'cache-get': {
        const entry = await cacheManager.get(payload.url);
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
        await cacheManager.set(entry);
        response = { stored: true };
        break;
      }
      case 'cache-delete': {
        const result = await cacheManager.delete(payload.url);
        response = { deleted: result };
        break;
      }
      case 'cache-clear': {
        await cacheManager.clear();
        response = { cleared: true };
        break;
      }
      case 'stats': {
        response = cacheManager.getStats();
        break;
      }
      case 'ping': {
        response = { alive: true };
        break;
      }
      case 'measure-rtt': {
        const rtt = await networkMonitor.measureRTT(payload.url);
        response = { rtt, bandwidth: networkMonitor.getBandwidth() };
        break;
      }
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
    
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ id, type: 'success', payload: response });
      });
    });
  } catch (error) {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ 
          id, 
          type: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      });
    });
  }
});