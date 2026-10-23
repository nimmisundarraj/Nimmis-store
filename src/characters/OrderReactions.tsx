import { useEffect } from 'react';
import { Character, preloadCharacters } from './Character';
import { Hearts } from './CowPeek';
import { setOrderMood, useOrderMood } from './orderMood';

type Props = {
  /** Elements that count as an Order button. */
  selector?: string;
  /** Show the little cow that pops up at the bottom of the screen for buttons outside any cow zone. */
  buddy?: boolean;
};

const BUDDY = 'buddy';

/**
 * Mount once (e.g. in App). Watches every Order button on the page through event delegation,
 * so existing buttons need no changes: hovering or focusing one makes the cows excited,
 * clicking makes them happy.
 *
 * Buttons inside an element with data-cow-zone="hero" excite the cow in that zone; all other
 * buttons call the buddy cow at the bottom of the screen.
 */
export function OrderReactions({ selector = '[data-order], [data-wa]', buddy = true }: Props) {
  useEffect(() => {
    preloadCharacters(['cow-excited', 'cow-happy']);
    const find = (t: EventTarget | null) => (t instanceof Element ? t.closest(selector) : null);
    const zoneOf = (el: Element) => el.closest<HTMLElement>('[data-cow-zone]')?.dataset.cowZone ?? BUDDY;

    const enter = (e: Event) => {
      const el = find(e.target);
      if (el) setOrderMood('excited', zoneOf(el));
    };
    const leave = (e: Event) => {
      const el = find(e.target);
      const to = (e as PointerEvent | FocusEvent).relatedTarget;
      if (el && !(to instanceof Node && el.contains(to))) setOrderMood('idle');
    };
    const click = (e: Event) => {
      const el = find(e.target);
      if (el) setOrderMood('happy', zoneOf(el));
    };

    document.addEventListener('pointerover', enter);
    document.addEventListener('pointerout', leave);
    document.addEventListener('focusin', enter);
    document.addEventListener('focusout', leave);
    document.addEventListener('click', click, true);
    return () => {
      document.removeEventListener('pointerover', enter);
      document.removeEventListener('pointerout', leave);
      document.removeEventListener('focusin', enter);
      document.removeEventListener('focusout', leave);
      document.removeEventListener('click', click, true);
    };
  }, [selector]);

  return buddy ? <OrderBuddy /> : null;
}

function OrderBuddy() {
  const { mood, zone } = useOrderMood();
  const active = zone === BUDDY && mood !== 'idle';
  return (
    <div className="order-buddy" data-state={active ? mood : 'hidden'} aria-hidden="true">
      <div className="order-buddy__cow">
        <Character name={mood === 'happy' ? 'cow-happy' : 'cow-excited'} />
        {active && mood === 'happy' && <Hearts />}
      </div>
      <span className="bubble order-buddy__bubble" data-show={active ? '' : undefined}>
        {mood === 'happy' ? 'Opening WhatsApp…' : 'Moo! Great pick!'}
      </span>
    </div>
  );
}
