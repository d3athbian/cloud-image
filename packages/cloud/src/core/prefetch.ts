export interface PrefetchOptions {
  priority?: number;
  signal?: AbortSignal;
}

export interface PrefetchTask {
  url: string;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: Error;
}

export type PrefetchEventType = 'start' | 'complete' | 'error' | 'queueChange';

export interface PrefetchEvent {
  type: PrefetchEventType;
  task?: PrefetchTask;
  queueSize: number;
  timestamp: number;
}

type PrefetchListener = (event: PrefetchEvent) => void;

export class PrefetchQueue {
  private queue: PrefetchTask[] = [];
  private processing = false;
  private maxConcurrent = 3;
  private maxQueueSize = 100;
  private listeners: Set<PrefetchListener> = new Set();
  private fetchHandler: (url: string) => Promise<void>;
  private abortController: AbortController | null = null;

  constructor(fetchHandler: (url: string) => Promise<void>, maxConcurrent = 3) {
    this.fetchHandler = fetchHandler;
    this.maxConcurrent = maxConcurrent;
  }

  add(url: string, options: PrefetchOptions = {}): boolean {
    if (this.queue.length >= this.maxQueueSize) {
      return false;
    }

    const existing = this.queue.find((t) => t.url === url);
    if (existing) {
      if (options.priority !== undefined && options.priority > existing.priority) {
        existing.priority = options.priority;
        this.sortQueue();
        this.notifyListeners({
          type: 'queueChange',
          queueSize: this.queue.length,
          timestamp: Date.now(),
        });
      }
      return true;
    }

    const task: PrefetchTask = {
      url,
      priority: options.priority ?? 5,
      status: 'pending',
      createdAt: Date.now(),
    };

    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        this.remove(url);
      });
    }

    this.queue.push(task);
    this.sortQueue();
    this.notifyListeners({
      type: 'queueChange',
      queueSize: this.queue.length,
      timestamp: Date.now(),
    });

    if (!this.processing) {
      this.processQueue();
    }

    return true;
  }

  addBatch(urls: string[], defaultPriority = 5): number {
    let added = 0;
    for (const url of urls) {
      if (this.add(url, { priority: defaultPriority })) {
        added++;
      }
    }
    return added;
  }

  remove(url: string): boolean {
    const index = this.queue.findIndex((t) => t.url === url);
    if (index === -1) return false;

    const task = this.queue[index];
    if (task.status === 'processing') {
      return false;
    }

    this.queue.splice(index, 1);
    this.notifyListeners({
      type: 'queueChange',
      queueSize: this.queue.length,
      timestamp: Date.now(),
    });
    return true;
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      if (a.status !== b.status) {
        const statusOrder = { pending: 0, processing: 1, completed: 2, failed: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return b.priority - a.priority;
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const pending = this.queue.filter((t) => t.status === 'pending');
      const toProcess = pending.slice(0, this.maxConcurrent);

      if (toProcess.length === 0) break;

      const promises = toProcess.map((task) => this.processTask(task));
      await Promise.all(promises);

      this.cleanup();
    }

    this.processing = false;
  }

  private async processTask(task: PrefetchTask): Promise<void> {
    task.status = 'processing';
    task.startedAt = Date.now();

    this.notifyListeners({
      type: 'start',
      task,
      queueSize: this.queue.length,
      timestamp: Date.now(),
    });

    try {
      await this.fetchHandler(task.url);
      task.status = 'completed';
      task.completedAt = Date.now();
      this.notifyListeners({
        type: 'complete',
        task,
        queueSize: this.queue.length,
        timestamp: Date.now(),
      });
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error : new Error(String(error));
      this.notifyListeners({
        type: 'error',
        task,
        queueSize: this.queue.length,
        timestamp: Date.now(),
      });
    }
  }

  private cleanup(): void {
    const completedThreshold = Date.now() - 60000;
    this.queue = this.queue.filter(
      (t) =>
        t.status === 'pending' ||
        t.status === 'processing' ||
        (t.status === 'completed' && t.completedAt && t.completedAt > completedThreshold) ||
        (t.status === 'failed' && t.startedAt && t.startedAt > completedThreshold),
    );
  }

  pause(): void {
    this.abortController = new AbortController();
  }

  resume(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (!this.processing) {
      this.processQueue();
    }
  }

  clear(): void {
    this.queue = this.queue.filter((t) => t.status === 'processing');
    this.notifyListeners({
      type: 'queueChange',
      queueSize: this.queue.length,
      timestamp: Date.now(),
    });
  }

  getStats(): {
    queueSize: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    return {
      queueSize: this.queue.length,
      pending: this.queue.filter((t) => t.status === 'pending').length,
      processing: this.queue.filter((t) => t.status === 'processing').length,
      completed: this.queue.filter((t) => t.status === 'completed').length,
      failed: this.queue.filter((t) => t.status === 'failed').length,
    };
  }

  getTasks(): PrefetchTask[] {
    return [...this.queue];
  }

  subscribe(listener: PrefetchListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(event: PrefetchEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Ignore listener errors
      }
    }
  }

  destroy(): void {
    this.clear();
    this.listeners.clear();
    this.abortController?.abort();
  }
}
