import { memo } from "react";
import type { CacheItemMetadata } from "../../types/devtools.types";
import { Button } from "../shared/Button";

interface ImageDetailsProps {
  item?: CacheItemMetadata;
  onClose?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  onRefetch?: () => void;
}

function formatSize(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  return mb < 1 ? `${(mb * 1024).toFixed(0)} KB` : `${mb.toFixed(2)} MB`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export const ImageDetails = memo(function ImageDetails({
  item,
  onClose,
  onDelete,
  onPin,
  onRefetch,
}: ImageDetailsProps) {
  if (!item) {
    return (
      <div className="flex items-center justify-center h-full text-dt-text-secondary text-sm p-4">
        Select an item to view details
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-dt-border">
        <h3 className="text-xs font-medium text-dt-text-primary">Image Details</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-dt-text-secondary hover:text-dt-text-primary transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        <div className="aspect-video bg-black rounded-md flex items-center justify-center text-dt-text-secondary text-xs border border-dt-border">
          Preview
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-dt-text-secondary mb-1">URL</div>
            <div className="text-dt-text-primary break-all">{item.url}</div>
          </div>
          <div>
            <div className="text-dt-text-secondary mb-1">Key</div>
            <div className="text-dt-text-primary font-dt-mono truncate">{item.key}</div>
          </div>
          <div>
            <div className="text-dt-text-secondary mb-1">Size</div>
            <div className="text-dt-text-primary">{formatSize(item.size)}</div>
          </div>
          <div>
            <div className="text-dt-text-secondary mb-1">Type</div>
            <div className="text-dt-text-primary">{item.mimeType}</div>
          </div>
          <div>
            <div className="text-dt-text-secondary mb-1">TTL</div>
            <div className="text-dt-text-primary">
              {Math.round(item.ttl / 1000)}s (exp in {Math.round(item.expiresIn / 1000)}s)
            </div>
          </div>
          <div>
            <div className="text-dt-text-secondary mb-1">LRU Score</div>
            <div className="text-dt-text-primary font-dt-mono">{item.lruScore.toFixed(4)}</div>
          </div>
          <div>
            <div className="text-dt-text-secondary mb-1">Access Count</div>
            <div className="text-dt-text-primary">{item.accessCount}</div>
          </div>
          <div>
            <div className="text-dt-text-secondary mb-1">Created At</div>
            <div className="text-dt-text-primary">{formatDate(item.cachedAt)}</div>
          </div>
          <div className="col-span-2">
            <div className="text-dt-text-secondary mb-1">Last Accessed</div>
            <div className="text-dt-text-primary">{formatDate(item.accessedAt)}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-3 border-t border-dt-border">
        <Button variant="default" onClick={onRefetch} className="flex-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
          </svg>
          Refetch
        </Button>
        <Button variant="danger" onClick={onDelete} className="flex-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H4v2h16V4z" />
          </svg>
          Delete
        </Button>
        <Button variant="default" onClick={onPin} className="flex-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
          </svg>
          Pin
        </Button>
      </div>
    </div>
  );
});
