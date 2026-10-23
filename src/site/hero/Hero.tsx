import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';
import { CowPeek } from '../../characters';
import { useReducedMotion } from '../../characters/hooks';
import { asset } from '../content';
import { createPourEngine, type PourEngine } from './pourEngine';
import './hero.css';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (v: number) => (v < 0.5 ? 2 * v * v : 1 - (-2 * v + 2) ** 2 / 2);
const MOBILE = '(max-width: 860px)';

type HeroProps = {
  sizesHref?: string;
  storyHref?: string;
  /** Called once the pour photo is on screen, so the loader can leave. */
  onSceneReady?: () => void;
  /** How long the loader covers the page, in ms; the ghee starts to fall once it has gone. */
  introMs?: number;
};

export function Hero({ sizesHref = '#sizes', storyHref = '#founders', onSceneReady, introMs = 3400 }: HeroProps) {
  const section = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  useHeroProgress(section, pin, reduce);
  const scrolled = useScrolled(24);

  return (
    <section ref={section} className="hero3" aria-labelledby="hero-title" data-cow-zone="hero">
      <div ref={pin} className="hero3__pin">
        <PourScene className="hero3__scene" onReady={onSceneReady} introMs={introMs} />
        <div className="hero3__scrim" aria-hidden="true" />
        <Leaf className="hero3__leaf hero3__leaf--tl" seed={1} />
        <div className="hero3__cowslot" data-away={scrolled ? '' : undefined}>
          <CowPeek edge="bottom" zone="hero" say="Moo! Have you tried our ghee?" delay={3200} />
        </div>
        <div className="hero3__wrap">
          <div className="hero3__copy">
            <img className="hero3__badge" src={asset('purity-seal.webp')} alt="30 years of purity" width={440} height={486} />
            <h1 id="hero-title" className="hero3__title">
              A little tradition.
              <br />
              A lot of <span className="hero3__keep">golden goodness.</span>
            </h1>
            <p className="hero3__lede">
              Nimmi’s ghee is made by our family in Thalassery, Kerala, since 1994. Alongside it, dates, dry fruits and spices
              chosen with the same care.
            </p>
            <div className="hero3__cta">
              <a className="btn hero3__btn" href={sizesHref}>
                Explore our ghee and more
              </a>
              <a className="hero3__link" href={storyHref}>
                Our family story
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Writes --hero-p (0..1) on the section as the pinned hero scrolls away. On phones, where the
 * hero is not pinned, it also eases in a little on its own after load so the pour still moves.
 */
function useHeroProgress(section: RefObject<HTMLElement>, pin: RefObject<HTMLElement>, reduce: boolean) {
  useEffect(() => {
    const el = section.current, sticky = pin.current;
    if (!el || !sticky) return;
    const mq = window.matchMedia(MOBILE);
    const startedAt = performance.now();
    let raf = 0, visible = true, last = -1;

    const update = (now: number) => {
      raf = 0;
      const mobile = mq.matches;
      const r = el.getBoundingClientRect();
      const top = parseFloat(getComputedStyle(sticky).top) || 0;
      const scrolled = clamp01(mobile ? -r.top / (r.height * 0.9) : (top - r.top) / Math.max(1, r.height - sticky.offsetHeight));
      const secs = (now - startedAt) / 1000;
      const intro = mobile && !reduce ? 0.45 * easeInOut(clamp01((secs - 1.4) / 0.9)) : 0;
      const p = Math.max(scrolled, intro);
      if (p !== last) {
        last = p;
        el.style.setProperty('--hero-p', p.toFixed(4));
      }
      if (visible && mobile && !reduce && secs < 3.6) raf = requestAnimationFrame(update);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) schedule();
    });
    io.observe(el);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    mq.addEventListener('change', schedule);
    schedule();
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      mq.removeEventListener('change', schedule);
    };
  }, [section, pin, reduce]);
}

type PourProps = { className?: string; onReady?: () => void; introMs: number; children?: ReactNode };
type PourState = 'loading' | 'ready' | 'still';

/** The pour photo with the live stream painted over it. Falls back to the plain photo with reduced motion. */
function PourScene({ className, onReady, introMs, children }: PourProps) {
  const root = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [state, setState] = useState<PourState>('loading');
  const readyRef = useRef(onReady);
  readyRef.current = onReady;
  const mountedAt = useRef(performance.now());

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const img = el.querySelector<HTMLImageElement>('.pour-scene__photo');
    const canvas = el.querySelector<HTMLCanvasElement>('.pour-scene__canvas');
    if (!img) return;
    let done = false;
    const ready = () => {
      if (done) return;
      done = true;
      readyRef.current?.();
    };
    if (reduce || !canvas) {
      setState('still');
      if (img.complete) ready();
      else img.addEventListener('load', ready, { once: true });
      return;
    }
    let engine: PourEngine | null = null;
    try {
      engine = createPourEngine(canvas, img);
    } catch (err) {
      console.warn('Pour animation unavailable; showing the photo instead.', err);
    }
    if (!engine) {
      setState('still');
      ready();
      return;
    }
    const pour = engine;
    const go = () => {
      setState('ready');
      ready();
      // let the loader (with the cow turning into the emblem) fade away before the ghee starts to fall
      pour.start(Math.max(0.5, (mountedAt.current + introMs - performance.now()) / 1000));
    };
    const fail = () => {
      setState('still');
      ready();
    };
    if (img.complete && img.naturalWidth) go();
    else {
      img.addEventListener('load', go, { once: true });
      img.addEventListener('error', fail, { once: true });
    }
    return () => {
      img.removeEventListener('load', go);
      img.removeEventListener('error', fail);
      pour.dispose();
    };
  }, [reduce, introMs]);

  return (
    <div ref={root} className={['pour-scene', className].filter(Boolean).join(' ')} data-state={state}>
      <div className="pour-scene__stage">
        <img
          className="pour-scene__photo"
          src={asset(state === 'still' ? 'ghee-garden-pour.webp' : 'ghee-garden.webp')}
          alt="Golden ghee pouring from a bronze ladle into a brass pot on a laterite stone in a Kerala garden, with curry leaves, jasmine, almonds and cashews"
          decoding="async"
        />
        {state !== 'still' && <canvas className="pour-scene__canvas" aria-hidden="true" />}
      </div>
      {children}
    </div>
  );
}

/** A curry-leaf sprig, generated along a curve. */
function Leaf({ className, seed = 0 }: { className?: string; seed?: number }) {
  const id = useId().replace(/:/g, '');
  const p0 = [24, 290], p1 = [120, 210], p2 = [290, 40];
  const at = (t: number) => [
    (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
    (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
  ];
  const angle = (t: number) => {
    const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };
  const leaves = Array.from({ length: 15 }, (_, i) => {
    const t = 0.1 + (i / 14) * 0.86, side = i % 2 ? 1 : -1, [x, y] = at(t);
    const size = 0.75 + 0.35 * Math.sin(Math.PI * t) + ((i * 37 + seed * 11) % 7) / 40;
    return { x, y, rot: angle(t) + side * (58 + ((i * 13 + seed) % 9)), size };
  });
  return (
    <svg className={className} viewBox="0 0 300 300" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-l`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#8cc35c" />
          <stop offset=".55" stopColor="#4a8a3a" />
          <stop offset="1" stopColor="#2a5e28" />
        </linearGradient>
      </defs>
      <path d={`M${p0} Q${p1} ${p2}`} stroke="#4b6b2a" strokeWidth="3" fill="none" strokeLinecap="round" />
      {leaves.map((l, i) => (
        <g key={i} transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.rot.toFixed(1)}) scale(${l.size.toFixed(2)})`}>
          <path d="M0,0 C10,-11 34,-13 52,0 C34,13 10,11 0,0Z" fill={`url(#${id}-l)`} />
          <path d="M2,0 C18,-1 34,-1 50,0" stroke="#a9c97a" strokeOpacity=".55" strokeWidth="1.2" fill="none" />
          <path d="M14,-5 C24,-8 34,-7 42,-3" stroke="#e8f5c8" strokeOpacity=".3" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

/** True once the page has scrolled past `px`: the hero cow ducks out of sight then, until the cursor finds her. */
function useScrolled(px: number) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const check = () => setPast(window.scrollY > px);
    window.addEventListener('scroll', check, { passive: true });
    check();
    return () => window.removeEventListener('scroll', check);
  }, [px]);
  return past;
}
