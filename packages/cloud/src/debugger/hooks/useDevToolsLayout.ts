import { useAtom } from "jotai";
import { activeTabAtom, devToolsOpenAtom, selectedItemUrlAtom } from "../store/devtools-atoms";
import type { Tab } from "../types/devtools.types";

export function useDevToolsLayout() {
  const [isOpen, setIsOpen] = useAtom(devToolsOpenAtom);
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);
  const [selectedItemUrl, setSelectedItemUrl] = useAtom(selectedItemUrlAtom);

  const toggle = () => setIsOpen((prev) => !prev);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const selectTab = (tab: Tab) => setActiveTab(tab);
  const selectItem = (url: string | null) => setSelectedItemUrl(url);

  return {
    isOpen,
    activeTab,
    selectedItemUrl,
    toggle,
    open,
    close,
    selectTab,
    selectItem,
  };
}
