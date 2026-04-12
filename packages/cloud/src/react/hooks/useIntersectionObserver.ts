import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  rootMargin?: string;
  triggerWhen?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const { rootMargin = '100px', triggerWhen = true } = options;
  const ref = useRef<HTMLElement | null>(null);
  const [isInViewport, setIsInViewport] = useState(!triggerWhen);

  useEffect(() => {
    if (triggerWhen) {
      setIsInViewport(false);
    }

    const element = ref.current;
    if (!element || !triggerWhen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [triggerWhen, rootMargin]);

  return { ref, isInViewport };
}