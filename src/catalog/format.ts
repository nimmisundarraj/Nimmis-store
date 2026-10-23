import { asset } from '../site/content';
import type { CatalogProduct, Variant } from './types';

export const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** A bare file name lives in public/site; anything with a scheme is used as is. */
export const imageUrl = (src: string) => (/^https?:\/\//.test(src) ? src : asset(src));

export const findVariant = (p: CatalogProduct, label?: string): Variant | undefined =>
  p.variants.find((v) => v.label === label);

/** The variant a card starts on: the chosen default if it is in stock, else the first one in stock. */
export function startVariant(p: CatalogProduct) {
  const chosen = findVariant(p, p.defaultVariant);
  return (chosen?.inStock ? chosen : undefined) ?? p.variants.find((v) => v.inStock) ?? p.variants[0];
}

/** "₹320", "From ₹180" when sizes differ in price, or null when no price is set. */
export function priceSummary(p: CatalogProduct): string | null {
  const prices = p.variants.map((v) => v.price).filter((n): n is number => typeof n === 'number');
  if (!prices.length) return null;
  const min = Math.min(...prices);
  return prices.some((n) => n !== min) ? `From ${rupees(min)}` : rupees(min);
}

export const inStock = (p: CatalogProduct) => !p.variants.length || p.variants.some((v) => v.inStock);
