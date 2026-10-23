import { Link } from 'react-router-dom';
import { usePhotoSrc } from '../catalog/photos';
import type { CatalogProduct } from '../catalog/types';

const photoOf = (p: CatalogProduct) => p.image ?? p.variants.find((v) => v.image)?.image;

/** "Pista, Kismis and Pepper" or "Pista, Kismis, Pepper and 3 more". */
function nameList(names: string[]) {
  if (names.length <= 3) return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0] ?? '';
  return `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`;
}

/**
 * The last tile of the home page's product grid: a peek at what the products page holds that
 * the home page doesn't, so "see everything" has a reason. `hidden` is what the grid left out.
 */
export function MoreProductsCard({ hidden, all }: { hidden: CatalogProduct[]; all: CatalogProduct[] }) {
  // Only what the grid left out; with nothing left out, a peek at the whole shop instead.
  const photos = (hidden.length ? hidden : all).filter(photoOf).slice(0, 4);
  return (
    <Link className="card more-card reveal" to="/products" state={{ from: 'more-tile' }}>
      <div className="more-card__art" data-tiles={photos.length} aria-hidden="true">
        {photos.map((p) => (
          <Tile key={p.id} product={p} />
        ))}
        {hidden.length > 0 && <span className="more-card__count">+{hidden.length}</span>}
      </div>
      <div className="more-card__body">
        <h3>{hidden.length ? `${hidden.length} more in the shop` : 'The whole shop'}</h3>
        <p>{hidden.length ? nameList(hidden.map((p) => p.name)) : 'Every product, size and price in one place.'}</p>
        <span className="btn btn-sm more-card__cta">See all products</span>
      </div>
    </Link>
  );
}

function Tile({ product }: { product: CatalogProduct }) {
  const src = usePhotoSrc(photoOf(product));
  return <span className="more-card__tile">{src && <img src={src} alt="" loading="lazy" />}</span>;
}
