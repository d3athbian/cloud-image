/**
 * BlobUrlRegistry - Tracks ObjectURLs for automatic cleanup
 *
 * Prevents memory leaks by ensuring all created blob: URLs are properly
 * revoked when no longer needed. Uses component-based tracking for
 * lifecycle management.
 */

export interface BlobUrlManager {
  create(blob: Blob, componentId: string): string;
  revoke(url: string): void;
  revokeComponent(componentId: string): void;
  revokeAll(): void;
  has(url: string): boolean;
  getUrl(componentId: string): string | undefined;
}

class BlobUrlRegistry implements BlobUrlManager {
  private urls = new Map<string, string>(); // componentId -> ObjectURL

  create(blob: Blob, componentId: string): string {
    if (!componentId || componentId.length > 256) {
      throw new Error('Invalid componentId: must be non-empty string max 256 chars');
    }

    // Revoke old URL if exists for this component
    const old = this.urls.get(componentId);
    if (old) {
      this.revoke(old);
    }

    const url = URL.createObjectURL(blob);
    this.urls.set(componentId, url);
    return url;
  }

  revoke(url: string): boolean {
    if (!url) return false;

    // Safety check - only revoke blob: URLs
    if (!url.startsWith('blob:')) {
      return false;
    }

    URL.revokeObjectURL(url);

    // Find and remove from registry
    for (const [id, existing] of this.urls) {
      if (existing === url) {
        this.urls.delete(id);
        return true;
      }
    }

    return false;
  }

  revokeComponent(componentId: string): void {
    const url = this.urls.get(componentId);
    if (url) {
      this.revoke(url);
    }
    this.urls.delete(componentId);
  }

  revokeAll(): void {
    for (const url of this.urls.values()) {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    }
    this.urls.clear();
  }

  has(url: string): boolean {
    return this.urls.has(url) || Array.from(this.urls.values()).includes(url);
  }

  getUrl(componentId: string): string | undefined {
    return this.urls.get(componentId);
  }
}

// Singleton instance for global use
export const blobUrlRegistry = new BlobUrlRegistry();
