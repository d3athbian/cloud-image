import { memo } from 'react';
import type { PerformanceData } from '../../types/devtools.types';
import { Stat } from '../atoms/Stat';

interface PerformanceTabPanelProps {
  metrics?: PerformanceData;
}

export const PerformanceTabPanel = memo(function PerformanceTabPanel({
  metrics,
}: PerformanceTabPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      <Stat
        label="Avg Response"
        value={metrics ? `${Math.round(metrics.avgResponse)}ms` : 'N/A'}
      />
      <Stat label="Total Requests" value={metrics ? metrics.totalRequests : 'N/A'} />
      <Stat
        label="Success Rate"
        value={metrics ? `${Math.round(metrics.successRate * 100)}%` : 'N/A'}
        color={
          metrics && metrics.successRate >= 0.8
            ? 'text-dt-success'
            : metrics && metrics.successRate >= 0.5
              ? 'text-dt-warning'
              : 'text-dt-error'
        }
      />
    </div>
  );
});