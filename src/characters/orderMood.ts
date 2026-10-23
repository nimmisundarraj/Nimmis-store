import { useSyncExternalStore } from 'react';

/**
 * A tiny shared store for "how does the cow feel about the Order button right now".
 * OrderReactions writes to it; any cow on the page can read it with useOrderMood().
 */
export type OrderMood = 'idle' | 'excited' | 'happy';
export type OrderState = { mood: OrderMood; /** the order button is inside a [data-cow-zone] */ zone: string | null };

let state: OrderState = { mood: 'idle', zone: null };
const listeners = new Set<() => void>();
let happyTimer: number | undefined;

export function setOrderMood(mood: OrderMood, zone: string | null = state.zone) {
  if (state.mood === 'happy' && mood === 'idle' && happyTimer) return; // let the happy moment finish
  window.clearTimeout(happyTimer);
  happyTimer = undefined;
  if (mood === 'happy') {
    happyTimer = window.setTimeout(() => {
      happyTimer = undefined;
      setOrderMood('idle', null);
    }, 2400);
  }
  if (state.mood === mood && state.zone === zone) return;
  state = { mood, zone };
  listeners.forEach((l) => l());
}

export function useOrderMood(): OrderState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}
