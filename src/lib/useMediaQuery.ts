import { useSyncExternalStore } from 'react';

/** True while a CSS media query matches; follows changes (rotation, window resizing). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** The booking's phone layout: week strip, stacked panes, a sticky bottom bar. */
export const PHONE_QUERY = '(max-width: 759px)';
