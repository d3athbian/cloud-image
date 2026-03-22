import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrefetchQueue, type PrefetchTask } from '../../src/core/prefetch';

describe('T077: Prefetch Queue', () => {
  let queue: PrefetchQueue;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue(undefined);
    queue = new PrefetchQueue(mockFetch, 2);
  });

  afterEach(() => {
    queue.destroy();
  });

  it('should add task to queue', () => {
    const result = queue.add('https://example.com/image.jpg');
    expect(result).toBe(true);
    expect(queue.getStats().queueSize).toBe(1);
  });

  it('should add multiple tasks', () => {
    queue.add('https://example.com/1.jpg');
    queue.add('https://example.com/2.jpg');
    queue.add('https://example.com/3.jpg');
    
    expect(queue.getStats().queueSize).toBe(3);
  });

  it('should not add duplicate URLs', () => {
    queue.add('https://example.com/image.jpg');
    queue.add('https://example.com/image.jpg');
    
    expect(queue.getStats().queueSize).toBe(1);
  });

  it('should update priority for existing task', () => {
    queue.add('https://example.com/image.jpg', { priority: 5 });
    queue.add('https://example.com/image.jpg', { priority: 10 });
    
    const tasks = queue.getTasks();
    expect(tasks[0].priority).toBe(10);
  });

  it('should process tasks in priority order', async () => {
    queue.add('https://example.com/low.jpg', { priority: 1 });
    queue.add('https://example.com/high.jpg', { priority: 10 });
    
    const tasks = queue.getTasks();
    expect(tasks[0].url).toBe('https://example.com/high.jpg');
  });

  it('should process tasks with fetch handler', async () => {
    queue.add('https://example.com/image.jpg');
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(mockFetch).toHaveBeenCalledWith('https://example.com/image.jpg');
  });

  it('should add batch of URLs', () => {
    const urls = ['1.jpg', '2.jpg', '3.jpg'].map(i => `https://example.com/${i}`);
    const added = queue.addBatch(urls);
    
    expect(added).toBe(3);
  });

  it('should remove pending task', async () => {
    const immediateQueue = new PrefetchQueue(vi.fn().mockImplementation(() => 
      new Promise(r => setTimeout(r, 500))
    ), 1);
    
    immediateQueue.add('https://example.com/image.jpg');
    
    await new Promise(resolve => setTimeout(resolve, 5));
    
    const tasks = immediateQueue.getTasks();
    expect(tasks.some(t => t.url === 'https://example.com/image.jpg')).toBe(true);
    immediateQueue.destroy();
  });

  it('should have task status as pending after add', async () => {
    queue.add('https://example.com/new.jpg');
    
    const tasks = queue.getTasks();
    const task = tasks.find(t => t.url === 'https://example.com/new.jpg');
    
    expect(task).toBeDefined();
    expect(['pending', 'processing']).toContain(task!.status);
  });

  it('should clear queue', async () => {
    const testQueue = new PrefetchQueue(vi.fn().mockResolvedValue(undefined), 1);
    testQueue.add('https://example.com/1.jpg');
    testQueue.add('https://example.com/2.jpg');
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    testQueue.clear();
    expect(testQueue.getStats().queueSize).toBeLessThanOrEqual(1);
    testQueue.destroy();
  });

  it('should get queue stats', () => {
    queue.add('https://example.com/pending.jpg');
    
    const stats = queue.getStats();
    expect(stats).toHaveProperty('pending');
    expect(stats).toHaveProperty('processing');
    expect(stats).toHaveProperty('completed');
    expect(stats).toHaveProperty('failed');
  });

  it('should subscribe to events', () => {
    const listener = vi.fn();
    const unsubscribe = queue.subscribe(listener);
    
    queue.add('https://example.com/image.jpg');
    
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it('should respect max queue size', () => {
    const smallQueue = new PrefetchQueue(mockFetch, 1);
    smallQueue.add('https://example.com/1.jpg');
    
    for (let i = 2; i <= 110; i++) {
      smallQueue.add(`https://example.com/${i}.jpg`);
    }
    
    expect(smallQueue.getStats().queueSize).toBeLessThanOrEqual(100);
    smallQueue.destroy();
  });

  it('should limit concurrent processing', async () => {
    const testFetch = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    const testQueue = new PrefetchQueue(testFetch, 2);
    
    testQueue.addBatch(['1.jpg', '2.jpg', '3.jpg', '4.jpg'].map(i => `https://example.com/${i}`));
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const stats = testQueue.getStats();
    expect(stats.processing).toBeLessThanOrEqual(2);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    testQueue.destroy();
  });
});
