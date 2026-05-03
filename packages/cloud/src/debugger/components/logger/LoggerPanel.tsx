import { useAtomValue, useSetAtom } from 'jotai';
import { memo, useEffect, useRef } from 'react';
import { useLogger } from '../../hooks/useLogger';
import { logsFilterAtom } from '../../store/devtools-atoms';
import { filteredLogsAtom } from '../../store/logger-atoms';
import type { LogLevel } from '../../types/devtools.types';
import { LogEntry } from './LogEntry';

const FILTER_OPTIONS: { label: string; value: LogLevel | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Info', value: 'INFO' },
  { label: 'Warn', value: 'WARN' },
  { label: 'Error', value: 'ERROR' },
];

export const LoggerPanel = memo(function LoggerPanel() {
  const filteredLogs = useAtomValue(filteredLogsAtom);
  const filter = useAtomValue(logsFilterAtom);
  const setFilter = useSetAtom(logsFilterAtom);
  const { clearLogs } = useLogger();
  const containerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  useEffect(() => {
    if (isAtBottomRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = containerRef.current;
      isAtBottomRef.current = scrollHeight - scrollTop === clientHeight;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-dt-border">
        <div className="flex items-center gap-1">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`
                px-2 py-1 text-xs rounded transition-colors
                ${
                  filter === option.value
                    ? 'bg-dt-info text-white'
                    : 'text-dt-text-secondary hover:text-dt-text-primary hover:bg-dt-bg-card'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={clearLogs}
          className="px-2 py-1 text-xs text-dt-text-secondary hover:text-dt-error transition-colors"
        >
          Clear
        </button>
      </div>

      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-dt-text-secondary text-sm">
            No logs
          </div>
        ) : (
          <div className="py-1">
            {filteredLogs.map((entry) => (
              <LogEntry key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
