import { useEffect, useRef, useState } from 'react';
import { asset } from './content';

const STEPS = [
  { n: '01 · Melt', title: 'White butter goes in.', text: 'It melts in a heavy pot on the lowest flame.' },
  { n: '02 · Boil off', title: 'The water cooks out.', text: 'It foams and crackles.' },
  { n: '03 · Clear', title: 'The foam settles.', text: 'The ghee turns clear and golden.' },
  { n: '04 · Flame off', title: 'The smell turns nutty.', text: 'The solids turn light brown. That’s when the flame goes off.' },
  { n: '05 · Jar', title: 'Strained, cooled and sealed.', text: 'It sets into soft grains in the jar.' },
];
// Per step: the photo of the batch at that stage and how hot it is.
const PHOTOS = [
  { src: 'process-melt.webp', alt: 'White butter in a steel pot over a low gas flame' },
  { src: 'process-boil.webp', alt: 'The butter foaming and steaming as its water cooks out' },
  { src: 'process-clear.webp', alt: 'Clear golden ghee in the pot as the foam settles' },
  { src: 'process-pour.webp', alt: 'Amber ghee ladled from the pot, the browned solids below' },
  { src: 'process-jar.webp', alt: 'A sealed jar of set ghee beside the empty pot, the browned solids left in the strainer' },
];
const STEP_PHOTO = [0, 1, 2, 3, 4];
const TEMPS = ['~35°C', '100°C', '~110°C', '~120°C', 'Cooling'];

/** "How it's made": scrolling through the steps cooks a batch in the pot beside them. */
export function Process() {
  const section = useRef<HTMLElement>(null);
  const steps = useRef<HTMLOListElement>(null);
  const pot = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const list = steps.current, potCol = pot.current;
    if (!list || !potCol) return;
    let raf = 0;
    // The active step is the one level with the pot: beside it on desktop, or in the middle of the
    // space below it on phones, where the pot pins above the steps.
    const update = () => {
      raf = 0;
      const p = potCol.getBoundingClientRect(), l = list.getBoundingClientRect();
      const beside = p.right <= l.left;
      const line = beside ? p.top + p.height / 2 : (p.bottom + window.innerHeight) / 2;
      let best = 0, bestGap = Infinity;
      Array.from(list.children).forEach((el, i) => {
        const r = el.getBoundingClientRect(), gap = Math.abs(r.top + r.height / 2 - line);
        if (gap < bestGap) [best, bestGap] = [i, gap];
      });
      setActive(best);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <section ref={section} className="section process" id="made" aria-labelledby="made-title">
      <div className="wrap" style={{ position: 'relative' }}>
        <div className="section-head">
          <span className="eyebrow">How it’s made</span>
          <h2 id="made-title">From white butter to ghee, on a low flame.</h2>
          <p>Scroll to cook a batch.</p>
        </div>
        <div className="process-grid">
          <div className="pot-col" ref={pot}>
            <div className="pot-wrap">
              {PHOTOS.map((photo, i) => (
                <img
                  key={photo.src}
                  src={asset(photo.src)}
                  alt={photo.alt}
                  width={960}
                  height={900}
                  loading="lazy"
                  decoding="async"
                  aria-hidden={i !== STEP_PHOTO[active]}
                  data-shown={i === STEP_PHOTO[active] ? '' : undefined}
                />
              ))}
            </div>
            <div className="readout">
              <span>
                Step {active + 1} of {STEPS.length}
              </span>
              <strong>{TEMPS[active]}</strong>
            </div>
          </div>
          <ol className="steps" ref={steps}>
            {STEPS.map((s, i) => (
              <li key={s.n} className={['step', i === active && 'is-active'].filter(Boolean).join(' ')}>
                <span className="step-n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
