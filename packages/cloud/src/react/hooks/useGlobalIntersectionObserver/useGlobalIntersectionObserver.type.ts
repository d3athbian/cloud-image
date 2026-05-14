export type UseGlobalIntersectionObserverOptions = {
  rootMargin?: string;
  enabled?: boolean;
};

export type UseGlobalIntersectionObserverReturn = {
  ref: (node: Element | null) => void;
  isInViewport: boolean;
};