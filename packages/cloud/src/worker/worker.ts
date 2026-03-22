import { getPerformanceMonitor, type PerformanceSample } from '../core/performance';
import { getLogger } from '../core/logger';

export interface ImageDecodeResult {
  imageBitmap?: ImageBitmap;
  width: number;
  height: number;
  correlationId: string;
}

export interface WorkerMessage {
  id: string;
  type: string;
  payload?: unknown;
  correlationId?: string;
  timestamp: number;
}

export interface WorkerResponse {
  id: string;
  type: 'success' | 'error';
  payload?: unknown;
  error?: string;
  correlationId?: string;
  timestamp: number;
}

interface QueuedMessage {
  resolve: (result: WorkerResponse) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

interface PendingBatch {
  messages: WorkerMessage[];
  timeout: ReturnType<typeof setTimeout>;
  resolve: (results: WorkerResponse[]) => void;
}

const BATCH_DELAY = 5; // ms to wait for batching
const MAX_BATCH_SIZE = 10;
const MESSAGE_TIMEOUT = 30000;

export class ImageWorkerClient {
  private worker: Worker | null = null;
  private pending = new Map<string, QueuedMessage>();
  private batchQueue: PendingBatch | null = null;
  private crashHandler: (() => void) | null = null;
  private logger = getLogger();
  private monitor = getPerformanceMonitor();
  private correlationIdCounter = 0;

  createWorker(onCrash?: () => void): Worker {
    this.crashHandler = onCrash || null;

    const workerCode = `
      const pendingOperations = new Map();
      const imageBitmapCache = new Map();

      self.onmessage = async (event) => {
        const { id, type, payload, correlationId } = event.data;
        const startTime = performance.now();

        try {
          switch (type) {
            case 'fetch':
              await handleFetch(id, payload, correlationId, startTime);
              break;
            case 'decode':
              await handleDecode(id, payload, correlationId, startTime);
              break;
            case 'batch':
              await handleBatch(id, payload, correlationId, startTime);
              break;
            case 'ping':
              self.postMessage({ id, type: 'success', payload: { alive: true }, correlationId, timestamp: Date.now() });
              break;
            case 'clear':
              imageBitmapCache.clear();
              self.postMessage({ id, type: 'success', payload: { cleared: true }, correlationId, timestamp: Date.now() });
              break;
            default:
              throw new Error('Unknown message type: ' + type);
          }
        } catch (error) {
          self.postMessage({ 
            id, 
            type: 'error', 
            error: error.message,
            correlationId,
            timestamp: Date.now(),
            duration: performance.now() - startTime
          });
        }
      };

      async function handleFetch(id, payload, correlationId, startTime) {
        const { url } = payload;
        const response = await fetch(url);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        
        self.postMessage({
          id,
          type: 'success',
          payload: { 
            data: arrayBuffer,
            mimeType: blob.type,
            size: arrayBuffer.byteLength
          },
          correlationId,
          timestamp: Date.now(),
          duration: performance.now() - startTime
        }, [arrayBuffer]);
      }

      async function handleDecode(id, payload, correlationId, startTime) {
        const { data, mimeType, url } = payload;
        
        const bitmap = await createImageBitmap(new Blob([data], { type: mimeType }));
        const result = {
          width: bitmap.width,
          height: bitmap.height,
          hasAlpha: bitmap.width > 0
        };

        imageBitmapCache.set(url, bitmap);

        self.postMessage({
          id,
          type: 'success',
          payload: result,
          correlationId,
          timestamp: Date.now(),
          duration: performance.now() - startTime
        });
      }

      async function handleBatch(id, payload, correlationId, startTime) {
        const { messages } = payload;
        const results = [];

        for (const msg of messages) {
          try {
            if (msg.type === 'fetch') {
              const response = await fetch(msg.payload.url);
              const blob = await response.blob();
              const arrayBuffer = await blob.arrayBuffer();
              results.push({
                originalId: msg.id,
                type: 'success',
                payload: { data: arrayBuffer, mimeType: blob.type, size: arrayBuffer.byteLength }
              });
            }
          } catch (error) {
            results.push({
              originalId: msg.id,
              type: 'error',
              error: error.message
            });
          }
        }

        self.postMessage({
          id,
          type: 'success',
          payload: { results },
          correlationId,
          timestamp: Date.now(),
          duration: performance.now() - startTime
        });
      }
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    this.worker = new Worker(url);

    this.worker.onmessage = this.handleMessage.bind(this);
    this.worker.onerror = this.handleError.bind(this);

    URL.revokeObjectURL(url);
    return this.worker;
  }

  private handleMessage(event: MessageEvent<WorkerResponse>): void {
    const response = event.data;
    const duration = (response as unknown as { duration?: number }).duration;
    
    if (response.correlationId) {
      const sample: PerformanceSample = {
        timestamp: response.timestamp,
        type: 'message',
        duration: duration || 0,
        correlationId: response.correlationId,
      };
      this.monitor.addSample(sample);
      this.logger.logDuration(response.correlationId, 'worker.message', duration || 0);
    }

    const pending = this.pending.get(response.id);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.resolve(response);
      this.pending.delete(response.id);
    }
  }

  private handleError(error: ErrorEvent): void {
    this.logger.error('worker.crash', error.message || 'Worker error');
    this.crashHandler?.();
    
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Worker crashed'));
    }
    this.pending.clear();
  }

  private generateCorrelationId(): string {
    this.correlationIdCounter++;
    return `${Date.now().toString(36)}-${this.correlationIdCounter.toString(36)}`;
  }

  async postMessage<T = unknown>(type: string, payload?: unknown): Promise<WorkerResponse<T>> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    const id = crypto.randomUUID?.() || this.generateCorrelationId();
    const correlationId = this.generateCorrelationId();
    const timestamp = Date.now();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Message ${id} timed out after ${MESSAGE_TIMEOUT}ms`));
      }, MESSAGE_TIMEOUT);

      this.pending.set(id, { resolve: resolve as (r: WorkerResponse) => void, reject, timeout });

      const startTime = performance.now();
      this.worker!.postMessage({ id, type, payload, correlationId, timestamp });
    });
  }

  async batchFetch(urls: string[]): Promise<ArrayBuffer[]> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    const id = crypto.randomUUID?.() || this.generateCorrelationId();
    const correlationId = this.generateCorrelationId();
    const timestamp = Date.now();

    const messages = urls.map(url => ({
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      type: 'fetch',
      payload: { url },
    }));

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Batch request timed out'));
      }, MESSAGE_TIMEOUT * 2);

      const originalHandler = this.worker!.onmessage;
      this.worker!.onmessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.id === id) {
          clearTimeout(timeout);
          this.worker!.onmessage = originalHandler;
          
          if (event.data.type === 'success') {
            const results = event.data.payload as { results: Array<{ payload?: { data: ArrayBuffer } }> };
            const buffers = results
              .filter(r => r.type === 'success' && r.payload)
              .map(r => (r.payload as { data: ArrayBuffer }).data);
            resolve(buffers);
          } else {
            reject(new Error(event.data.error || 'Batch failed'));
          }
        } else {
          originalHandler(event);
        }
      };

      this.worker!.postMessage({ id, type: 'batch', payload: { messages }, correlationId, timestamp });
    });
  }

  async ping(): Promise<boolean> {
    try {
      const response = await this.postMessage('ping');
      return response.type === 'success';
    } catch {
      return false;
    }
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    for (const [_, pending] of this.pending) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Worker terminated'));
    }
    this.pending.clear();
  }

  isAlive(): boolean {
    return this.worker !== null;
  }
}

export function createWorkerClient(onCrash?: () => void): ImageWorkerClient {
  const client = new ImageWorkerClient();
  client.createWorker(onCrash);
  return client;
}
