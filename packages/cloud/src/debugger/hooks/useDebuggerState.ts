import { useCallback, useState } from "react";
import type { DebuggerState, Position, Tab } from "../types";
import { DEFAULT_DEBUGGER_STATE } from "../types";

export function useDebuggerState(initialState?: Partial<DebuggerState>) {
  const [state, setState] = useState<DebuggerState>({
    ...DEFAULT_DEBUGGER_STATE,
    ...initialState,
  });

  const toggle = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const setTab = useCallback((activeTab: Tab) => {
    setState((prev) => ({ ...prev, activeTab }));
  }, []);

  const setPosition = useCallback((position: Position) => {
    setState((prev) => ({ ...prev, position }));
  }, []);

  const toggleExpanded = useCallback(() => {
    setState((prev) => ({ ...prev, isExpanded: !prev.isExpanded }));
  }, []);

  return {
    state,
    toggle,
    setTab,
    setPosition,
    toggleExpanded,
  };
}
