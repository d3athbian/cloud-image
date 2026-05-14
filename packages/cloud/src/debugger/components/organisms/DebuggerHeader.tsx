import { memo } from 'react';
import { GhostButton } from '../atoms/GhostButton';
import { StatusDot } from '../atoms/StatusDot';
import { TAB_ICONS, TAB_LABELS } from '../../utils/icons';

interface DebuggerHeaderProps {
  networkStatus: string;
  onRefresh?: () => void;
  onClearCache?: () => void;
  onClose?: () => void;
}

const STATUS_DOT_VARIANT: Record<string, 'online' | 'low_bandwidth' | 'offline'> = {
  ONLINE: 'online',
  LOW_BANDWIDTH: 'low_bandwidth',
  OFFLINE: 'offline',
};

export const DebuggerHeader = memo(function DebuggerHeader({
  networkStatus,
  onRefresh,
  onClearCache,
  onClose,
}: DebuggerHeaderProps) {
  const dotVariant = STATUS_DOT_VARIANT[networkStatus] ?? 'offline';

  return (
    <div className="h-10 flex-none flex items-center justify-between px-4 border-b border-dt-border bg-dt-bg-panel">
      {/* Left: branding + status */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-dt-info flex-none" />
        <span className="text-xs font-semibold tracking-tight">CloudImage DevTools</span>
        <span className="px-1.5 py-0.5 text-[10px] rounded bg-dt-bg-card text-dt-text-secondary border border-dt-border">
          v0.1
        </span>
        <span className="w-1 h-1 rounded-full bg-dt-border flex-none" />
        <div className="flex items-center gap-1">
          <StatusDot status={dotVariant} />
          <span className="text-[10px] text-dt-text-secondary">{networkStatus}</span>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5">
        <GhostButton onClick={onRefresh} icon={TAB_ICONS.refresh} label="Refresh" />
        <GhostButton onClick={onClearCache} icon={TAB_ICONS.clear} label="Clear Cache" danger />
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-md text-dt-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer border-0 bg-transparent ml-1"
          title="Close"
        >
          <span dangerouslySetInnerHTML={{ __html: TAB_ICONS.close }} />
        </button>
      </div>
    </div>
  );
});