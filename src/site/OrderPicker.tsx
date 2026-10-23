import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { rupees } from '../catalog/format';
import { usePhotoSrc } from '../catalog/photos';
import type { CatalogProduct, Variant } from '../catalog/types';
import { useCatalog } from '../catalog/useCatalog';
import { DELIVERY_FORM, GENERAL_ORDER, waLink } from './content';
import { ChatIcon } from './icons';

/**
 * The order sheet: every general "Order on WhatsApp" button opens it, the visitor picks products,
 * sizes and how many, and the send button opens WhatsApp with the whole order typed out.
 * Quantities are keyed by "productId|size" and kept for the visit, so closing the sheet loses nothing.
 */
type PickerState = { open: boolean; focus?: string; qty: Record<string, number> };

let state: PickerState = { open: false, qty: {} };
const listeners = new Set<() => void>();

function update(patch: Partial<PickerState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function usePicker(): PickerState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}

const MAX_QTY = 99;
const lineKey = (id: string, size: string) => `${id}|${size}`;

function setQty(key: string, n: number) {
  const qty = { ...state.qty };
  if (n > 0) qty[key] = Math.min(n, MAX_QTY);
  else delete qty[key];
  update({ qty });
}

/** Opens the sheet; `focus` scrolls to and marks one product. */
export const openOrderPicker = (focus?: string) => update({ open: true, focus });

/** Puts at least one of each item in the order, then opens the sheet on the first. */
export function addToOrder(items: { id: string; size: string }[]) {
  const qty = { ...state.qty };
  items.forEach(({ id, size }) => {
    const key = lineKey(id, size);
    qty[key] = Math.max(qty[key] ?? 0, 1);
  });
  update({ qty, open: true, focus: items[0]?.id });
}

/** A button that opens the order sheet, styled like the link it replaces. */
export function OrderButton({ product, className = 'btn', label, children }: { product?: string; className?: string; label?: string; children: ReactNode }) {
  return (
    <button type="button" className={className} aria-haspopup="dialog" aria-label={label} onClick={() => openOrderPicker(product)}>
      {children}
    </button>
  );
}

/** Products without sizes still get one row to pick a quantity on. */
const NO_SIZE: Variant = { label: '', price: null, inStock: true };
const sizesOf = (p: CatalogProduct) => (p.variants.length ? p.variants : [NO_SIZE]);

type Line = { product: CatalogProduct; variant: Variant; qty: number };

function orderMessage(lines: Line[]) {
  const items = lines.map(({ product, variant, qty }) => {
    const price = variant.price != null ? `: ${rupees(variant.price * qty)}` : '';
    return `• ${product.name}${variant.label ? `, ${variant.label}` : ''} × ${qty}${price}`;
  });
  const total = lines.reduce((sum, l) => sum + (l.variant.price ?? 0) * l.qty, 0);
  const unpriced = lines.some((l) => l.variant.price == null);
  const totalLine = total ? [`Total: ${rupees(total)}${unpriced ? ', plus the items without a price' : ''}`] : [];
  return [`Hi Nimmi's Products! I'd like to order:`, ...items, ...totalLine, DELIVERY_FORM].join('\n');
}

/** Mount once per page (SiteHeader does). */
export function OrderPicker() {
  const { open, focus, qty } = usePicker();
  const { products, loading } = useCatalog();
  const dialog = useRef<HTMLDialogElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const onProductsPage = useLocation().pathname === '/products';

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      const target = focus ? list.current?.querySelector(`#pick-${CSS.escape(focus)}`) : null;
      if (target) target.scrollIntoView({ block: 'start' });
      else list.current?.scrollTo(0, 0);
    } else if (!open && d.open) {
      d.close();
    }
  }, [open, focus]);

  const close = () => dialog.current?.close();

  const lines: Line[] = products.flatMap((product) =>
    sizesOf(product).flatMap((variant) => {
      const n = qty[lineKey(product.id, variant.label)];
      return n && variant.inStock ? [{ product, variant, qty: n }] : [];
    }),
  );
  const count = lines.reduce((sum, l) => sum + l.qty, 0);
  const total = lines.reduce((sum, l) => sum + (l.variant.price ?? 0) * l.qty, 0);

  return (
    <dialog
      ref={dialog}
      className="order-sheet"
      aria-labelledby="order-sheet-title"
      onClose={() => update({ open: false })}
      // A click on the dialog itself, not its contents, is a click on the dimmed backdrop.
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <header className="order-sheet__head">
        <h2 id="order-sheet-title">What would you like?</h2>
        <p>Pick sizes and how many. We’ll type the WhatsApp message for you.</p>
        <button type="button" className="order-sheet__close" aria-label="Close" onClick={close}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>

      <div className="order-sheet__list" ref={list}>
        {loading && !products.length ? (
          <p className="order-sheet__empty">Loading products…</p>
        ) : (
          products.map((p) => <PickProduct key={p.id} product={p} qty={qty} focused={open && p.id === focus} />)
        )}
        {!onProductsPage && (
          <p className="order-sheet__more">
            Want to see photos and details first?{' '}
            <Link to="/products" onClick={close}>
              See all products
            </Link>
          </p>
        )}
      </div>

      <footer className="order-sheet__foot">
        <p className="order-sheet__sum" aria-live="polite">
          {count ? (
            <>
              {count} {count === 1 ? 'item' : 'items'}
              {total > 0 && <b>{rupees(total)}</b>}
            </>
          ) : (
            'Nothing picked yet'
          )}
        </p>
        {count ? (
          <a className="btn" href={waLink(orderMessage(lines))} target="_blank" rel="noopener noreferrer" data-order="" onClick={close}>
            <ChatIcon />
            Send order on WhatsApp
          </a>
        ) : (
          <a className="btn btn-ghost" href={waLink(GENERAL_ORDER)} target="_blank" rel="noopener noreferrer">
            Not sure? Just message us
          </a>
        )}
      </footer>
    </dialog>
  );
}

function PickProduct({ product: p, qty, focused }: { product: CatalogProduct; qty: Record<string, number>; focused: boolean }) {
  const thumb = usePhotoSrc(p.image ?? p.variants.find((v) => v.image)?.image);
  return (
    <section id={`pick-${p.id}`} className={['order-pick', focused && 'is-focus'].filter(Boolean).join(' ')} aria-labelledby={`pick-${p.id}-name`}>
      <div className="order-pick__head">
        {thumb ? <img src={thumb} alt="" width={52} height={52} loading="lazy" /> : <span className="order-pick__thumb" />}
        <div>
          <h3 id={`pick-${p.id}-name`}>{p.name}</h3>
          {p.nameMl && <span className="ml">{p.nameMl}</span>}
        </div>
      </div>
      <ul className="order-pick__sizes">
        {sizesOf(p).map((v) => {
          const key = lineKey(p.id, v.label);
          const n = qty[key] ?? 0;
          const what = [p.name, v.label].filter(Boolean).join(', ');
          return (
            <li key={v.label} className={['order-row', !v.inStock && 'is-out'].filter(Boolean).join(' ')} data-picked={n && v.inStock ? '' : undefined}>
              <span className="order-row__size">{v.label || 'Quantity'}</span>
              <span className={['order-row__price', (v.price == null || !v.inStock) && 'is-muted'].filter(Boolean).join(' ')}>
                {!v.inStock ? 'Out of stock' : v.price != null ? rupees(v.price) : 'Price on WhatsApp'}
              </span>
              {v.inStock &&
                (n ? (
                  <span className="stepper">
                    <button type="button" aria-label={`One less ${what}`} onClick={() => setQty(key, n - 1)}>
                      −
                    </button>
                    <output aria-label={`${what}, quantity`}>{n}</output>
                    <button type="button" aria-label={`One more ${what}`} onClick={() => setQty(key, n + 1)} disabled={n >= MAX_QTY}>
                      +
                    </button>
                  </span>
                ) : (
                  <button type="button" className="order-add" onClick={() => setQty(key, 1)}>
                    Add<span className="sr-only"> {what}</span>
                  </button>
                ))}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
