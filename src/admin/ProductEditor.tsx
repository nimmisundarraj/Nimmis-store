import { useState, type FormEvent } from 'react';
import { deletePhoto, productExists, saveProduct } from '../catalog/api';
import { isUploadedPhoto, photoId } from '../catalog/photos';
import type { CatalogProduct, ProductInput, Variant } from '../catalog/types';
import type { Illustration } from '../site/content';
import { PhotoPicker } from './PhotoPicker';

/** Files already in public/site, offered as suggestions; any other file name or https link works too. */
const SITE_IMAGES = ['dates.webp', 'ghee-50.webp', 'ghee-100.webp', 'ghee-200.webp', 'ghee-500.webp', 'ghee-1000.webp', 'ghee-2000.webp'];
const DRAWINGS: Illustration[] = ['almond', 'pista', 'raisins', 'cashew', 'anise'];

/** Prices are edited as text so a field can be empty ("Price on WhatsApp"). */
type VariantDraft = { label: string; price: string; mrp: string; inStock: boolean; image: string };

const toDraft = (v: Variant): VariantDraft => ({
  label: v.label,
  price: v.price == null ? '' : String(v.price),
  mrp: v.mrp == null ? '' : String(v.mrp),
  inStock: v.inStock,
  image: v.image ?? '',
});

const blankVariant = (): VariantDraft => ({ label: '', price: '', mrp: '', inStock: true, image: '' });

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const money = (s: string) => (s.trim() === '' ? null : Number(s));

type Props = {
  product: CatalogProduct | null;
  takenIds: Set<string>;
  categories: string[];
  onCancel: () => void;
  onSaved: (name: string) => void;
};

export function ProductEditor({ product, takenIds, categories, onCancel, onSaved }: Props) {
  const isNew = !product;
  const [id, setId] = useState(product?.id ?? '');
  const [idTouched, setIdTouched] = useState(false);
  const [name, setName] = useState(product?.name ?? '');
  const [nameMl, setNameMl] = useState(product?.nameMl ?? '');
  const [category, setCategory] = useState(product?.category ?? '');
  const [tag, setTag] = useState(product?.tag ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [image, setImage] = useState(product?.image ?? '');
  const [video, setVideo] = useState(product?.video ?? '');
  const [art, setArt] = useState<Illustration | ''>(product?.art ?? '');
  const [variants, setVariants] = useState<VariantDraft[]>(product?.variants.map(toDraft) ?? [blankVariant()]);
  const [defaultVariant, setDefaultVariant] = useState(product?.defaultVariant ?? '');
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [active, setActive] = useState(product?.active ?? true);
  const [sortOrder, setSortOrder] = useState(String(product?.sortOrder ?? 100));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  // Photos uploaded while this form is open; the ones not kept are deleted on save or cancel.
  const [uploaded, setUploaded] = useState<string[]>([]);
  const trackUpload = (ref: string) => setUploaded((list) => [...list, ref]);
  const originalPhotos = [product?.image, ...(product?.variants.map((v) => v.image) ?? [])];

  /** Deletes uploaded photos that are not in `keep`. Best effort: a leftover photo only costs a little storage. */
  const removeUnused = (keep: (string | undefined)[]) => {
    const kept = new Set(keep);
    const candidates = new Set([...uploaded, ...originalPhotos].filter((r): r is string => isUploadedPhoto(r) && !kept.has(r)));
    candidates.forEach((r) => deletePhoto(photoId(r)).catch(() => undefined));
  };

  const cancel = () => {
    removeUnused(originalPhotos);
    onCancel();
  };

  const editVariant = (i: number, patch: Partial<VariantDraft>) => setVariants((vs) => vs.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  const moveVariant = (i: number, by: number) =>
    setVariants((vs) => {
      const next = [...vs];
      const [v] = next.splice(i, 1);
      next.splice(i + by, 0, v);
      return next;
    });

  const validate = (): string | null => {
    if (!name.trim()) return 'Give the product a name.';
    if (!category.trim()) return 'Choose or type a category.';
    if (isNew && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) return 'The product ID can use only lowercase letters, numbers and single hyphens.';
    if (isNew && takenIds.has(id)) return `A product with the ID "${id}" already exists.`;
    const filled = variants.filter((v) => v.label.trim());
    if (new Set(filled.map((v) => v.label.trim())).size !== filled.length) return 'Two sizes have the same name.';
    for (const v of filled) {
      for (const [field, value] of [['Price', v.price], ['MRP', v.mrp]] as const) {
        const n = money(value);
        if (n !== null && (!Number.isFinite(n) || n < 0)) return `${field} for ${v.label} must be a number.`;
      }
    }
    if (variants.some((v) => !v.label.trim() && (v.price || v.mrp))) return 'A size has a price but no name.';
    if (!Number.isFinite(Number(sortOrder))) return 'Sort order must be a number.';
    return null;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);
    const cleanVariants: Variant[] = variants
      .filter((v) => v.label.trim())
      .map((v) => ({
        label: v.label.trim(),
        price: money(v.price),
        mrp: money(v.mrp),
        inStock: v.inStock,
        ...(v.image.trim() ? { image: v.image.trim() } : {}),
      }));
    const input: ProductInput = {
      name: name.trim(),
      nameMl: nameMl.trim(),
      category: category.trim(),
      tag: tag.trim() || undefined,
      description: description.trim(),
      variants: cleanVariants,
      defaultVariant: cleanVariants.some((v) => v.label === defaultVariant) ? defaultVariant : undefined,
      image: image.trim() || undefined,
      video: video.trim() || undefined,
      art: art || undefined,
      featured,
      active,
      sortOrder: Number(sortOrder),
    };
    setSaving(true);
    setError('');
    try {
      // Another admin may have added the same ID since this list loaded.
      if (isNew && (await productExists(id))) throw new Error(`A product with the ID "${id}" already exists.`);
      await saveProduct(id, input);
      removeUnused([input.image, ...cleanVariants.map((v) => v.image)]);
      onSaved(input.name);
    } catch (err) {
      setError(err instanceof Error && err.message.startsWith('A product') ? err.message : 'Could not save. Check your connection and try again.');
      setSaving(false);
    }
  };

  return (
    <form className="admin-stack admin-form" onSubmit={submit}>
      <div className="admin-toolbar">
        <h1>{isNew ? 'New product' : `Edit ${product.name}`}</h1>
      </div>

      <datalist id="site-images">
        {SITE_IMAGES.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>

      <section className="admin-card admin-grid">
        <h2>Details</h2>
        <label>
          Name
          <input
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (isNew && !idTouched) setId(slugify(e.target.value));
            }}
          />
        </label>
        <label>
          Malayalam name
          <input value={nameMl} onChange={(e) => setNameMl(e.target.value)} lang="ml" />
        </label>
        <label>
          Category
          <input required list="categories" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ghee, Dry fruits, Spice…" />
          <datalist id="categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label>
          Badge on the card <span className="admin-muted">(optional, defaults to the category)</span>
          <input value={tag} onChange={(e) => setTag(e.target.value)} />
        </label>
        <label className="admin-span">
          Description
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label>
          Product ID {isNew ? <span className="admin-muted">(used in links, cannot change later)</span> : null}
          <input
            value={id}
            disabled={!isNew}
            onChange={(e) => {
              setIdTouched(true);
              setId(e.target.value);
            }}
          />
        </label>
        <label>
          Sort order <span className="admin-muted">(smaller shows first)</span>
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </label>
      </section>

      <section className="admin-card">
        <h2>Sizes and prices</h2>
        <p className="admin-muted">Leave a price empty to show “Price on WhatsApp”. MRP is optional and shows struck through when it is higher.</p>
        <div className="variant-table" role="table" aria-label="Sizes">
          <div className="variant-row variant-head" role="row">
            <span role="columnheader">Size</span>
            <span role="columnheader">Price ₹</span>
            <span role="columnheader">MRP ₹</span>
            <span role="columnheader">In stock</span>
            <span role="columnheader">Photo for this size</span>
            <span role="columnheader">
              <span className="sr-only">Actions</span>
            </span>
          </div>
          {variants.map((v, i) => (
            <div className="variant-row" role="row" key={i}>
              <input aria-label="Size" placeholder="250 g" value={v.label} onChange={(e) => editVariant(i, { label: e.target.value })} />
              <input aria-label="Price" inputMode="decimal" value={v.price} onChange={(e) => editVariant(i, { price: e.target.value })} />
              <input aria-label="MRP" inputMode="decimal" value={v.mrp} onChange={(e) => editVariant(i, { mrp: e.target.value })} />
              <label className="variant-stock">
                <input type="checkbox" checked={v.inStock} onChange={(e) => editVariant(i, { inStock: e.target.checked })} />
                <span className="sr-only">In stock</span>
              </label>
              <PhotoPicker compact label={`Photo for ${v.label || 'this size'}`} value={v.image} onChange={(image) => editVariant(i, { image })} onUploaded={trackUpload} />
              <span className="variant-actions">
                <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => moveVariant(i, -1)}>
                  ↑
                </button>
                <button type="button" aria-label="Move down" disabled={i === variants.length - 1} onClick={() => moveVariant(i, 1)}>
                  ↓
                </button>
                <button type="button" aria-label="Remove size" onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))}>
                  ✕
                </button>
              </span>
            </div>
          ))}
        </div>
        <div className="admin-inline">
          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setVariants((vs) => [...vs, blankVariant()])}>
            Add a size
          </button>
          {variants.some((v) => v.label.trim()) && (
            <label>
              Selected at first
              <select value={defaultVariant} onChange={(e) => setDefaultVariant(e.target.value)}>
                <option value="">First size in stock</option>
                {variants
                  .filter((v) => v.label.trim())
                  .map((v) => (
                    <option key={v.label} value={v.label.trim()}>
                      {v.label}
                    </option>
                  ))}
              </select>
            </label>
          )}
        </div>
      </section>

      <section className="admin-card admin-grid">
        <h2>Photo</h2>
        <div className="admin-span">
          <PhotoPicker label="Product photo" value={image} onChange={setImage} onUploaded={trackUpload} />
        </div>
        <label>
          Drawing until a photo arrives
          <select value={art} onChange={(e) => setArt(e.target.value as Illustration | '')}>
            <option value="">None</option>
            {DRAWINGS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label>
          Hover video <span className="admin-muted">(optional)</span>
          <input value={video} onChange={(e) => setVideo(e.target.value)} />
        </label>
      </section>

      <section className="admin-card admin-checks">
        <h2>Visibility</h2>
        <label className="switch">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <span aria-hidden="true" />
          <span className="switch__label">Shown on the site</span>
        </label>
        <label className="switch">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          <span aria-hidden="true" />
          <span className="switch__label">Also show on the home page</span>
        </label>
      </section>

      {error && <p className="admin-error" role="alert">{error}</p>}
      <div className="admin-actions">
        <button type="button" className="admin-btn admin-btn--ghost" onClick={cancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="admin-btn" disabled={saving}>
          {saving ? 'Saving…' : 'Save product'}
        </button>
      </div>
    </form>
  );
}
