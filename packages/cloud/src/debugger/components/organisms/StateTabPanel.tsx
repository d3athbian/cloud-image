import { memo } from 'react';
import type { JotaiDebuggerState } from '../../types/devtools.types';
import { formatTime } from '../../utils/formatters';

interface StateTabPanelProps {
  jotaiState?: JotaiDebuggerState;
}

interface StateCardProps {
  title: string;
  children: React.ReactNode;
}

const StateCard = memo(function StateCard({ title, children }: StateCardProps) {
  return (
    <div className="bg-dt-bg-card rounded-lg border border-dt-border overflow-hidden">
      <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-dt-info bg-dt-info/6 border-b border-dt-border">
        {title}
      </div>
      <div className="py-1">{children}</div>
    </div>
  );
});

const StateRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between items-center px-2.5 py-1 text-[10px]">
    <span className="text-dt-text-secondary">{label}</span>
    <span className="font-medium tabular-nums text-dt-text-primary">{value}</span>
  </div>
);

export const StateTabPanel = memo(function StateTabPanel({
  jotaiState,
}: StateTabPanelProps) {
  if (!jotaiState) {
    return (
      <div className="flex items-center justify-center h-20 text-[11px] text-dt-text-tertiary">
        No state available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1.5">
      <StateCard title="Cache">
        <StateRow label="Items" value={jotaiState.cache.totalItems} />
        <StateRow label="Hits" value={jotaiState.cache.hitCount} />
        <StateRow label="Misses" value={jotaiState.cache.missCount} />
        <StateRow label="Last Access" value={formatTime(jotaiState.cache.lastAccessTime)} />
      </StateCard>
      <StateCard title="Network">
        <StateRow
          label="Status"
          value={
            <span className={jotaiState.network.status === 'ONLINE' ? 'text-dt-success' : 'text-dt-error'}>
              {jotaiState.network.status}
            </span>
          }
        />
        <StateRow label="RTT" value={`${jotaiState.network.rtt}ms`} />
        <StateRow label="Last Check" value={formatTime(jotaiState.network.lastChecked)} />
      </StateCard>
      <StateCard title="Memory">
        <StateRow
          label="Pressure"
          value={
            <span className={jotaiState.memory.isUnderPressure ? 'text-dt-error' : 'text-dt-success'}>
              {jotaiState.memory.isUnderPressure ? 'Yes' : 'No'}
            </span>
          }
        />
        <StateRow
          label="Level"
          value={
            <span
              className={
                jotaiState.memory.pressureLevel === 'high'
                  ? 'text-dt-error'
                  : jotaiState.memory.pressureLevel === 'medium'
                    ? 'text-dt-warning'
                    : 'text-dt-success'
              }
            >
              {jotaiState.memory.pressureLevel}
            </span>
          }
        />
      </StateCard>
    </div>
  );
});