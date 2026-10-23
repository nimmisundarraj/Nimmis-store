import type { Illustration } from '../site/content';

/** One size of a product, with its own price. `price: null` shows "Price on WhatsApp". */
export type Variant = {
  label: string;
  price: number | null;
  /** The printed price, shown struck through when it is above `price`. */
  mrp?: number | null;
  inStock: boolean;
  /** A photo just for this size (the ghee jars); otherwise the product's image is used. */
  image?: string;
};

/** A product as stored in Firestore under products/{id}. The id is a short slug such as "almonds". */
export type CatalogProduct = {
  id: string;
  name: string;
  nameMl: string;
  category: string;
  /** Badge on the card; falls back to the category. */
  tag?: string;
  description: string;
  variants: Variant[];
  defaultVariant?: string;
  /** A file in public/site (e.g. "dates.webp") or a full https link. */
  image?: string;
  video?: string;
  /** Drawn stand in shown while a product has no photo. */
  art?: Illustration;
  /** Shown in the home page's product section. */
  featured: boolean;
  /** Disabled products are hidden from the site (and unreadable by visitors, see firestore.rules). */
  active: boolean;
  sortOrder: number;
  updatedAt?: number;
};

export type ProductInput = Omit<CatalogProduct, 'id' | 'updatedAt'>;
