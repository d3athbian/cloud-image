import { describe, it, expect } from 'vitest';
import {
  WorkerMessage,
  WorkerResponse,
  WorkerMessageType,
  createWorkerMessage,
  createWorkerResponse,
  isValidWorkerMessage,
  isValidWorkerResponse,
} from '../../src/core/types';

describe('WorkerMessage', () => {
  describe('createWorkerMessage', () => {
    it('should create a message with id, type, and timestamp', () => {
      const message = createWorkerMessage('get', { url: 'https://example.com/image.jpg' });
      
      expect(message.id).toBeDefined();
      expect(message.id.length).toBeGreaterThan(0);
      expect(message.type).toBe('get');
      expect(message.timestamp).toBeDefined();
      expect(typeof message.timestamp).toBe('number');
    });

    it('should generate unique IDs for each message', () => {
      const message1 = createWorkerMessage('get');
      const message2 = createWorkerMessage('set');
      
      expect(message1.id).not.toBe(message2.id);
    });

    it('should accept all valid message types', () => {
      const types: WorkerMessageType[] = ['get', 'set', 'delete', 'clear', 'stats', 'init', 'destroy'];
      
      types.forEach((type) => {
        const message = createWorkerMessage(type);
        expect(message.type).toBe(type);
      });
    });

    it('should include payload when provided', () => {
      const payload = { url: 'https://example.com/image.jpg', options: { size: 'large' } };
      const message = createWorkerMessage('get', payload);
      
      expect(message.payload).toEqual(payload);
    });

    it('should not include payload when undefined', () => {
      const message = createWorkerMessage('get');
      
      expect(message.payload).toBeUndefined();
    });
  });

  describe('isValidWorkerMessage', () => {
    it('should accept valid worker message', () => {
      const message = createWorkerMessage('get', { url: 'https://example.com/image.jpg' });
      expect(isValidWorkerMessage(message)).toBe(true);
    });

    it('should reject message with empty id', () => {
      const message = createWorkerMessage('get');
      (message as WorkerMessage).id = '';
      expect(isValidWorkerMessage(message)).toBe(false);
    });

    it('should reject message with invalid type', () => {
      const message = createWorkerMessage('get');
      (message as WorkerMessage & { type: string }).type = 'invalid' as WorkerMessageType;
      expect(isValidWorkerMessage(message)).toBe(false);
    });

    it('should reject message with negative timestamp', () => {
      const message = createWorkerMessage('get');
      (message as WorkerMessage).timestamp = -1;
      expect(isValidWorkerMessage(message)).toBe(false);
    });
  });
});

describe('WorkerResponse', () => {
  describe('createWorkerResponse', () => {
    it('should create success response', () => {
      const response = createWorkerResponse('success', { data: 'cached-image' }, 'msg-123');
      
      expect(response.id).toBe('msg-123');
      expect(response.type).toBe('success');
      expect(response.payload).toEqual({ data: 'cached-image' });
      expect(response.error).toBeUndefined();
      expect(response.timestamp).toBeDefined();
    });

    it('should create error response', () => {
      const response = createWorkerResponse('error', undefined, 'msg-456', 'Network error');
      
      expect(response.id).toBe('msg-456');
      expect(response.type).toBe('error');
      expect(response.payload).toBeUndefined();
      expect(response.error).toBe('Network error');
    });
  });

  describe('isValidWorkerResponse', () => {
    it('should accept valid success response', () => {
      const response = createWorkerResponse('success', { data: 'test' }, 'msg-123');
      expect(isValidWorkerResponse(response)).toBe(true);
    });

    it('should accept valid error response', () => {
      const response = createWorkerResponse('error', undefined, 'msg-123', 'Error message');
      expect(isValidWorkerResponse(response)).toBe(true);
    });

    it('should reject response with empty id', () => {
      const response = createWorkerResponse('success', {});
      (response as WorkerResponse).id = '';
      expect(isValidWorkerResponse(response)).toBe(false);
    });

    it('should reject response with invalid type', () => {
      const response = createWorkerResponse('success', {});
      (response as WorkerResponse & { type: string }).type = 'invalid' as 'success' | 'error';
      expect(isValidWorkerResponse(response)).toBe(false);
    });

    it('should accept error response without error message', () => {
      const response = createWorkerResponse('error', undefined, 'msg-123');
      expect(isValidWorkerResponse(response)).toBe(true);
    });
  });

  describe('response-message matching', () => {
    it('should be able to match response to original message by ID', () => {
      const requestMessage = createWorkerMessage('get', { url: 'https://example.com/image.jpg' });
      const responseMessage = createWorkerResponse('success', { blob: 'data' }, requestMessage.id);
      
      expect(responseMessage.id).toBe(requestMessage.id);
    });
  });
});

/**
 * Create a worker message
 */
function createWorkerMessage<T = unknown>(
  type: WorkerMessageType,
  payload?: T
): WorkerMessage<T> {
  return {
    id: crypto.randomUUID(),
    type,
    payload,
    timestamp: Date.now(),
  };
}

/**
 * Create a worker response
 */
function createWorkerResponse<T = unknown>(
  type: 'success' | 'error',
  payload?: T,
  id?: string,
  error?: string
): WorkerResponse<T> {
  return {
    id: id ?? crypto.randomUUID(),
    type,
    payload,
    error,
    timestamp: Date.now(),
  };
}

/**
 * Validate worker message
 */
function isValidWorkerMessage(message: WorkerMessage): boolean {
  if (!message.id || message.id.trim() === '') return false;
  if (!['get', 'set', 'delete', 'clear', 'stats', 'init', 'destroy'].includes(message.type)) return false;
  if (typeof message.timestamp !== 'number' || message.timestamp < 0) return false;
  return true;
}

/**
 * Validate worker response
 */
function isValidWorkerResponse(response: WorkerResponse): boolean {
  if (!response.id || response.id.trim() === '') return false;
  if (!['success', 'error'].includes(response.type)) return false;
  if (typeof response.timestamp !== 'number' || response.timestamp < 0) return false;
  return true;
}
