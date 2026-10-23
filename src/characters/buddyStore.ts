import { useSyncExternalStore } from 'react';
import type { CharacterName } from './assets';

export type BuddyAction = 'idle' | 'happy' | 'excited' | 'worried' | 'sleepy' | 'love' | 'jump' | 'laugh' | 'walk';

// peek: the pose is head-only art, so it rises from the bottom edge with the neck hidden below the screen.
type ActionSpec = { pose: CharacterName; say: string; ms: number; peek?: boolean };

export const BUDDY_IDLE_POSE: CharacterName = 'cow-stand';

export const BUDDY_ACTIONS: Record<Exclude<BuddyAction, 'idle'>, ActionSpec> = {
  happy: { pose: 'cow-peek-happy', say: 'Moo! So happy!', ms: 2400, peek: true },
  excited: { pose: 'cow-peek-excited', say: 'Ooh, ghee!', ms: 2400, peek: true },
  worried: { pose: 'cow-peek-confused', say: 'Hmm… are you sure?', ms: 2600, peek: true },
  sleepy: { pose: 'cow-peek-sleepy', say: 'Zzz…', ms: 4000, peek: true },
  laugh: { pose: 'cow-peek-happy', say: 'Hahaha, moo!', ms: 2400, peek: true },
  love: { pose: 'cow-stand', say: 'Love you!', ms: 2600 },
  jump: { pose: 'cow-stand', say: 'Wheee!', ms: 1900 },
  walk: { pose: 'cow-walk', say: '', ms: 6200 },
};

type State = { action: BuddyAction; say: string; id: number };

let state: State = { action: 'idle', say: '', id: 0 };
const listeners = new Set<() => void>();
let timer: number | undefined;

/** Make the buddy cow react from anywhere, e.g. cowBuddy('love') in a button's onClick. */
export function cowBuddy(action: BuddyAction, say?: string) {
  window.clearTimeout(timer);
  if (action !== 'idle') timer = window.setTimeout(() => cowBuddy('idle'), BUDDY_ACTIONS[action].ms);
  state = { action, say: say ?? (action === 'idle' ? '' : BUDDY_ACTIONS[action].say), id: state.id + 1 };
  listeners.forEach((l) => l());
}

export function useBuddy(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}
