export interface LogEntry {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  correlationId: string;
  operation: string;
  message: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export class Logger {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 500;
  private enabled: boolean;

  constructor(enabled = false) {
    this.enabled = enabled;
  }

  generateCorrelationId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private log(
    level: LogEntry['level'],
    operation: string,
    message: string,
    metadata?: Record<string, unknown>,
    duration?: number,
  ): void {
    if (!this.enabled) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      correlationId: this.generateCorrelationId(),
      operation,
      message,
      duration,
      metadata,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const prefix = `[${level.toUpperCase()}]`;
    const suffix = duration !== undefined ? ` (${duration.toFixed(2)}ms)` : '';
    console.log(`${prefix} ${operation}: ${message}${suffix}`, metadata || '');
  }

  debug(operation: string, message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', operation, message, metadata);
  }

  info(operation: string, message: string, metadata?: Record<string, unknown>): void {
    this.log('info', operation, message, metadata);
  }

  warn(operation: string, message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', operation, message, metadata);
  }

  error(operation: string, message: string, metadata?: Record<string, unknown>): void {
    this.log('error', operation, message, metadata);
  }

  logDuration(
    _correlationId: string,
    operation: string,
    duration: number,
    metadata?: Record<string, unknown>,
  ): void {
    this.log('info', operation, `Completed in ${duration.toFixed(2)}ms`, metadata, duration);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

let globalLogger: Logger | null = null;

export function getLogger(enabled = false): Logger {
  if (!globalLogger) {
    globalLogger = new Logger(enabled);
  }
  return globalLogger;
}
