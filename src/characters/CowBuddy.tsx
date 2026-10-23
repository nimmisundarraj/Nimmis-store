import { useEffect, type CSSProperties } from 'react';
import { Character, preloadCharacters } from './Character';
import { Hearts } from './CowPeek';
import { BUDDY_ACTIONS, BUDDY_IDLE_POSE, cowBuddy, useBuddy, type BuddyAction } from './buddyStore';
import './cow-buddy.css';

const CLICK_REACTIONS: BuddyAction[] = ['happy', 'laugh', 'jump', 'love', 'excited'];

/** The buddy cow in the bottom corner of every page. Tap her for a reaction; cowBuddy() drives her from anywhere. */
export function CowBuddy() {
  const { action, say, id } = useBuddy();

  useEffect(() => preloadCharacters([BUDDY_IDLE_POSE, ...Object.values(BUDDY_ACTIONS).map((a) => a.pose)]), []);

  const spec = action === 'idle' ? undefined : BUDDY_ACTIONS[action];
  const pose = spec?.pose ?? BUDDY_IDLE_POSE;
  const poke = () => {
    const options = CLICK_REACTIONS.filter((a) => a !== action);
    cowBuddy(options[Math.floor(Math.random() * options.length)]);
  };

  return (
    <div className="cow-buddy" data-action={action} data-peek={spec?.peek ? '' : undefined}>
      <button type="button" className="cow-buddy__hit" onClick={poke} aria-label="Say hello to the Nimmi's cow">
        <span key={id} className="cow-buddy__move">
          <span className="cow-buddy__body">
            <Character name={pose} alt="" />
          </span>
        </span>
      </button>
      {(action === 'love' || action === 'happy') && <Hearts key={`h${id}`} />}
      {action === 'sleepy' && (
        <span className="cow-buddy__zzz" aria-hidden="true">
          {['z', 'z', 'Z'].map((z, i) => (
            <i key={i} style={{ '--i': i } as CSSProperties}>
              {z}
            </i>
          ))}
        </span>
      )}
      <span className="bubble cow-buddy__bubble" data-show={say ? '' : undefined} aria-live="polite">
        {say}
      </span>
    </div>
  );
}
