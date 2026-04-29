import { type ChangeEvent, memo, useState } from "react";

interface CacheToolbarProps {
  items: { url: string; key: string }[];
  onFilterChange?: (filteredItems: { url: string; key: string }[]) => void;
}

export const CacheToolbar = memo(function CacheToolbar({
  items,
  onFilterChange,
}: CacheToolbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "pinned">("all");
  const [sortBy, setSortBy] = useState<"lru" | "size" | "access">("lru");

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    let result = items;
    if (query) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(
        (item) =>
          item.url.toLowerCase().includes(lowerQuery) ||
          item.key.toLowerCase().includes(lowerQuery),
      );
    }
    onFilterChange?.(result);
  };

  return (
    <div className="flex items-center justify-between px-4 pb-4 gap-4">
      <div className="flex items-center gap-3 flex-1">
        <div className="relative flex-1 max-w-[300px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dt-text-secondary"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by url or key..."
            className="w-full pl-9 pr-3 py-2 bg-dt-bg-card border border-dt-border rounded-md text-xs text-dt-text-primary placeholder-dt-text-secondary focus:outline-none focus:border-dt-info"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-3 py-2 bg-dt-bg-card border border-dt-border rounded-md text-xs text-dt-text-primary focus:outline-none focus:border-dt-info"
        >
          <option value="all">Status (All)</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="pinned">Pinned</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-2 bg-dt-bg-card border border-dt-border rounded-md text-xs text-dt-text-primary focus:outline-none focus:border-dt-info"
        >
          <option value="lru">Sort: LRU Score</option>
          <option value="size">Sort: Size</option>
          <option value="access">Sort: Access Count</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="px-3 py-2 text-xs border border-dt-error/50 text-dt-error/80 rounded-md hover:border-dt-error hover:text-dt-error transition-colors flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H4v2h16V4z" />
          </svg>
          Clear Cache
        </button>
      </div>
    </div>
  );
});
