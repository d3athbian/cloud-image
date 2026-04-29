import { memo } from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "danger" | "primary";
  disabled?: boolean;
  className?: string;
}

const VARIANT_STYLES: Record<string, string> = {
  default:
    "bg-dt-bg-card border-dt-border text-dt-text-secondary hover:text-dt-text-primary hover:border-dt-border-hover",
  danger:
    "bg-transparent border-dt-error/50 text-dt-error/80 hover:border-dt-error hover:text-dt-error",
  primary: "bg-dt-info/10 border-dt-info/30 text-dt-info hover:bg-dt-info/20 hover:border-dt-info",
};

export const Button = memo(function Button({
  children,
  onClick,
  variant = "default",
  disabled = false,
  className = "",
}: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        px-3 py-2 text-xs rounded-md border transition-colors flex items-center gap-2
        ${VARIANT_STYLES[variant]}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
    >
      {children}
    </button>
  );
});
