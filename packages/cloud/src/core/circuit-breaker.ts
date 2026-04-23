import { Threshold, Time } from "../config/constants";
import type { CircuitBreakerConfig, CircuitBreakerState } from "./types";

export type CircuitBreakerEventType = "opened" | "closed" | "halfOpen";

export interface CircuitBreakerEvent {
  type: CircuitBreakerEventType;
  state: CircuitBreakerState;
  failures: number;
  successes: number;
  timestamp: number;
}

type CircuitBreakerListener = (event: CircuitBreakerEvent) => void;

export class CircuitBreaker {
  private state: CircuitBreakerState = "closed";
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private halfOpenCalls = 0;
  private config: Required<CircuitBreakerConfig>;
  private listeners: Set<CircuitBreakerListener> = new Set();

  constructor(config: CircuitBreakerConfig = {}) {
    this.config = {
      failureThreshold: config.failureThreshold ?? Threshold.CB_FAILURE_THRESHOLD,
      successThreshold: config.successThreshold ?? Threshold.CB_SUCCESS_THRESHOLD,
      resetTimeout: config.resetTimeout ?? Time.CIRCUIT_BREAKER_RESET,
      halfOpenMaxCalls: config.halfOpenMaxCalls ?? Threshold.CB_HALF_OPEN_MAX_CALLS,
    };
  }

  getState(): CircuitBreakerState {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime >= this.config.resetTimeout) {
        this.transitionTo("half-open");
      }
    }
    return this.state;
  }

  isClosed(): boolean {
    return this.getState() === "closed";
  }

  isOpen(): boolean {
    return this.getState() === "open";
  }

  isHalfOpen(): boolean {
    return this.getState() === "half-open";
  }

  canExecute(): boolean {
    const state = this.getState();

    if (state === "closed") {
      return true;
    }

    if (state === "half-open") {
      return this.halfOpenCalls < this.config.halfOpenMaxCalls;
    }

    return false;
  }

  recordSuccess(): void {
    switch (this.state) {
      case "closed":
        this.failures = 0;
        break;

      case "half-open":
        this.successes++;
        this.halfOpenCalls++;

        if (this.successes >= this.config.successThreshold) {
          this.transitionTo("closed");
        }
        break;

      case "open":
        break;
    }
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    switch (this.state) {
      case "closed":
        if (this.failures >= this.config.failureThreshold) {
          this.transitionTo("open");
        }
        break;

      case "half-open":
        this.transitionTo("open");
        break;

      case "open":
        break;
    }
  }

  private transitionTo(newState: CircuitBreakerState): void {
    this.state = newState;

    switch (newState) {
      case "closed":
        this.failures = 0;
        this.successes = 0;
        break;

      case "open":
        break;

      case "half-open":
        this.halfOpenCalls = 0;
        this.successes = 0;
        break;
    }

    this.notifyListeners({
      type: newState === "closed" ? "closed" : newState === "open" ? "opened" : "halfOpen",
      state: newState,
      failures: this.failures,
      successes: this.successes,
      timestamp: Date.now(),
    });
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      throw new Error(`Circuit breaker is ${this.getState()}`);
    }

    if (this.state === "half-open") {
      this.halfOpenCalls++;
    }

    try {
      const result = await operation();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  getFailures(): number {
    return this.failures;
  }

  getSuccesses(): number {
    return this.successes;
  }

  getLastFailureTime(): number {
    return this.lastFailureTime;
  }

  subscribe(listener: CircuitBreakerListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(event: CircuitBreakerEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Ignore listener errors
      }
    }
  }

  reset(): void {
    this.transitionTo("closed");
  }

  getConfig(): CircuitBreakerConfig {
    return { ...this.config };
  }

  getStats(): {
    state: CircuitBreakerState;
    failures: number;
    successes: number;
    lastFailureTime: number;
    canExecute: boolean;
  } {
    return {
      state: this.getState(),
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      canExecute: this.canExecute(),
    };
  }
}

let globalCircuitBreaker: CircuitBreaker | null = null;

export function getCircuitBreaker(config?: CircuitBreakerConfig): CircuitBreaker {
  if (!globalCircuitBreaker) {
    globalCircuitBreaker = new CircuitBreaker(config);
  }
  return globalCircuitBreaker;
}
