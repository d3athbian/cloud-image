import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RetryHandler, retry, withRetry, type RetryConfig } from '../../src/core/retry';

describe('T084: Exponential Backoff', () => {
  let handler: RetryHandler;

  beforeEach(() => {
    handler = new RetryHandler({
      baseDelay: 100,
      backoffMultiplier: 2,
      maxDelay: 1000,
      jitter: false,
    });
  });

  it('should calculate exponential delays', () => {
    const delays = handler.getDelays(3);
    expect(delays[0]).toBe(100);
    expect(delays[1]).toBe(200);
    expect(delays[2]).toBe(400);
    expect(delays[3]).toBe(800);
  });

  it('should cap delays at maxDelay', () => {
    const largeHandler = new RetryHandler({
      baseDelay: 100,
      backoffMultiplier: 2,
      maxDelay: 300,
      jitter: false,
    });
    const delays = largeHandler.getDelays(5);
    expect(delays[3]).toBe(300);
    expect(delays[4]).toBe(300);
  });

  it('should add jitter when enabled', () => {
    const jitterHandler = new RetryHandler({
      baseDelay: 100,
      jitter: true,
    });
    const delays = jitterHandler.getDelays(1);
    expect(delays[0]).toBeGreaterThanOrEqual(80);
    expect(delays[0]).toBeLessThanOrEqual(120);
  });

  it('should not add jitter when disabled', () => {
    const noJitterHandler = new RetryHandler({
      baseDelay: 100,
      jitter: false,
    });
    const delays = noJitterHandler.getDelays(1);
    expect(delays[0]).toBe(100);
  });

  it('should succeed on first attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    const result = await handler.execute(operation);
    
    expect(result.success).toBe(true);
    expect(result.result).toBe('success');
    expect(result.attempts).toBe(1);
  });

  it('should retry on failure and succeed', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');
    
    const result = await handler.execute(operation);
    
    expect(result.success).toBe(true);
    expect(result.result).toBe('success');
    expect(result.attempts).toBe(2);
  });

  it('should fail after max retries', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('always fails'));
    
    const result = await handler.execute(operation, { retries: 2 });
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.attempts).toBe(3);
  });

  it('should call onRetry callback', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');
    
    const onRetry = vi.fn();
    
    await handler.execute(operation, { onRetry });
    
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), expect.any(Number));
  });
});

describe('T088: Retry Handler', () => {
  let handler: RetryHandler;

  beforeEach(() => {
    handler = new RetryHandler({
      baseDelay: 10,
      backoffMultiplier: 2,
      jitter: false,
    });
  });

  it('should respect custom maxRetries', async () => {
    const customHandler = new RetryHandler({ maxRetries: 1 });
    const operation = vi.fn().mockRejectedValue(new Error('fail'));
    
    const result = await customHandler.execute(operation, { retries: 1 });
    
    expect(result.attempts).toBe(2);
  });

  it('should filter with predicate', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('network error'));
    
    const result = await handler.execute(operation, {
      predicate: (error) => error.message.includes('network'),
    });
    
    expect(result.attempts).toBe(4);
  });

  it('should stop retrying when predicate returns false', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('permanent error'));
    
    const result = await handler.execute(operation, {
      predicate: () => false,
    });
    
    expect(result.success).toBe(false);
    expect(result.attempts).toBe(1);
  });
});

describe('Retry static methods', () => {
  it('should detect network errors', () => {
    const networkError = new Error('Failed to fetch');
    networkError.name = 'TypeError';
    expect(RetryHandler.isNetworkError(networkError)).toBe(true);
  });

  it('should detect timeout errors', () => {
    const timeoutError = new Error('timeout');
    timeoutError.name = 'AbortError';
    expect(RetryHandler.isTimeoutError(timeoutError)).toBe(true);
  });

  it('should use convenience retry function', async () => {
    const operation = vi.fn().mockResolvedValue('done');
    const result = await retry(operation);
    expect(result.success).toBe(true);
  });

  it('should use withRetry wrapper', async () => {
    const operation = vi.fn().mockResolvedValue('done');
    const result = await withRetry(operation);
    expect(result).toBe('done');
  });
});
