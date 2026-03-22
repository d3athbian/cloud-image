import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, getLogger } from '../../src/core/logger';

describe('T054: Structured Logging with Correlation IDs', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger(true);
  });

  it('should generate correlation IDs', () => {
    const id1 = logger.generateCorrelationId();
    const id2 = logger.generateCorrelationId();
    
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  it('should log debug messages', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.debug('test.operation', 'Debug message', { key: 'value' });
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should log info messages', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('test.operation', 'Info message');
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should log warn messages', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('test.operation', 'Warning message');
    
    const logs = logger.getLogs();
    expect(logs.some(l => l.level === 'warn')).toBe(true);
    consoleSpy.mockRestore();
  });

  it('should log error messages', () => {
    logger.error('test.operation', 'Error message');
    
    const logs = logger.getLogs();
    expect(logs.some(l => l.level === 'error')).toBe(true);
  });

  it('should log duration correctly', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.logDuration('corr-123', 'fetch', 15.5);
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should retrieve stored logs', () => {
    logger.debug('op1', 'message 1');
    logger.info('op2', 'message 2');
    
    const logs = logger.getLogs();
    expect(logs).toHaveLength(2);
    expect(logs[0].operation).toBe('op1');
    expect(logs[1].operation).toBe('op2');
  });

  it('should clear logs', () => {
    logger.debug('op1', 'message 1');
    logger.clear();
    
    const logs = logger.getLogs();
    expect(logs).toHaveLength(0);
  });

  it('should respect enabled flag', () => {
    const disabledLogger = new Logger(false);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    disabledLogger.debug('op', 'message');
    expect(consoleSpy).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should set enabled dynamically', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    logger.setEnabled(false);
    logger.debug('op', 'message');
    expect(consoleSpy).not.toHaveBeenCalled();
    
    logger.setEnabled(true);
    logger.debug('op', 'message');
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should limit log size', () => {
    for (let i = 0; i < 600; i++) {
      logger.debug(`op${i}`, `message${i}`);
    }
    
    const logs = logger.getLogs();
    expect(logs.length).toBeLessThanOrEqual(500);
  });
});
