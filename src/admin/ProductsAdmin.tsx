import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAllProducts, importStarterProducts, setProductActive } from '../catalog/api';
import { priceSummary } from '../catalog/format';
import { usePhotoSrc } from '../catalog/photos';
import { SEED_PRODUCTS } from '../catalog/seed';
import type { CatalogProduct } from '../catalog/types';
import { ProductEditor } from './ProductEditor';

/** The product list: search, switch products on and off, and open one to edit. */
export function ProductsAdmin() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<CatalogProduct | 'new' | null>(null);

  const reload = useCallback(async () => {
    try {
      setProducts(await fetchAllProducts());
      setError('');
    } catch {
      setError('Could not load products. Check your connection and that this account is an admin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const ids = useMemo(() => new Set(products.map((p) => p.id)), [products]);
  const missingStarters = SEED_PRODUCTS.filter((p) => !ids.has(p.id)).length;
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))).sort(), [products]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? products.filter((p) => [p.name, p.nameMl, p.category, p.id].some((t) => t.toLowerCase().includes(q))) : products;
  }, [products, search]);

  const toggle = async (p: CatalogProduct) => {
    const active = !p.active;
    setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, active } : x)));
    try {
      await setProductActive(p.id, active);
      setNotice(`${p.name} is now ${active ? 'shown on' : 'hidden from'} the site.`);
    } catch {
      setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, active: p.active } : x)));
      setError(`Could not update ${p.name}. Try again.`);
    }
  };

  const importStarters = async () => {
    try {
      const n = await importStarterProducts(ids);
      setNotice(`Added ${n} starter product${n === 1 ? '' : 's'}.`);
      await reload();
    } catch {
      setError('Could not add the starter products.');
    }
  };

  if (editing) {
    return (
      <ProductEditor
        product={editing === 'new' ? null : editing}
        takenIds={ids}
        categories={categories}
        onCancel={() => setEditing(null)}
        onSaved={async (name) => {
          setEditing(null);
          setNotice(`Saved ${name}.`);
          await reload();
        }}
      />
    );
  }

  return (
    <div className="admin-stack">
      <div className="admin-toolbar">
        <h1>Products</h1>
        <input className="admin-search" type="search" placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search products" />
        {missingStarters > 0 && !loading && (
          <button type="button" className="admin-btn admin-btn--ghost" onClick={importStarters}>
            Add starter products ({missingStarters})
          </button>
        )}
        <button type="button" className="admin-btn" onClick={() => setEditing('new')}>
          New product
        </button>
      </div>

      {error && <p className="admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-notice" role="status">{notice}</p>}

      {loading ? (
        <p className="admin-muted">Loading products…</p>
      ) : !products.length ? (
        <div className="admin-card">
          <p>There are no products in Firestore yet. Add the starter products to begin, then fill in their prices.</p>
        </div>
      ) : (
        <ul className="admin-list">
          {shown.map((p) => (
            <li key={p.id} className={['admin-row', !p.active && 'is-off'].filter(Boolean).join(' ')}>
              <Thumb product={p} />
              <div className="admin-row__main">
                <strong>{p.name}</strong>
                <span className="admin-muted">
                  {p.category}
                  {p.featured && ' · on home page'}
                  {p.variants.length > 0 && ` · ${p.variants.length} size${p.variants.length === 1 ? '' : 's'}`}
                </span>
              </div>
              <span className="admin-row__price">{priceSummary(p) ?? <span className="admin-muted">No price</span>}</span>
              <label className="switch">
                <input type="checkbox" checked={p.active} onChange={() => toggle(p)} />
                <span aria-hidden="true" />
                <span className="switch__label">{p.active ? 'Shown' : 'Hidden'}</span>
              </label>
              <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setEditing(p)}>
                Edit<span className="sr-only"> {p.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Thumb({ product: p }: { product: CatalogProduct }) {
  const src = usePhotoSrc(p.image ?? p.variants.find((v) => v.image)?.image);
  return <span className="admin-thumb">{src ? <img src={src} alt="" loading="lazy" /> : p.name.charAt(0)}</span>;
}
