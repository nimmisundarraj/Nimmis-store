import { useEffect, useRef, type CSSProperties, type RefObject } from 'react';
import { useReducedMotion } from '../characters/hooks';
import { FOUNDERS, FOUNDERS_PORTRAIT } from './content';
import { CowDivider } from './icons';
import './founders.css';

const line = (i: number) => ({ '--i': i }) as CSSProperties;

/** "The hands behind every batch": the founders, after How it's made and styled to mirror the hero. */
export function Founders() {
  const section = useRef<HTMLElement>(null);
  useFoundersMotion(section);
  const { year, dad, mom } = FOUNDERS;

  return (
    <section ref={section} className="makers" id="founders" aria-labelledby="founders-title">
      <div className="makers__wrap">
        <div className="makers__art">
          <div className="makers__glow" aria-hidden="true" />
          <div className="makers__frame">
            <img src={FOUNDERS_PORTRAIT} alt={`${dad} and ${mom}, founders of Nimmi's Products`} loading="lazy" decoding="async" width={840} height={1098} />
          </div>
        </div>

        <div className="makers__copy">
          <span className="makers__ghost" aria-hidden="true">
            30
          </span>
          <p className="makers__eyebrow makers__line" style={line(0)}>
            Since {year} · Thalassery
          </p>
          <h2 id="founders-title" className="makers__title makers__line" style={line(1)}>
            The hands behind every <em>batch</em>.
          </h2>
          <CowDivider className="makers__line" style={line(2)} />
          <p className="makers__lede makers__line" style={line(3)}>
            In {year}, {dad} and {mom} began making ghee in their own kitchen in Thalassery. They made it slowly, by
            hand, one small batch at a time, and people kept coming back for the smell of it.
          </p>
          <p className="makers__lede makers__line" style={line(4)}>
            In time, those same customers began asking for more, so the shelf grew to dates, dry fruits and spices. The
            nei is still made the way they first made it.
          </p>
          <p className="makers__sign makers__line" style={line(5)}>
            {dad} &amp; {mom}, Founders
          </p>
          <p className="makers__years makers__line" style={line(6)}>
            Years of ghee-making
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * Marks the section data-in="false" until it scrolls into view (CSS fades the parts in from there)
 * and writes --fp (-1..1, how far the section centre is from the viewport centre) for the
 * portrait's parallax. With reduced motion it does nothing, so everything simply shows.
 */
function useFoundersMotion(section: RefObject<HTMLElement>) {
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = section.current;
    if (!el || reduce || typeof IntersectionObserver === 'undefined') return;
    el.dataset.in = 'false';
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.dataset.in = 'true';
        io.disconnect();
      },
      { rootMargin: '0px 0px -18% 0px' },
    );
    io.observe(el);

    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect(), vh = window.innerHeight;
      const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      el.style.setProperty('--fp', Math.max(-1, Math.min(1, p)).toFixed(3));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      delete el.dataset.in;
      el.style.removeProperty('--fp');
    };
  }, [section, reduce]);
}
