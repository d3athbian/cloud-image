import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CircuitBreaker, getCircuitBreaker, type CircuitBreakerConfig } from '../../src/core/circuit-breaker';

describe('T085: Circuit Breaker State Machine', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      resetTimeout: 1000,
      halfOpenMaxCalls: 2,
    });
  });

  it('should start in closed state', () => {
    expect(circuitBreaker.getState()).toBe('closed');
    expect(circuitBreaker.isClosed()).toBe(true);
  });

  it('should transition to open after failure threshold', () => {
    circuitBreaker.recordFailure();
    circuitBreaker.recordFailure();
    expect(circuitBreaker.isClosed()).toBe(true);

    circuitBreaker.recordFailure();
    expect(circuitBreaker.isOpen()).toBe(true);
  });

  it('should allow execution in closed state', () => {
    expect(circuitBreaker.canExecute()).toBe(true);
  });

  it('should not allow execution in open state', () => {
    circuitBreaker.recordFailure();
    circuitBreaker.recordFailure();
    circuitBreaker.recordFailure();
    expect(circuitBreaker.canExecute()).toBe(false);
  });

  it('should transition to half-open after timeout', () => {
    circuitBreaker.recordFailure();
    circuitBreaker.recordFailure();
    circuitBreaker.recordFailure();
    expect(circuitBreaker.isOpen()).toBe(true);
  });

  it('should reset failures on close', () => {
    circuitBreaker.recordFailure();
    circuitBreaker.recordFailure();
    expect(circuitBreaker.getFailures()).toBe(2);

    circuitBreaker.reset();
    expect(circuitBreaker.getFailures()).toBe(0);
    expect(circuitBreaker.isClosed()).toBe(true);
  });

  it('should track failures count', () => {
    circuitBreaker.recordFailure();
    expect(circuitBreaker.getFailures()).toBe(1);
  });
});

describe('T090: Circuit Breaker Configuration', () => {
  it('should use default config values', () => {
    const cb = new CircuitBreaker();
    const config = cb.getConfig();
    
    expect(config.failureThreshold).toBe(3);
    expect(config.successThreshold).toBe(2);
    expect(config.resetTimeout).toBe(30000);
  });

  it('should accept custom config', () => {
    const cb = new CircuitBreaker({
      failureThreshold: 5,
      successThreshold: 3,
      resetTimeout: 60000,
    });
    const config = cb.getConfig();
    
    expect(config.failureThreshold).toBe(5);
    expect(config.successThreshold).toBe(3);
    expect(config.resetTimeout).toBe(60000);
  });
});

describe('T091: Circuit Breaker Execution', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 2,
      resetTimeout: 1000,
    });
  });

  it('should execute operation successfully', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    const result = await circuitBreaker.execute(operation);
    expect(result).toBe('success');
  });

  it('should throw when circuit is open', async () => {
    circuitBreaker.recordFailure();
    circuitBreaker.recordFailure();

    const operation = vi.fn().mockResolvedValue('success');
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('Circuit breaker is open');
  });

  it('should record failure when operation throws', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('fail'));
    
    try {
      await circuitBreaker.execute(operation);
    } catch {}

    expect(circuitBreaker.getFailures()).toBe(1);
  });

  it('should get stats', () => {
    circuitBreaker.recordFailure();

    const stats = circuitBreaker.getStats();
    expect(stats.state).toBe('closed');
    expect(stats.failures).toBe(1);
    expect(stats.canExecute).toBe(true);
  });
});

describe('T093: Circuit Breaker Events', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 2,
      resetTimeout: 100,
    });
  });

  it('should emit event when opening', () => {
    const listener = vi.fn();
    circuitBreaker.subscribe(listener);

    circuitBreaker.recordFailure();
    circuitBreaker.recordFailure();
    circuitBreaker.recordFailure();

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'opened',
        state: 'open',
      })
    );
  });

  it('should subscribe to events', () => {
    const listener = vi.fn();
    const unsubscribe = circuitBreaker.subscribe(listener);
    
    expect(typeof unsubscribe).toBe('function');
    
    circuitBreaker.recordFailure();
  });

  it('should unsubscribe from events', () => {
    const listener = vi.fn();
    const unsubscribe = circuitBreaker.subscribe(listener);
    unsubscribe();

    circuitBreaker.recordFailure();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('Global Circuit Breaker', () => {
  it('should get singleton instance', () => {
    const cb1 = getCircuitBreaker();
    const cb2 = getCircuitBreaker();
    expect(cb1).toBe(cb2);
  });

  it('should return circuit breaker with default config', () => {
    const cb = getCircuitBreaker();
    expect(cb.getConfig().failureThreshold).toBe(3);
  });
});
