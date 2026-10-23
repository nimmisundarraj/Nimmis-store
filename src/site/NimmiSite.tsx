import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { CowLoader, CowPeek, OrderReactions } from '../characters';
import { useReducedMotion } from '../characters/hooks';
import { asset, EMAIL, FSSAI_NO, GENERAL_ORDER, GHEE_IMG, INSTAGRAM_URL, MAP_EMBED, MAPS_URL, PRODUCTS, SHOP_HOURS, SIZE_RANGE, USES, sizeOrderMsg, waLink } from './content';
import { Founders } from './Founders';
import { Hero } from './hero/Hero';
import { ChatIcon, GoldWordmark, SvgDefs } from './icons';
import { Process } from './Process';
import { ProductCard } from './ProductCard';
import './site.css';

/** The loader's minimum time on screen, plus its 700 ms fade; the pour waits for both. */
const LOADER_MS = 2700;
const INTRO_MS = LOADER_MS + 700;
/** The emblem intro plays once per browser session; later visits go straight to the page. */
const INTRO_KEY = 'nimmi-intro-seen';

const NAV = [
  { href: '#sizes', label: 'Products' },
  { href: '#made', label: 'Our craft' },
  { href: '#founders', label: 'Our story' },
];

const MARQUEE = ['Making ghee since 1994', 'നെയ്യ്', 'Small batches, made by hand', 'Six sizes, 50 ml to 2 litres', 'Dry fruits and spices'];

/** The one-page Nimmi's ghee site. */
export function NimmiSite() {
  const root = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLElement>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const onSceneReady = useCallback(() => setSceneReady(true), []);
  const [introSeen] = useState(() => readFlag(INTRO_KEY));
  useHeaderHeight(header);
  const compactNav = useScrolledPast(24);
  const [menuOpen, setMenuOpen] = useMenuDismiss(header);
  useReveal(root);

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

      <header className="site-header" ref={header} data-compact={compactNav ? '' : undefined}>
        <div className="nav-pill">
          <a className="brand" href="#top" aria-label="Nimmi's Products, home">
            <img className="brand-mark" src={asset('cow-emblem-128.webp')} alt="" width={122} height={128} />
            <GoldWordmark />
          </a>
          <nav className="nav" aria-label="Main">
            {NAV.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
          <a
            className="btn btn-sm nav-cta"
            href={waLink(GENERAL_ORDER)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Order on WhatsApp"
            data-order=""
          >
            <ChatIcon />
            <span>
              Order<span className="nav-cta__more"> on WhatsApp</span>
            </span>
          </a>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span aria-hidden="true" />
          </button>
          <div className="progress" aria-hidden="true" />
        </div>
        <nav id="site-menu" className="nav-menu" aria-label="Main" hidden={!menuOpen}>
          {NAV.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
              {l.label}
            </a>
          ))}
        </nav>
      </header>

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
                <li key={s.size} className={`size-item reveal${s.offCentre ? ' size-item--offset' : ''}`} style={{ '--scale': s.scale } as CSSProperties}>
                  <div className="size-stage">
                    <img src={asset(GHEE_IMG[s.size])} alt={`Nimmi’s Pure Ghee, ${s.label} jar`} loading="lazy" />
                  </div>
                  <div className="size-info">
                    <h3 className="size-qty">{s.label}</h3>
                    <p className="size-note">{s.note}</p>
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
              <p>Tap Order on any of them. WhatsApp opens with your choice filled in.</p>
            </div>
            <div className="grid-products">
              {PRODUCTS.map((p) => (
                <ProductCard key={p.key} product={p} />
              ))}
            </div>
            <div className="sizes-close">
              <h3>Every jar carries a little tradition.</h3>
              <p>Choose your Nimmi’s size and speak with us directly to place your order.</p>
              <a className="btn" href={waLink(sizeOrderMsg())} target="_blank" rel="noopener noreferrer" data-order="">
                <ChatIcon />
                Order on WhatsApp
              </a>
            </div>
          </div>
        </section>

        <Process />
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
                <div key={u.title} className="use reveal">
                  <span className="ml">{u.ml}</span>
                  <h3>{u.title}</h3>
                  <p>{u.text}</p>
                </div>
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
              <p>WhatsApp opens with your order already typed. Fill in your delivery address and send it. We reply with the price and delivery time, and pack your order once you confirm.</p>
              <p>Ordering for family back home? Send their address instead of yours.</p>
              <div className="cta-row">
                <a className="btn" href={waLink(GENERAL_ORDER)} target="_blank" rel="noopener noreferrer" data-order="">
                  <ChatIcon />
                  Order on WhatsApp
                </a>
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

      <footer className="site-footer">
        <div className="wrap">
          <span className="footer-brand">
            <img className="brand-mark" src={asset('cow-emblem-128.webp')} alt="" width={122} height={128} loading="lazy" />
            <GoldWordmark />
          </span>
          <span className="tag">Made by hand in Thalassery since 1994.</span>
          <span>© {new Date().getFullYear()} Nimmi’s Products, Thalassery</span>
        </div>
      </footer>

    </div>
  );
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

/** Publishes how far down the floating nav reaches as --header-h, so anchored sections land just below it. */
function useHeaderHeight(header: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = header.current;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`);
    const ro = new ResizeObserver(set);
    ro.observe(el, { box: 'border-box' });
    set();
    return () => ro.disconnect();
  }, [header]);
}

/** The mobile menu's open state. It closes on Escape (returning focus to its button), on a tap outside the header, and when the window grows past the phone layout. */
function useMenuDismiss(header: RefObject<HTMLElement>) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      header.current?.querySelector<HTMLElement>('.nav-toggle')?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!header.current?.contains(e.target as Node)) setOpen(false);
    };
    const wide = window.matchMedia('(min-width: 761px)');
    const onWide = () => wide.matches && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    wide.addEventListener('change', onWide);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      wide.removeEventListener('change', onWide);
    };
  }, [open, header]);
  return [open, setOpen] as const;
}

/** True once the page has scrolled more than `px`; the nav tightens into its compact state from there. */
function useScrolledPast(px: number) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const check = () => setPast(window.scrollY > px);
    window.addEventListener('scroll', check, { passive: true });
    check();
    return () => window.removeEventListener('scroll', check);
  }, [px]);
  return past;
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
