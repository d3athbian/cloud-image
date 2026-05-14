import { memo } from 'react';

interface GhostButtonProps {
  onClick?: () => void;
  icon: string;
  label: string;
  danger?: boolean;
}

export const GhostButton = memo(function GhostButton({
  onClick,
  icon,
  label,
  danger,
}: GhostButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 h-6 px-2.5 rounded-md text-[10px] font-medium border bg-transparent transition-colors cursor-pointer ${
        danger
          ? 'border-[#333] text-[#888] hover:border-red-800/60 hover:text-red-400'
          : 'border-[#333] text-[#888] hover:border-[#555] hover:text-[#fafafa]'
      }`}
    >
      <span dangerouslySetInnerHTML={{ __html: icon }} />
      {label}
    </button>
  );
});