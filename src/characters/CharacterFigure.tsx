import { useEffect, useRef, useState } from 'react';
import { Character } from './Character';
import type { CharacterName } from './assets';
import { useInView, useReducedMotion } from './hooks';

type Props = {
  name: CharacterName;
  alt?: string;
  /** Line shown in a speech bubble on hover or tap. */
  say?: string;
  /** How far she drifts against the scroll, in px across one screen height. 0 = none. */
  drift?: number;
  className?: string;
};

/**
 * A character standing in a section (how it's made, our story): rises in when it scrolls
 * into view, drifts gently with the scroll, and says a line on hover.
 */
export function CharacterFigure({ name, alt = '', say, drift = 40, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const shown = useInView(ref, { threshold: 0.25 });
  const visible = useInView(ref, { once: false, threshold: 0 });
  const [talking, setTalking] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce || !drift || !visible) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const t = (r.top + r.height / 2) / window.innerHeight - 0.5; // -0.5 .. 0.5 across the screen
      el.style.setProperty('--drift', `${(-t * drift).toFixed(1)}px`);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduce, drift, visible]);

  return (
    <div
      ref={ref}
      className={['character-figure', className].filter(Boolean).join(' ')}
      data-shown={shown ? '' : undefined}
      onPointerEnter={() => setTalking(true)}
      onPointerLeave={() => setTalking(false)}
      onClick={() => setTalking((t) => !t)}
    >
      <div className="character-figure__body">
        <Character name={name} alt={alt} />
      </div>
      {say && (
        <span className="bubble character-figure__bubble" data-show={talking ? '' : undefined}>
          {say}
        </span>
      )}
    </div>
  );
}
