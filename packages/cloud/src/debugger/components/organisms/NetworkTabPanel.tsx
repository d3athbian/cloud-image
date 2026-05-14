import { memo } from 'react';
import { formatTime } from '../../utils/formatters';
import { TAB_ICONS } from '../../utils/icons';
import { GhostButton } from '../atoms/GhostButton';
import { Stat } from '../atoms/Stat';

interface NetworkTabPanelProps {
  status: string;
  rtt: number;
  lastChecked: number;
  onUpdateNetwork?: () => void;
}

export const NetworkTabPanel = memo(function NetworkTabPanel({
  status,
  rtt,
  lastChecked,
  onUpdateNetwork,
}: NetworkTabPanelProps) {
  const statusColor =
    status === 'ONLINE'
      ? 'text-dt-success'
      : status === 'LOW_BANDWIDTH'
        ? 'text-dt-warning'
        : 'text-dt-error';

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-1.5">
        <Stat label="Status" value={status} color={statusColor} />
        <Stat label="RTT" value={`${rtt}ms`} />
        <Stat label="Last Check" value={formatTime(lastChecked)} />
      </div>
      <div className="flex gap-1.5 pt-1.5 border-t border-dt-border">
        <GhostButton onClick={onUpdateNetwork} icon={TAB_ICONS.refresh} label="Test Speed" />
      </div>
    </div>
  );
});
