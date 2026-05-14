/**
 * GlobalIntersectionObserver - Singleton observer manager
 *
 * Uses a single IntersectionObserver instance with WeakMap-based callback
 * storage to avoid creating new observers per DOM node (which destroys
 * scroll performance on galleries).
 */

interface ObserverEntry {
  callback: IntersectionObserverCallback;
  options: IntersectionObserverInit;
}

class GlobalIntersectionObserverManager {
  private observer: IntersectionObserver | null = null;
  private callbacks = new WeakMap<Element, ObserverEntry>();

  /**
   * Handle intersection events by routing to the correct callback
   */
  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    if (!this.observer) return;

    for (const entry of entries) {
      const entry_data = this.callbacks.get(entry.target);
      if (entry_data?.callback) {
        entry_data.callback([entry], this.observer);
      }
    }
  }

  /**
   * Observe an element with the given callback and options
   */
  observe(
    element: Element,
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ): void {
    if (!element) return;

    // Create observer lazily on first use
    if (!this.observer) {
      this.observer = new IntersectionObserver(this.handleIntersection.bind(this));
    }

    // Store callback and options for this element
    this.callbacks.set(element, { callback, options: options ?? {} });

    // Start observing
    this.observer.observe(element);
  }

  /**
   * Stop observing a specific element
   */
  unobserve(element: Element): void {
    if (!element) return;

    this.callbacks.delete(element);
    this.observer?.unobserve(element);
  }

  /**
   * Disconnect and clean up all observations
   */
  disconnect(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.callbacks = new WeakMap();
  }

  /**
   * Get observer instance (for testing)
   */
  getObserver(): IntersectionObserver | null {
    return this.observer;
  }
}

// Singleton instance
export const globalIntersectionObserver = new GlobalIntersectionObserverManager();
