import { memo } from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
}

const VARIANT_STYLES: Record<string, string> = {
  default: "bg-dt-bg-card text-dt-text-secondary border-dt-border",
  success: "bg-dt-success/10 text-dt-success border-dt-success/30",
  warning: "bg-dt-warning/10 text-dt-warning border-dt-warning/30",
  error: "bg-dt-error/10 text-dt-error border-dt-error/30",
  info: "bg-dt-info/10 text-dt-info border-dt-info/30",
};

export const Badge = memo(function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span
      className={`px-2 py-0.5 text-[10px] font-medium rounded border ${VARIANT_STYLES[variant]}`}
    >
      {children}
    </span>
  );
});
