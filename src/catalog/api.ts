import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore/lite';
import { firebaseApp } from '../lib/firebase';
import { PHOTO_PREFIX } from './photos';
import { SEED_PRODUCTS } from './seed';
import type { CatalogProduct, ProductInput } from './types';

/** Firestore Lite: plain request and response, no live listeners, a much smaller bundle than the full SDK. */
const db = () => getFirestore(firebaseApp());
const products = () => collection(db(), 'products');

const bySortOrder = (a: CatalogProduct, b: CatalogProduct) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

function toProduct(id: string, data: Partial<CatalogProduct>): CatalogProduct {
  return {
    id,
    name: data.name ?? id,
    nameMl: data.nameMl ?? '',
    category: data.category ?? 'Other',
    tag: data.tag || undefined,
    description: data.description ?? '',
    variants: data.variants ?? [],
    defaultVariant: data.defaultVariant || undefined,
    image: data.image || undefined,
    video: data.video || undefined,
    art: data.art || undefined,
    featured: data.featured ?? false,
    active: data.active ?? false,
    sortOrder: data.sortOrder ?? 999,
    updatedAt: data.updatedAt,
  };
}

/** What visitors see. The `active` filter is required: the security rules refuse any query without it. */
export async function fetchActiveProducts(): Promise<CatalogProduct[]> {
  const snap = await getDocs(query(products(), where('active', '==', true)));
  return snap.docs.map((d) => toProduct(d.id, d.data())).sort(bySortOrder);
}

/** Every product, disabled ones included. Admins only. */
export async function fetchAllProducts(): Promise<CatalogProduct[]> {
  const snap = await getDocs(products());
  return snap.docs.map((d) => toProduct(d.id, d.data())).sort(bySortOrder);
}

/** Firestore rejects `undefined` fields, so optional fields that are empty are left out. */
function clean(input: ProductInput) {
  return Object.fromEntries(Object.entries({ ...input, updatedAt: Date.now() }).filter(([, v]) => v !== undefined && v !== ''));
}

export async function saveProduct(id: string, input: ProductInput) {
  await setDoc(doc(products(), id), clean(input));
}

export async function setProductActive(id: string, active: boolean) {
  await updateDoc(doc(products(), id), { active, updatedAt: Date.now() });
}

export async function productExists(id: string) {
  return (await getDoc(doc(products(), id))).exists();
}

/** Copies the starter products that are not in Firestore yet. Existing products are left as they are. */
export async function importStarterProducts(existingIds: Set<string>) {
  const missing = SEED_PRODUCTS.filter((p) => !existingIds.has(p.id));
  if (!missing.length) return 0;
  const batch = writeBatch(db());
  missing.forEach(({ id, ...rest }) => batch.set(doc(products(), id), clean(rest)));
  await batch.commit();
  return missing.length;
}

/** An uploaded photo as a data URL. See photos.ts. */
export async function fetchPhoto(id: string): Promise<string> {
  const snap = await getDoc(doc(db(), 'photos', id));
  const data = snap.data()?.data;
  if (typeof data !== 'string') throw new Error(`Photo ${id} is missing.`);
  return data;
}

/** Saves a compressed photo and returns the reference to store on the product ("photo:<id>"). */
export async function uploadPhoto(dataUrl: string) {
  const ref = await addDoc(collection(db(), 'photos'), { data: dataUrl, createdAt: Date.now() });
  return `${PHOTO_PREFIX}${ref.id}`;
}

export async function deletePhoto(id: string) {
  await deleteDoc(doc(db(), 'photos', id));
}

/** Signed in users listed in admins/{uid} can edit. That document is created by hand in the Firebase console. */
export async function isAdmin(uid: string) {
  try {
    return (await getDoc(doc(db(), 'admins', uid))).exists();
  } catch {
    return false;
  }
}
