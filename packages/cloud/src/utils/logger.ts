/**
 * Error classification for contextual error handling
 */
export enum ErrorType {
  ABORT = 'AbortError',
  QUOTA = 'QuotaExceededError',
  NETWORK = 'NetworkError',
  UNKNOWN = 'Unknown',
}

export interface ClassifiedError {
  type: ErrorType;
  original: unknown;
  context: string;
  timestamp: number;
}

export function classifyError(error: unknown, context: string): ClassifiedError {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'AbortError':
        return { type: ErrorType.ABORT, original: error, context, timestamp: Date.now() };
      case 'QuotaExceededError':
        return { type: ErrorType.QUOTA, original: error, context, timestamp: Date.now() };
    }
  }
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return { type: ErrorType.NETWORK, original: error, context, timestamp: Date.now() };
  }
  return { type: ErrorType.UNKNOWN, original: error, context, timestamp: Date.now() };
}

export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  classifiedError: (classified: ClassifiedError, message: string, ...args: unknown[]) => void;
}

const isProduction = process.env.NODE_ENV === 'production';

const createLogger = (context: string): Logger => ({
  debug: (message: string, ...args: unknown[]) => {
    if (!isProduction) {
      console.debug(`[${context}]`, message, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (!isProduction) {
      console.warn(`[${context}]`, message, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    if (!isProduction) {
      console.error(`[${context}]`, message, ...args);
    }
  },
  info: (message: string, ...args: unknown[]) => {
    if (!isProduction) {
      console.log(`[${context}]`, message, ...args);
    }
  },
  classifiedError: (classified: ClassifiedError, message: string, ...args: unknown[]) => {
    if (!isProduction) {
      console.error(
        `[${context}] ${message}`,
        {
          type: classified.type,
          original: classified.original,
          context: classified.context,
          timestamp: new Date(classified.timestamp).toISOString(),
        },
        ...args,
      );
    }
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
  EventInterceptor: createLogger('EventInterceptor'),
  StateSync: createLogger('StateSync'),
};

export type { Logger as LoggerInterface };
