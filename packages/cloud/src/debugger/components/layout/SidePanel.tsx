import { memo, type ReactNode } from 'react';
import { useCachedImages } from '../../hooks/useCachedImages';
import { CacheList } from '../cache/CacheList';

interface SidePanelProps {
  children?: ReactNode;
  selectedUrl?: string | null;
  onSelectItem?: (url: string) => void;
}

export const SidePanel = memo(function SidePanel({
  children,
  selectedUrl,
  onSelectItem,
}: SidePanelProps) {
  const { items } = useCachedImages();

  return (
    <aside className="col-start-2 row-start-2 row-span-2 grid grid-rows-[55%_45%] bg-dt-bg-panel border-l border-dt-border">
      {children || (
        <CacheList items={items} selectedUrl={selectedUrl} onSelectItem={onSelectItem} />
      )}
    </aside>
  );
});
