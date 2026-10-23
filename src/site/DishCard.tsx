import { Link } from 'react-router-dom';
import { findVariant, startVariant } from '../catalog/format';
import type { CatalogProduct } from '../catalog/types';
import { asset, type Use } from './content';
import { ChatIcon } from './icons';
import { addToOrder } from './OrderPicker';

/** A dish from the "where it goes" section, with what it needs from the shop and one tap to order them. */
export function DishCard({ use, products }: { use: Use; products: CatalogProduct[] }) {
  const items = use.needs.flatMap(({ id, size }) => {
    const product = products.find((p) => p.id === id);
    if (!product) return [];
    const variant = (size ? findVariant(product, size) : undefined) ?? startVariant(product);
    if (variant && !variant.inStock) return [];
    // The size goes on the pill only when the dish asks for a particular one.
    return [{ product, size: variant?.label ?? '', showSize: Boolean(size && variant?.label === size) }];
  });

  return (
    <article className="use reveal">
      <div className="use__img">
        <img src={asset(use.img)} alt={use.title} width={960} height={720} loading="lazy" />
      </div>
      <div className="use__body">
        <span className="ml">{use.ml}</span>
        <h3>{use.title}</h3>
        <p>{use.text}</p>
        {items.length > 0 && (
          <div className="use__shop">
            <span className="use__label">You’ll need</span>
            <ul className="use__needs">
              {items.map(({ product, size, showSize }) => (
                <li key={product.id}>
                  <Link className="use__pill" to={`/products?item=${encodeURIComponent(product.id)}`} state={{ from: 'dish-pill' }}>
                    {product.name}
                    {showSize && <span className="use__size">{size}</span>}
                  </Link>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-sm use__add" aria-haspopup="dialog" onClick={() => addToOrder(items.map(({ product, size }) => ({ id: product.id, size })))}>
              <ChatIcon />
              Add to order<span className="sr-only">: everything for {use.title}</span>
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
