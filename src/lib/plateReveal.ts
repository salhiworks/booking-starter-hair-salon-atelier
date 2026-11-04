import { useLayoutEffect, type RefObject } from 'react';

/**
 * Plates below the fold open like a page being turned when they first come
 * into view. Only with motion allowed and only for plates not yet on screen,
 * so nothing above the fold is ever hidden (and the hero is never delayed).
 */
export function usePlateReveal(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !enabled || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    el.dataset.reveal = 'wait';
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        el.dataset.reveal = 'in';
        observer.disconnect();
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, enabled]);
}
