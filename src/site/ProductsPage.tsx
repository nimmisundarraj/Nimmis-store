import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OrderReactions } from '../characters';
import { useCatalog } from '../catalog/useCatalog';
import { GENERAL_ORDER, waLink } from './content';
import { ChatIcon, SvgDefs } from './icons';
import { ProductCard } from './ProductCard';
import { SiteFooter, SiteHeader, type NavLink } from './SiteChrome';
import './site.css';

const NAV: NavLink[] = [
  { href: '/products', label: 'Products' },
  { href: '/#founders', label: 'Our story' },
];

const ALL = 'All';

/** Every product that is switched on in the admin panel. /products?item=almonds scrolls to and rings that one. */
export function ProductsPage() {
  const { products, loading } = useCatalog();
  const [params] = useSearchParams();
  const item = params.get('item');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(ALL);

  // Arriving from a scrolled home page: start at the top unless a card will scroll itself into view.
  useEffect(() => {
    if (item) return;
    const html = document.documentElement;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    html.style.scrollBehavior = '';
  }, [item]);

  const categories = useMemo(() => [ALL, ...Array.from(new Set(products.map((p) => p.category)))], [products]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === ALL || p.category === category) &&
        (!q || [p.name, p.nameMl, p.category, p.description].some((t) => t.toLowerCase().includes(q))),
    );
  }, [products, search, category]);

  return (
    <div className="nimmi-site shop-page">
      <SvgDefs />
      <OrderReactions />
      <SiteHeader nav={NAV} brandHref="/" />

      <main>
        <section className="section range shop" aria-labelledby="shop-title">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">The Nimmi’s shop</span>
              <h2 id="shop-title">Everything we make and pack.</h2>
              <p>Pick a size, then tap Order. WhatsApp opens with your choice filled in.</p>
            </div>

            <div className="shop-tools">
              <label className="shop-search">
                <span className="sr-only">Search products</span>
                <input type="search" placeholder="Search ghee, almonds, spices…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </label>
              {categories.length > 2 && (
                <div className="chips" role="group" aria-label="Category">
                  {categories.map((c) => (
                    <button key={c} type="button" className="chip" aria-pressed={c === category} onClick={() => setCategory(c)}>
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid-products" aria-busy="true" aria-label="Loading products">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="card card-skeleton" />
                ))}
              </div>
            ) : shown.length ? (
              <div className="grid-products">
                {shown.map((p) => (
                  <ProductCard key={p.id} product={p} highlight={p.id === item} />
                ))}
              </div>
            ) : !products.length ? (
              <div className="shop-empty">
                <p>Our product list is being updated. Message us on WhatsApp and we’ll tell you what’s in the shop today.</p>
              </div>
            ) : (
              <div className="shop-empty">
                <p>Nothing matches “{search}”.</p>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    setSearch('');
                    setCategory(ALL);
                  }}
                >
                  Show all products
                </button>
              </div>
            )}

            <div className="sizes-close">
              <h3>Looking for something else?</h3>
              <p>Message us. If we have it at the shop, we’ll pack it with your order.</p>
              <a className="btn" href={waLink(GENERAL_ORDER)} target="_blank" rel="noopener noreferrer" data-order="">
                <ChatIcon />
                Ask on WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
