import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';
import { ProductCow } from '../characters';
import { canHover, useReducedMotion } from '../characters/hooks';
import { asset, GHEE_IMG, orderMsg, waLink, type GheeSize, type SiteProduct } from './content';
import { ChatIcon } from './icons';
import { ProductArt } from './ProductArt';

const FADE_MS = 180;

export function ProductCard({ product: p }: { product: SiteProduct }) {
  const card = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const tilt = !reduce && canHover();
  const [size, setSize] = useState<GheeSize | undefined>(p.defaultSize);
  // The jar photo fades out, swaps, and fades back in when the size changes.
  const [shownSize, setShownSize] = useState(size);
  const [fading, setFading] = useState(false);
  const video = useVideoOnHover(p.video ? card : null, reduce);

  useEffect(() => {
    if (size === shownSize) return;
    setFading(true);
    const t = window.setTimeout(() => {
      setShownSize(size);
      setFading(false);
    }, FADE_MS);
    return () => window.clearTimeout(t);
  }, [size, shownSize]);

  const onMove = (e: PointerEvent<HTMLElement>) => {
    const el = card.current;
    if (!el || !tilt) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`);
  };
  const onLeave = () => {
    card.current?.style.setProperty('--rx', '0deg');
    card.current?.style.setProperty('--ry', '0deg');
  };

  return (
    <article
      ref={card}
      className={['card', 'reveal', 'has-product-cow', p.feature && 'feature'].filter(Boolean).join(' ')}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className={['card-art', video.playing && 'playing'].filter(Boolean).join(' ')} ref={video.box}>
        <span className={['card-tag', !p.art && 'real'].filter(Boolean).join(' ')}>{p.tag}</span>
        {shownSize && (
          <img className="art-img" src={asset(GHEE_IMG[shownSize])} alt="Nimmi's Pure Ghee jar" loading="lazy" style={{ opacity: fading ? 0 : 1 }} />
        )}
        {p.photo && <img className="art-img art-photo" src={asset(p.photo)} alt={`Nimmi's ${p.name} pouch`} loading="lazy" />}
        {p.video && p.photo && (
          <video ref={video.ref} muted loop playsInline preload="none" poster={asset(p.photo)}>
            <source src={asset(p.video)} type="video/mp4" />
          </video>
        )}
        {p.art && <ProductArt art={p.art} />}
        <ProductCow product={p.key} />
      </div>
      <div className="card-body">
        <div className="card-title">
          <h3>{p.name}</h3>
          <span className="ml">{p.ml}</span>
        </div>
        <p>{p.desc}</p>
        {p.sizes && (
          <div className="sizes" role="group" aria-label="Size">
            {p.sizes.map((s) => (
              <button key={s} className="size" type="button" aria-pressed={s === size} onClick={() => setSize(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="card-foot">
          <span className="price">
            <b>₹</b>Price on WhatsApp
          </span>
          <a className="btn btn-sm" href={waLink(orderMsg(p.name, size))} target="_blank" rel="noopener noreferrer" data-order="">
            <ChatIcon />
            Order
          </a>
        </div>
      </div>
    </article>
  );
}

/**
 * Plays the card's clip while a mouse is over the card. On touch screens it plays while the
 * clip is mostly on screen instead.
 */
function useVideoOnHover(card: RefObject<HTMLElement> | null, reduce: boolean) {
  const ref = useRef<HTMLVideoElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = card?.current, v = ref.current, b = box.current;
    if (!el || !v || !b) return;
    const play = () => {
      setPlaying(true);
      v.play().catch(() => setPlaying(false));
    };
    const stop = () => {
      v.pause();
      setPlaying(false);
    };
    const enter = (e: globalThis.PointerEvent) => e.pointerType === 'mouse' && play();
    const leave = (e: globalThis.PointerEvent) => e.pointerType === 'mouse' && stop();
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointerleave', leave);
    let io: IntersectionObserver | undefined;
    if (!canHover() && !reduce) {
      io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : stop()), { threshold: 0.6 });
      io.observe(b);
    }
    return () => {
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointerleave', leave);
      io?.disconnect();
    };
  }, [card, reduce]);

  return { ref, box, playing };
}
