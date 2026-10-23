import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { isProductKey, ProductCow } from '../characters';
import { canHover, useReducedMotion } from '../characters/hooks';
import { findVariant, imageUrl, inStock, priceSummary, rupees, startVariant } from '../catalog/format';
import { usePhotoSrc } from '../catalog/photos';
import type { CatalogProduct, Variant } from '../catalog/types';
import { orderMsg, waLink } from './content';
import { ChatIcon } from './icons';
import { ProductArt } from './ProductArt';

const FADE_MS = 180;

/**
 * `order`: the full card with sizes, prices and the WhatsApp Order button (the products page).
 * `link`: a preview whose whole card opens that product on the products page (the home page).
 */
type Mode = 'order' | 'link';

export function ProductCard({ product: p, mode = 'order', highlight }: { product: CatalogProduct; mode?: Mode; highlight?: boolean }) {
  const card = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const tilt = !reduce && canHover();
  // Kept as a label, so a fresh copy of the catalog (new prices, stock) shows through.
  const [label, setLabel] = useState(() => startVariant(p)?.label);
  const variant = findVariant(p, label) ?? startVariant(p);
  // A size with its own photo (the ghee jars) fades out, swaps, and fades back in.
  const src = variant?.image ?? p.variants.find((v) => v.image)?.image;
  const [shownSrc, setShownSrc] = useState(src);
  const [fading, setFading] = useState(false);
  const video = useVideoOnHover(p.video ? card : null, reduce);

  useEffect(() => {
    if (src === shownSrc) return;
    setFading(true);
    const t = window.setTimeout(() => {
      setShownSrc(src);
      setFading(false);
    }, FADE_MS);
    return () => window.clearTimeout(t);
  }, [src, shownSrc]);

  useEffect(() => {
    if (highlight) card.current?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }, [highlight, reduce]);

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

  const available = variant ? variant.inStock : inStock(p);
  const hasPhoto = Boolean(shownSrc || p.image);
  const sizeUrl = usePhotoSrc(shownSrc);
  const photoUrl = usePhotoSrc(p.image);
  const summary = priceSummary(p);
  const detail = [variant?.label, variant?.price != null ? rupees(variant.price) : null].filter(Boolean).join(', ');

  return (
    <article
      ref={card}
      id={`product-${p.id}`}
      className={['card', 'reveal', 'has-product-cow', !available && 'is-out', highlight && 'is-highlight'].filter(Boolean).join(' ')}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className={['card-art', video.playing && 'playing'].filter(Boolean).join(' ')} ref={video.box}>
        <span className={['card-tag', hasPhoto && 'real'].filter(Boolean).join(' ')}>{p.tag || p.category}</span>
        {sizeUrl && <img className="art-img" src={sizeUrl} alt={`Nimmi’s ${p.name}, ${variant?.label ?? ''}`} loading="lazy" style={{ opacity: fading ? 0 : 1 }} />}
        {!shownSrc && photoUrl && <img className="art-img art-photo" src={photoUrl} alt={`Nimmi’s ${p.name}`} loading="lazy" />}
        {p.video && photoUrl && (
          <video ref={video.ref} muted loop playsInline preload="none" poster={photoUrl}>
            <source src={imageUrl(p.video)} type="video/mp4" />
          </video>
        )}
        {!hasPhoto && p.art && <ProductArt art={p.art} />}
        {isProductKey(p.id) && <ProductCow product={p.id} />}
      </div>
      <div className="card-body">
        <div className="card-title">
          <h3>{p.name}</h3>
          {p.nameMl && <span className="ml">{p.nameMl}</span>}
        </div>
        <p>{p.description}</p>
        {mode === 'order' && p.variants.length > 0 && (
          <div className="sizes" role="group" aria-label="Size">
            {p.variants.map((v) => (
              <button
                key={v.label}
                className="size"
                type="button"
                aria-pressed={v.label === variant?.label}
                disabled={!v.inStock}
                title={v.inStock ? undefined : 'Out of stock'}
                onClick={() => setLabel(v.label)}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
        <div className="card-foot">
          {mode === 'order' ? <VariantPrice variant={variant} /> : <span className="price">{summary ? <b>{summary}</b> : <><b>₹</b>Price on WhatsApp</>}</span>}
          {mode === 'link' ? (
            <Link className="btn btn-sm card-link" to={`/products?item=${encodeURIComponent(p.id)}`}>
              View<span className="sr-only"> {p.name}</span>
            </Link>
          ) : available ? (
            <a className="btn btn-sm" href={waLink(orderMsg(p.name, detail))} target="_blank" rel="noopener noreferrer" data-order="">
              <ChatIcon />
              Order
            </a>
          ) : (
            <a className="btn btn-sm btn-ghost" href={waLink(`Hi Nimmi's Products! Is ${p.name} back in stock?`)} target="_blank" rel="noopener noreferrer">
              Ask when it’s back
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function VariantPrice({ variant }: { variant?: Variant }) {
  if (variant && !variant.inStock) return <span className="price price-out">Out of stock</span>;
  if (variant?.price == null)
    return (
      <span className="price">
        <b>₹</b>Price on WhatsApp
      </span>
    );
  return (
    <span className="price">
      <b>{rupees(variant.price)}</b>
      {variant.mrp != null && variant.mrp > variant.price && <s className="mrp">{rupees(variant.mrp)}</s>}
    </span>
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
