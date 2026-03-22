import { getCacheManager, type CacheEntry, type CacheMetadata } from './cache-manager';
import { getNetworkMonitor, type BandwidthClassification } from './network';
import { decodeImage, validateImageData } from './decoder';

const CACHE_NAME = 'carbon-image-cache-v1';
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

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
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
        return createCachedResponse(cached, true);
      }
      return new Response('Service unavailable', { status: 503 });
    }
  }

  const cached = await cacheManager.get(url);
  if (cached) {
    return createCachedResponse(cached, true);
  }

  if (!navigator.onLine) {
    return new Response('Offline', { status: 503 });
  }

  try {
    const bandwidth = networkMonitor.getBandwidth();
    const variantUrl = bandwidth === 'low' ? getSmallVariantUrl(url) : url;
    
    const response = await fetchWithRetry(variantUrl);
    
    if (!response.ok) {
      if (variantUrl !== url) {
        const fallbackResponse = await fetchWithRetry(url);
        if (fallbackResponse.ok) {
          return processAndCache(fallbackResponse, url, bandwidth);
        }
      }
      recordFailure();
      return response;
    }

    return processAndCache(response, url, bandwidth);
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

async function processAndCache(response: Response, url: string, bandwidth: BandwidthClassification): Promise<Response> {
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  
  const isValid = await validateImageData(arrayBuffer, blob.type);
  if (!isValid) {
    recordFailure();
    return new Response('Invalid image data', { status: 500 });
  }

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
    qualityTier: bandwidth === 'low' ? 'low' : 'high',
    upgradeable: bandwidth === 'low',
    cachedBandwidth: bandwidth === 'low' ? 0 : undefined,
  };

  try {
    await cacheManager.set(entry);
  } catch (error) {
    console.warn('[SW] Cache set failed:', error);
  }

  circuitBreakerFailures = 0;
  return new Response(arrayBuffer, {
    headers: { 'Content-Type': blob.type },
  });
}

function createCachedResponse(entry: CacheEntry, fromCache: boolean): Response {
  const blob = new Blob([entry.data], { type: entry.metadata.mimeType });
  return new Response(blob, {
    headers: {
      'Content-Type': entry.metadata.mimeType,
      'X-From-Cache': fromCache.toString(),
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

function getSmallVariantUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('w', '320');
    urlObj.searchParams.set('q', '60');
    return urlObj.toString();
  } catch {
    return url;
  }
}

self.addEventListener('message', async (event) => {
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
        const result = await cacheManager.set(entry);
        response = result;
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