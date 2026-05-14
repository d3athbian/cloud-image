import { memo } from 'react';

interface StatProps {
  label: string;
  value: string | number;
  color?: string;
}

export const Stat = memo(function Stat({ label, value, color }: StatProps) {
  return (
    <div className="flex flex-col p-2.5 bg-[#111111] rounded-lg border border-[#1f1f1f]">
      <span className="text-[10px] text-[#555] uppercase tracking-widest mb-0.5">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${color ?? 'text-[#fafafa]'}`}>{value}</span>
    </div>
  );
});