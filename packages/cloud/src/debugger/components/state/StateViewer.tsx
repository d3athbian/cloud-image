import { memo } from "react";

export const StateViewer = memo(function StateViewer() {
  return (
    <div className="flex items-center justify-center h-full text-dt-text-secondary text-sm">
      State Viewer - Connect to Jotai atoms
    </div>
  );
});
