export interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDuration: number;
}

type RetryPredicate = (error: Error) => boolean;

export class RetryHandler {
  private config: Required<RetryConfig>;
  private defaultPredicate: RetryPredicate = () => true;

  constructor(config: RetryConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      baseDelay: config.baseDelay ?? 100,
      maxDelay: config.maxDelay ?? 10000,
      backoffMultiplier: config.backoffMultiplier ?? 2,
      jitter: config.jitter ?? true,
    };
  }

  async execute<T>(
    operation: () => Promise<T>,
    options?: {
      retries?: number;
      predicate?: RetryPredicate;
      onRetry?: (attempt: number, error: Error, delay: number) => void;
    },
  ): Promise<RetryResult<T>> {
    const maxRetries = options?.retries ?? this.config.maxRetries;
    const predicate = options?.predicate ?? this.defaultPredicate;
    const startTime = Date.now();
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        return {
          success: true,
          result,
          attempts: attempt + 1,
          totalDuration: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === maxRetries || !predicate(lastError)) {
          return {
            success: false,
            error: lastError,
            attempts: attempt + 1,
            totalDuration: Date.now() - startTime,
          };
        }

        const delay = this.calculateDelay(attempt);
        options?.onRetry?.(attempt + 1, lastError, delay);

        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: maxRetries + 1,
      totalDuration: Date.now() - startTime,
    };
  }

  private calculateDelay(attempt: number): number {
    let delay = this.config.baseDelay * this.config.backoffMultiplier ** attempt;

    delay = Math.min(delay, this.config.maxDelay);

    if (this.config.jitter) {
      const jitterAmount = delay * 0.2;
      delay += Math.random() * jitterAmount * 2 - jitterAmount;
    }

    return Math.round(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getDelays(retries: number): number[] {
    return Array.from({ length: retries + 1 }, (_, i) => this.calculateDelay(i));
  }

  static isNetworkError(error: Error): boolean {
    return (
      error.name === 'NetworkError' ||
      error.name === 'TypeError' ||
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network request failed')
    );
  }

  static isTimeoutError(error: Error): boolean {
    return (
      error.name === 'AbortError' ||
      error.name === 'TimeoutError' ||
      error.message.includes('timeout') ||
      error.message.includes('timed out')
    );
  }
}

export function retry<T>(
  operation: () => Promise<T>,
  config?: RetryConfig,
): Promise<RetryResult<T>> {
  const handler = new RetryHandler(config);
  return handler.execute(operation);
}

export function withRetry<T>(
  operation: () => Promise<T>,
  options?: {
    retries?: number;
    baseDelay?: number;
    onRetry?: (attempt: number, error: Error, delay: number) => void;
  },
): Promise<T> {
  const handler = new RetryHandler({ baseDelay: options?.baseDelay ?? 100 });
  return handler
    .execute(operation, {
      retries: options?.retries,
      predicate: RetryHandler.isNetworkError,
      onRetry: options?.onRetry,
    })
    .then((result) => {
      if (result.success && result.result !== undefined) {
        return result.result;
      }
      throw result.error;
    });
}
