import { useEffect, useState } from 'react';
import { firebaseEnabled } from '../lib/firebaseConfig';
import { SEED_PRODUCTS } from './seed';
import type { CatalogProduct } from './types';

const CACHE_KEY = 'nimmi-catalog-v1';

type CatalogState = { products: CatalogProduct[]; loading: boolean };

/** Every page that calls useCatalog shares one request per page load. */
let pending: Promise<CatalogProduct[]> | null = null;

function load() {
  pending ??= import('./api')
    .then((api) => api.fetchActiveProducts())
    .then((list) => {
      writeCache(list);
      return list;
    })
    .catch((err) => {
      pending = null;
      throw err;
    });
  return pending;
}

/**
 * The products visitors can see. The last list fetched is kept in localStorage, so a returning
 * visitor sees the catalog at once while a fresh copy loads. Without Firebase configured, or when
 * Firestore cannot be reached on a first visit, the bundled starter catalog is shown instead.
 */
export function useCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>(() => {
    if (!firebaseEnabled) return { products: SEED_PRODUCTS.filter((p) => p.active), loading: false };
    const cached = readCache();
    return cached ? { products: cached, loading: false } : { products: [], loading: true };
  });

  useEffect(() => {
    if (!firebaseEnabled) return;
    let live = true;
    load()
      .then((products) => live && setState({ products, loading: false }))
      .catch(() => live && setState((s) => (s.products.length ? { ...s, loading: false } : { products: SEED_PRODUCTS.filter((p) => p.active), loading: false })));
    return () => {
      live = false;
    };
  }, []);

  return state;
}

function readCache(): CatalogProduct[] | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CatalogProduct[]) : null;
  } catch {
    return null;
  }
}

function writeCache(list: CatalogProduct[]) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  } catch {
    // storage full or blocked; the next visit just waits for the network
  }
}
