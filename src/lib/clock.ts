import { useSyncExternalStore } from 'react';

// One shared timer for everything that shows "now": it ticks at each minute
// boundary, so a status like "Open now until 6:00 PM" turns over on time on
// a page left open.
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;

const currentMinute = () => Math.floor(Date.now() / 60_000);

function schedule() {
  timer = setTimeout(
    () => {
      for (const listener of listeners) listener();
      schedule();
    },
    60_000 - (Date.now() % 60_000) + 50,
  );
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) schedule();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) clearTimeout(timer);
  };
}

/** The current minute (a number that changes once a minute); re-renders the caller when it turns over. */
export function useMinute(): number {
  return useSyncExternalStore(subscribe, currentMinute, currentMinute);
}
