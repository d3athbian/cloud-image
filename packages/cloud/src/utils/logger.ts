export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
}

const createLogger = (context: string): Logger => ({
  debug: (message: string, ...args: unknown[]) => {
    console.debug(`[${context}]`, message, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[${context}]`, message, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[${context}]`, message, ...args);
  },
  info: (message: string, ...args: unknown[]) => {
    console.log(`[${context}]`, message, ...args);
  },
});

export const logger = {
  create: createLogger,
  ImageCache: createLogger('ImageCache'),
  ImageEngine: createLogger('ImageEngine'),
  MemoryMonitor: createLogger('MemoryMonitor'),
  CircuitBreaker: createLogger('CircuitBreaker'),
  NetworkMonitor: createLogger('NetworkMonitor'),
  PrefetchManager: createLogger('PrefetchManager'),
  ServiceWorker: createLogger('ServiceWorker'),
  WebAdapter: createLogger('WebAdapter'),
  CloudImage: createLogger('CloudImage'),
  CloudProvider: createLogger('CloudProvider'),
};

export type { Logger as LoggerInterface };