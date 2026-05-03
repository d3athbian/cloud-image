import { memo, type ReactNode } from 'react';

interface TabContentProps {
  children: ReactNode;
}

export const TabContent = memo(function TabContent({ children }: TabContentProps) {
  return <div className="flex-1 overflow-auto p-4">{children}</div>;
});
