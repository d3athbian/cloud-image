import { memo } from 'react';

interface StatusDotProps {
  status: 'online' | 'low_bandwidth' | 'offline';
}

const STATUS_COLORS = {
  online: 'bg-dt-success',
  low_bandwidth: 'bg-dt-warning',
  offline: 'bg-dt-error',
};

export const StatusDot = memo(function StatusDot({ status }: StatusDotProps) {
  return <span className={`w-1.5 h-1.5 rounded-full flex-none ${STATUS_COLORS[status]}`} />;
});
