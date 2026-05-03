import { memo, type ReactNode } from 'react';

interface SidePanelProps {
  children?: ReactNode;
}

export const SidePanel = memo(function SidePanel({ children }: SidePanelProps) {
  return (
    <aside className="col-start-2 row-start-2 row-span-2 grid grid-rows-[55%_45%] bg-dt-bg-panel border-l border-dt-border">
      {children || (
        <div className="flex items-center justify-center text-dt-text-secondary text-sm">
          Select an item
        </div>
      )}
    </aside>
  );
});
