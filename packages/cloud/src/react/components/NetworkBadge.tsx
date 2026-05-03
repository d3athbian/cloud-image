import { useAtomValue } from 'jotai';
import { networkAtom } from '../../core/system-atoms';

export interface NetworkBadgeProps {
  className?: string;
}

export function NetworkBadge({ className }: NetworkBadgeProps) {
  const network = useAtomValue(networkAtom);
  return (
    <span className={`${className || ''} badge-${network.status.toLowerCase()}`}>
      {network.status}
    </span>
  );
}
