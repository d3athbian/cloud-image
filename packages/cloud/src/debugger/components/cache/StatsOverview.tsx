import { memo } from "react";

interface StatWidgetProps {
  label: string;
  value: string | number;
  variant?: "default" | "success" | "warning" | "error";
}

const VARIANT_COLORS: Record<string, string> = {
  default: "text-dt-text-primary",
  success: "text-dt-success",
  warning: "text-dt-warning",
  error: "text-dt-error",
};

const StatWidget = memo(function StatWidget({
  label,
  value,
  variant = "default",
}: StatWidgetProps) {
  return (
    <div className="bg-dt-bg-card border border-dt-border rounded-md p-3 min-w-[120px]">
      <div className="text-[10px] text-dt-text-secondary uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className={`text-xl font-semibold font-dt-mono ${VARIANT_COLORS[variant]}`}>{value}</div>
    </div>
  );
});

interface StatsOverviewProps {
  itemCount: number;
  totalSize: number;
  hitRate: number;
  evictionCount: number;
  ttlExpiredCount: number;
  pinnedCount: number;
}

function formatSize(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  return mb < 1 ? `${(mb * 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
}

export const StatsOverview = memo(function StatsOverview({
  itemCount,
  totalSize,
  hitRate,
  evictionCount,
  ttlExpiredCount,
  pinnedCount,
}: StatsOverviewProps) {
  return (
    <div className="flex flex-row gap-4 p-4 overflow-x-auto">
      <StatWidget label="Cache Items" value={itemCount} />
      <StatWidget label="Cache Size" value={formatSize(totalSize)} />
      <StatWidget
        label="Hit Rate"
        value={`${Math.round(hitRate)}%`}
        variant={hitRate >= 80 ? "success" : hitRate >= 50 ? "warning" : "error"}
      />
      <StatWidget
        label="Evictions"
        value={evictionCount}
        variant={evictionCount > 0 ? "warning" : "default"}
      />
      <StatWidget label="TTL Expired" value={ttlExpiredCount} />
      <StatWidget label="Pinned" value={pinnedCount} variant="default" />
    </div>
  );
});
