import { memo, type ReactNode } from 'react';
import '../../styles/devtools.css';

interface DevToolsLayoutProps {
  topbar: ReactNode;
  mainContent: ReactNode;
  sidePanel: ReactNode;
  bottomPanel: ReactNode;
}

export const DevToolsLayout = memo(function DevToolsLayout({
  topbar,
  mainContent,
  sidePanel,
  bottomPanel,
}: DevToolsLayoutProps) {
  return (
    <div className="grid grid-cols-[1fr_350px] grid-rows-[48px_1fr_250px] h-screen w-full overflow-hidden bg-dt-bg-base text-dt-text-primary text-sm font-dt-sans">
      {topbar}
      <main className="col-start-1 row-start-2 flex flex-col overflow-hidden relative border-r border-dt-border">
        {mainContent}
      </main>
      {sidePanel}
      {bottomPanel}
    </div>
  );
});
