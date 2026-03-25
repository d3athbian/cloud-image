// Service Worker para CLOUD Image Cache
// Usa IndexedDB para persistencia

const DB_NAME = 'cloud-image-cache';
const STORE_NAME = 'images';
const DB_VERSION = 1;

let db = null;

async function openDB() {
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

async function getFromIDB(url) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(url);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveToIDB(url, data, metadata) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const entry = { url, data, metadata, cachedAt: Date.now() };
    const request = store.put(entry);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function deleteFromIDB(url) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(url);
    request.onsuccess = () => resolve(true);
    request.onerror = () => resolve(false);
  });
}

async function clearIDB() {
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
      const entries = request.result;
      const totalSize = entries.reduce((sum, e) => sum + (e.metadata?.size || 0), 0);
      resolve({ itemCount: entries.length, totalSize });
    };
    request.onerror = () => reject(request.error);
  });
}

function isImageURL(url) {
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

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(self.clients.claim());
});

// Fetch Handler - interceptor de todas las REQUESTs de imágenes
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Solo procesar solicitudes de imágenes
  if (!isImageURL(url)) {
    return;
  }

  // Skip navigation requests
  if (event.request.mode === 'navigate') {
    return;
  }

  event.respondWith(handleImageRequest(url));
});

async function handleImageRequest(url) {
  // 1. Intentar leer de IndexedDB
  const cached = await getFromIDB(url);
  
  if (cached) {
    console.log('[SW] Serving from cache:', url);
    const blob = new Blob([cached.data], { type: cached.metadata.mimeType });
    return new Response(blob, {
      headers: { 
        'Content-Type': cached.metadata.mimeType,
        'X-Cache-Status': 'HIT'
      },
    });
  }

  // 2. Si no está en cache, fetch from network
  if (!navigator.onLine) {
    return new Response('Offline - no cached version', { status: 503 });
  }

  try {
    const response = await fetch(url, { cache: 'no-store' });
    
    if (response.ok) {
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      // 3. Guardar en IndexedDB
      await saveToIDB(url, arrayBuffer, {
        size: arrayBuffer.byteLength,
        mimeType: blob.type,
      });
      
      console.log('[SW] Cached new image:', url);
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', url, error);
    return new Response('Failed to load image', { status: 500 });
  }
}

// Message Handler - para comandos desde el main thread
self.addEventListener('message', async (event) => {
  const { id, type, payload } = event.data;
  
  try {
    let response;
    
    switch (type) {
      case 'cache-get': {
        const entry = await getFromIDB(payload.url);
        response = entry ? { found: true, data: entry.data, metadata: entry.metadata } : { found: false };
        break;
      }
      case 'cache-set': {
        await saveToIDB(payload.url, payload.data, payload.metadata);
        response = { stored: true };
        break;
      }
      case 'cache-delete': {
        const deleted = await deleteFromIDB(payload.url);
        response = { deleted };
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