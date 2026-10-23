import { useEffect, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { asset } from './content';
import { ChatIcon, GoldWordmark } from './icons';
import { OrderButton, OrderPicker } from './OrderPicker';

export type NavLink = { href: string; label: string };

/** In-app routes go through the router; anchors (#shop, /#founders) are plain links so the browser scrolls to them. */
function NavItem({ link, onClick }: { link: NavLink; onClick?: () => void }) {
  return link.href.startsWith('/') && !link.href.includes('#') ? (
    <Link to={link.href} onClick={onClick}>
      {link.label}
    </Link>
  ) : (
    <a href={link.href} onClick={onClick}>
      {link.label}
    </a>
  );
}

/** The floating nav pill shared by the home page and the products page. */
export function SiteHeader({ nav, brandHref }: { nav: NavLink[]; brandHref: string }) {
  const header = useRef<HTMLElement>(null);
  useHeaderHeight(header);
  const compactNav = useScrolledPast(24);
  const [menuOpen, setMenuOpen] = useMenuDismiss(header);
  const brand = (
    <>
      <img className="brand-mark" src={asset('cow-emblem-128.webp')} alt="" width={122} height={128} />
      <GoldWordmark />
    </>
  );

  // The order sheet sits beside the header, so header styles (pointer-events, transforms) never reach it.
  return (
    <>
      <header className="site-header" ref={header} data-compact={compactNav ? '' : undefined}>
        <div className="nav-pill">
          {brandHref.startsWith('#') ? (
            <a className="brand" href={brandHref} aria-label="Nimmi's Products, home">
              {brand}
            </a>
          ) : (
            <Link className="brand" to={brandHref} aria-label="Nimmi's Products, home">
              {brand}
            </Link>
          )}
          <nav className="nav" aria-label="Main">
            {nav.map((l) => (
              <NavItem key={l.href} link={l} />
            ))}
          </nav>
          <OrderButton className="btn btn-sm nav-cta" label="Order on WhatsApp">
            <ChatIcon />
            <span>
              Order<span className="nav-cta__more"> on WhatsApp</span>
            </span>
          </OrderButton>
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
          {nav.map((l) => (
            <NavItem key={l.href} link={l} onClick={() => setMenuOpen(false)} />
          ))}
        </nav>
      </header>
      <OrderPicker />
    </>
  );
}

export function SiteFooter() {
  return (
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
  );
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
