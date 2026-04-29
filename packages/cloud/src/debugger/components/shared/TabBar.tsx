import { memo } from "react";
import type { Tab } from "../../types/devtools.types";

const TAB_ICONS: Record<Tab, string> = {
  cache: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/><path d="M7 12h2v5H7zm4-3h2v8h-2zm4-3h2v11h-2z"/></svg>`,
  network: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C13.25 6.75 9.75 6.75 5 9z"/></svg>`,
  performance: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>`,
  state: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>`,
};

const TAB_LABELS: Record<Tab, string> = {
  cache: "Cache",
  network: "Network",
  performance: "Performance",
  state: "State",
};

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export const TabBar = memo(function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const tabs: Tab[] = ["cache", "network", "performance", "state"];

  return (
    <div className="flex border-b border-dt-border bg-dt-bg-panel">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onTabChange(tab)}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-medium transition-all duration-200
            ${
              activeTab === tab
                ? "text-dt-info border-b-2 border-dt-info bg-dt-bg-card"
                : "text-dt-text-secondary hover:text-dt-text-primary hover:bg-dt-bg-card/50"
            }
          `}
        >
          <span dangerouslySetInnerHTML={{ __html: TAB_ICONS[tab] }} />
          {TAB_LABELS[tab]}
        </button>
      ))}
    </div>
  );
});
