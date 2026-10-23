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

/** Whole percent off the MRP, or null when there is no MRP above the price. */
export function percentOff(price: number, mrp?: number | null): number | null {
  if (mrp == null || mrp <= price) return null;
  const off = Math.round(((mrp - price) / mrp) * 100);
  return off > 0 ? off : null;
}

/** The cheapest priced size (its price, MRP and label), with `from` set when sizes differ in price. */
export function lowestPrice(p: CatalogProduct): { price: number; mrp: number | null; label: string; from: boolean } | null {
  const priced = p.variants.filter((v): v is Variant & { price: number } => typeof v.price === 'number');
  if (!priced.length) return null;
  const pool = priced.some((v) => v.inStock) ? priced.filter((v) => v.inStock) : priced;
  const low = pool.reduce((a, b) => (b.price < a.price ? b : a));
  return { price: low.price, mrp: low.mrp ?? null, label: low.label, from: priced.some((v) => v.price !== low.price) };
}

export const inStock =(p: CatalogProduct) => !p.variants.length || p.variants.some((v) => v.inStock);
