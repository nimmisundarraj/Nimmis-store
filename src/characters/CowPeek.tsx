import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Character, preloadCharacters } from './Character';
import { useInView, useReducedMotion } from './hooks';
import { useOrderMood } from './orderMood';

type Props = {
  /** Which edge she peeks over. Put the component flush against that edge. */
  edge?: 'bottom' | 'right' | 'left';
  /** Line she says on hover or tap. */
  say?: string;
  /** Reacts to Order buttons inside the [data-cow-zone] with this name. */
  zone?: string;
  /** Extra wait after scrolling into view, in ms. */
  delay?: number;
  /** Makes her a guide: tapping her follows this link (e.g. "#sizes"). */
  href?: string;
  /** A line she keeps saying once she is up, inviting a tap; `say` still plays on hover. */
  invite?: string;
  className?: string;
  style?: CSSProperties;
};

const MOOD_LINES = { excited: 'Moo! Good choice!', happy: 'Opening WhatsApp…' } as const;

/**
 * The cow peeking in from the edge of a section. Slides in when the section scrolls into
 * view, says hello on hover, and gets excited about Order buttons in her zone.
 */
export function CowPeek({ edge = 'bottom', say = 'Moo!', zone, delay = 400, href, invite, className, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { threshold: 0.2 });
  const [shown, setShown] = useState(false);
  const [poke, setPoke] = useState(0); // bumps on hover/tap to replay the wiggle
  const [talking, setTalking] = useState(false);
  const order = useOrderMood();
  const mood = zone && order.zone === zone ? order.mood : 'idle';

  useEffect(() => {
    if (!inView) return;
    const t = window.setTimeout(() => setShown(true), reduce ? 0 : delay);
    return () => window.clearTimeout(t);
  }, [inView, delay, reduce]);

  useEffect(() => preloadCharacters(['cow-peek-excited', 'cow-peek-happy']), []);

  const hello = () => {
    setPoke((n) => n + 1);
    setTalking(true);
  };

  const pose = edge === 'bottom' ? (mood === 'excited' ? 'cow-peek-excited' : mood === 'happy' ? 'cow-peek-happy' : 'cow-peek') : 'cow-peek-side';
  const line = mood !== 'idle' ? MOOD_LINES[mood] : talking ? say : shown && invite ? invite : '';

  return (
    <div
      ref={ref}
      className={['cow-peek', `cow-peek--${edge}`, className].filter(Boolean).join(' ')}
      data-state={!shown ? 'hidden' : mood !== 'idle' ? mood : 'peek'}
      style={style}
      onPointerEnter={hello}
      onPointerLeave={() => setTalking(false)}
      onClick={hello}
    >
      <div className="cow-peek__cow">
        <div key={poke} className="cow-peek__wiggle">
          <Character name={pose} alt="" />
        </div>
        {mood === 'happy' && <Hearts />}
      </div>
      {href && <a className="cow-peek__link" href={href} aria-label={invite ?? say} />}
      <span className="bubble cow-peek__bubble" data-show={line ? '' : undefined} aria-live="polite">
        {line}
      </span>
    </div>
  );
}

export function Hearts() {
  return (
    <span className="hearts" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <i key={i} style={{ '--i': i } as CSSProperties}>
          ♥
        </i>
      ))}
    </span>
  );
}
