import { memo, type ReactNode } from 'react';

interface BottomPanelProps {
  children?: ReactNode;
}

export const BottomPanel = memo(function BottomPanel({ children }: BottomPanelProps) {
  return (
    <footer className="col-start-1 row-start-3 border-t border-dt-border bg-dt-bg-panel h-[250px]">
      {children || (
        <div className="flex items-center justify-center text-dt-text-secondary text-sm h-full">
          State Viewer
        </div>
      )}
    </footer>
  );
});
