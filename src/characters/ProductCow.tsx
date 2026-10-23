import { useRef } from 'react';
import { Character } from './Character';
import { PRODUCT_LABELS, type ProductKey } from './assets';
import { canHover, useInView } from './hooks';

const LINES: Partial<Record<ProductKey, string>> = {
  dates: 'Dates! My favourite.',
  almonds: 'Soak a few tonight!',
  pista: 'Crunchy pista!',
  raisins: 'For the payasam!',
  cashew: 'Fry these in ghee!',
  anise: 'For the biriyani!',
  ghee: 'The famous one!',
};

/**
 * The cow offering a product, tucked into the corner of a product card.
 *
 * Put it inside the card's image area (position: relative) and add the class
 * "has-product-cow" to the card: she pops up when the card is hovered or focused.
 * On touch screens she peeks up once the card scrolls into view.
 */
export function ProductCow({ product, className }: { product: ProductKey; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { threshold: 0.6 });
  return (
    <div
      ref={ref}
      className={['product-cow', className].filter(Boolean).join(' ')}
      data-touch-peek={!canHover() && seen ? '' : undefined}
      aria-hidden="true"
    >
      <Character name={`cow-offer-${product}`} />
      <span className="bubble product-cow__bubble">{LINES[product] ?? PRODUCT_LABELS[product]}</span>
    </div>
  );
}
