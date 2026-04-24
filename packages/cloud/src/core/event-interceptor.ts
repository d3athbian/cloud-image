import { type LoggerInterface, logger } from "../utils/logger";

export interface EventInterceptorConfig {
  moduleName: string;
  logger?: LoggerInterface;
}

export interface ListenerRecord {
  target: EventTarget;
  eventType: string;
  listenerId: string;
  handler: () => void;
  wrappedHandler: (event: Event) => void;
  options?: AddEventListenerOptions;
}

export class EventInterceptor {
  private moduleName: string;
  private log: LoggerInterface;
  private listeners: ListenerRecord[] = [];

  constructor(config: EventInterceptorConfig) {
    this.moduleName = config.moduleName;
    this.log = config.logger ?? logger.create(config.moduleName);
  }

  on(
    target: EventTarget,
    eventType: string,
    listenerId: string,
    handler: () => void | Promise<void>,
    options?: AddEventListenerOptions,
  ): void {
    const wrappedHandler = (_event: Event) => {
      try {
        const result = handler();

        if (result && typeof result.then === "function") {
          result.catch((error: Error) => {
            this.logError(error, listenerId, eventType);
          });
        }
      } catch (error) {
        this.logError(error as Error, listenerId, eventType);
      }
    };

    target.addEventListener(eventType, wrappedHandler, options);

    this.listeners.push({
      target,
      eventType,
      listenerId,
      handler,
      wrappedHandler,
      options,
    });
  }

  off(target: EventTarget, eventType: string, handler: () => void): void {
    const index = this.listeners.findIndex(
      (l) => l.target === target && l.eventType === eventType && l.handler === handler,
    );

    if (index !== -1) {
      const record = this.listeners[index];
      target.removeEventListener(eventType, record.wrappedHandler);
      this.listeners.splice(index, 1);
    }
  }

  destroy(): void {
    for (const record of this.listeners) {
      record.target.removeEventListener(record.eventType, record.wrappedHandler);
    }
    this.listeners = [];
  }

  private logError(error: Error, listenerId: string, eventType: string): void {
    const errorMessage = `Error in listener "${listenerId}" for event "${eventType}": ${error.message}`;
    const context = {
      module: this.moduleName,
      listenerId,
      eventType,
      timestamp: Date.now(),
      stack: error.stack,
    };

    try {
      this.log.error(errorMessage, context);
    } catch {
      console.error(`[${this.moduleName}] ${errorMessage}`, context);
    }
  }
}
