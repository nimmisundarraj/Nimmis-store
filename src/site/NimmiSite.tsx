import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { CowLoader, CowPeek, OrderReactions } from '../characters';
import { useMediaQuery, useReducedMotion } from '../characters/hooks';
import { Link, useNavigationType } from 'react-router-dom';
import { findVariant, rupees } from '../catalog/format';
import type { CatalogProduct } from '../catalog/types';
import { useCatalog } from '../catalog/useCatalog';
import { asset, EMAIL, FSSAI_NO, GHEE_IMG, INSTAGRAM_URL, MAP_EMBED, MAPS_URL, SHOP_HOURS, SIZE_RANGE, USES, sizeOrderMsg, waLink } from './content';
import { Founders } from './Founders';
import { Hero } from './hero/Hero';
import { ChatIcon, SvgDefs } from './icons';
import { DishCard } from './DishCard';
import { MoreProductsCard } from './MoreProductsCard';
import { OrderButton } from './OrderPicker';
import { ProductCard } from './ProductCard';
import { SiteFooter, SiteHeader } from './SiteChrome';
import './site.css';

/** The loader's minimum time on screen, plus its 700 ms fade; the pour waits for both. */
const LOADER_MS = 2700;
const INTRO_MS = LOADER_MS + 700;
/** The emblem intro plays once per browser session; later visits go straight to the page. */
const INTRO_KEY = 'nimmi-intro-seen';

const NAV = [
  { href: '/products', label: 'Products' },
  { href: '#founders', label: 'Our story' },
];

/** Product cards on the home page before the "more in the shop" tile: two full rows wide, three on a phone. */
const HOME_CARDS = { wide: 5, narrow: 3 };

const MARQUEE = ['Making ghee since 1994', 'നെയ്യ്', 'Small batches, made by hand', 'Six sizes, 50 ml to 2 litres', 'Dry fruits and spices'];

/** The one-page Nimmi's ghee site. */
export function NimmiSite() {
  const root = useRef<HTMLDivElement>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const onSceneReady = useCallback(() => setSceneReady(true), []);
  const [introSeen] = useState(() => readFlag(INTRO_KEY));
  const { products } = useCatalog();
  const wide = useMediaQuery('(min-width: 620px)');
  const featured = products.filter((p) => p.featured).slice(0, wide ? HOME_CARDS.wide : HOME_CARDS.narrow);
  // Ghee has the size gallery above, so it isn't counted as "more".
  const more = products.filter((p) => !featured.includes(p) && p.id !== 'ghee');
  const ghee = products.find((p) => p.id === 'ghee');
  useReveal(root);
  useTopOnArrival();

  useEffect(() => {
    if (sceneReady) writeFlag(INTRO_KEY);
  }, [sceneReady]);

  // Don't hold the page behind the loader if the photo is slow.
  useEffect(() => {
    const t = window.setTimeout(() => setSceneReady(true), 4000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="nimmi-site" ref={root}>
      <SvgDefs />
      {!introSeen && (
        <CowLoader
          done={sceneReady}
          minDuration={LOADER_MS}
          emblem={{
            ring: asset('emblem-ring.webp'),
            centre: asset('emblem-drop.webp'),
            mask: asset('emblem-drop-mask.png'),
            morphTo: asset('emblem-cow.webp'),
          }}
        />
      )}
      <OrderReactions />

      <SiteHeader nav={NAV} brandHref="#top" />

      <main id="top">
        <Hero onSceneReady={onSceneReady} introMs={introSeen ? 0 : INTRO_MS} />
        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[...MARQUEE, ...MARQUEE].map((word, i) => (
              <span key={i} style={{ display: 'contents' }}>
                <span className={i % MARQUEE.length === 1 ? 'ml' : undefined}>{word}</span>
                <i />
              </span>
            ))}
          </div>
        </div>

        <section className="lineup-sec" id="sizes" aria-labelledby="sizes-title">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">The Nimmi’s Collection</span>
              <h2 id="sizes-title">One tradition. Six ways to enjoy it.</h2>
              <p>From a little taste to a jar for the whole family, find your Nimmi’s size.</p>
            </div>
            <ul className="size-grid">
              {SIZE_RANGE.map((s) => (
                <li key={s.size} className="size-item reveal" style={{ '--scale': s.scale } as CSSProperties}>
                  <div className="size-stage">
                    <img src={asset(GHEE_IMG[s.size])} alt={`Nimmi’s Pure Ghee, ${s.label} jar`} loading="lazy" />
                  </div>
                  <div className="size-info">
                    <h3 className="size-qty">{s.label}</h3>
                    <p className="size-note">{s.note}</p>
                    <SizePrice ghee={ghee} size={s.size} />
                  </div>
                  {/* The link stretches over the whole card, so the jar is a tap target too without nesting links. */}
                  <a className="size-cta" href={waLink(sizeOrderMsg(s.label))} target="_blank" rel="noopener noreferrer" data-order="">
                    <ChatIcon />
                    <span>
                      Order on WhatsApp<span className="sr-only">, {s.label} jar (opens in a new tab)</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section range" id="range" aria-labelledby="range-title">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Dry fruits and spices</span>
              <h2 id="range-title">Alongside the ghee, what our customers asked for.</h2>
              <p>Tap any of them for sizes and prices, then order on WhatsApp.</p>
            </div>
            <div className="grid-products">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} mode="link" />
              ))}
              {products.length > 0 && <MoreProductsCard hidden={more} all={products} />}
            </div>
            <div className="sizes-close">
              <h3>Every jar carries a little tradition.</h3>
              <p>Choose your Nimmi’s size and speak with us directly to place your order.</p>
              <div className="cta-row">
                <Link className="btn" to="/products" state={{ from: 'see-all' }}>
                  See all products
                </Link>
                <OrderButton className="btn btn-ghost">
                  <ChatIcon />
                  Order on WhatsApp
                </OrderButton>
              </div>
            </div>
          </div>
        </section>

        <Founders />

        {/* The founders' story is told once, just above; this half is the shop you can visit. */}
        <section className="section" id="shop" aria-labelledby="shop-title">
          <div className="wrap">
            <div className="story">
              <figure className="shop-map reveal">
                <iframe
                  className="shop-map__frame"
                  title="Map showing Nimmi’s Products at 4th Mile, West Ponniam, Thalassery"
                  src={MAP_EMBED}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
                <figcaption className="shop-map__card">
                  <img src={asset('cow-emblem-128.webp')} alt="" width={122} height={128} loading="lazy" />
                  <span className="shop-map__name">
                    <strong>Nimmi’s Products</strong>
                    <span>4th Mile, West Ponniam, Thalassery</span>
                  </span>
                  <a className="btn btn-sm" href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                    Directions
                  </a>
                </figcaption>
              </figure>
              <div className="story-copy">
                <span className="eyebrow">Our shop</span>
                <h2 id="shop-title">Still under the same board at 4th Mile.</h2>
                <p className="big">Come by for a jar, or message us and we’ll pack it fresh.</p>
              </div>
            </div>
            <dl className="trust">
              <div>
                <dt>Shop</dt>
                <dd>Dinesh Building, 4th Mile, West Ponniam (P.O), Thalassery 670 641</dd>
              </div>
              {FSSAI_NO && (
                <div>
                  <dt>FSSAI licence</dt>
                  <dd>{FSSAI_NO}</dd>
                </div>
              )}
              <div>
                <dt>Delivery</dt>
                <dd>Ask us on WhatsApp</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="section uses-sec" aria-labelledby="uses-title">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Where it goes</span>
              <h2 id="uses-title">Every Malabar kitchen has a jar for these.</h2>
            </div>
            <div className="uses">
              {USES.map((u) => (
                <DishCard key={u.title} use={u} products={products} />
              ))}
            </div>
          </div>
        </section>

        <section className="order" id="order" aria-labelledby="order-title" data-cow-zone="order">
          <div className="peek-slot peek-slot--order">
            <CowPeek edge="bottom" zone="order" say="We pack it fresh!" />
          </div>
          <div className="wrap">
            <h2 id="order-title">
              Tap Order. We’ll take it from there.
            </h2>
            <div className="order-side">
              <p>Pick your products and sizes, and WhatsApp opens with your order already typed. Fill in your delivery address and send it. We reply with the price and delivery time, and pack your order once you confirm.</p>
              <p>Ordering for family back home? Send their address instead of yours.</p>
              <div className="cta-row">
                <OrderButton>
                  <ChatIcon />
                  Order on WhatsApp
                </OrderButton>
                <a className="btn btn-ghost" href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                  Find us on Google Maps
                </a>
              </div>
              <dl className="contact-list">
                <div>
                  <dt>Shop</dt>
                  <dd>4th Mile, West Ponniam, Thalassery</dd>
                </div>
                <div>
                  <dt>Instagram</dt>
                  <dd>
                    <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                      @nimmis_product
                    </a>
                  </dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
                  </dd>
                </div>
                {SHOP_HOURS && (
                  <div>
                    <dt>Hours</dt>
                    <dd>{SHOP_HOURS}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

    </div>
  );
}

/** The jar's price from the catalog, once one has been set in the admin panel. */
function SizePrice({ ghee, size }: { ghee?: CatalogProduct; size: string }) {
  const v = ghee && findVariant(ghee, size);
  if (!v) return null;
  if (!v.inStock) return <p className="size-price size-price--out">Out of stock</p>;
  return v.price != null ? <p className="size-price">{rupees(v.price)}</p> : null;
}

/** sessionStorage can throw (private mode, blocked storage); then the intro just plays again. */
function readFlag(key: string) {
  try {
    return window.sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeFlag(key: string) {
  try {
    window.sessionStorage.setItem(key, '1');
  } catch {
    // ignore
  }
}

/** Lifts every .reveal element into place the first time it scrolls into view. */
function useReveal(root: RefObject<HTMLElement>) {
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = root.current;
    if (!el || reduce || typeof IntersectionObserver === 'undefined') return;
    const items = Array.from(el.querySelectorAll<HTMLElement>('.reveal'));
    const io = new IntersectionObserver(
      (entries) => {
        entries
          .filter((e) => e.isIntersecting)
          .forEach((e, i) => {
            const item = e.target as HTMLElement;
            item.style.transitionDelay = `${i * 90}ms`;
            item.dataset.reveal = 'shown';
            io.unobserve(item);
          });
      },
      { rootMargin: '0px 0px -6% 0px' },
    );
    items.forEach((item) => {
      // Anything already on screen stays put; only what is below the fold waits to rise in.
      if (item.getBoundingClientRect().top < window.innerHeight) return;
      item.dataset.reveal = 'waiting';
      io.observe(item);
    });
    return () => io.disconnect();
  }, [root, reduce]);
}

/**
 * Coming in through a link from another page (the products page's Home links), start at the top.
 * Going back with the browser or "Back to home" keeps the browser's own scroll position.
 */
function useTopOnArrival() {
  const navType = useNavigationType();
  useEffect(() => {
    if (navType !== 'PUSH' || window.location.hash) return;
    const html = document.documentElement;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    html.style.scrollBehavior = '';
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
