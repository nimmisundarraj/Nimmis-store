import { useEffect, useState } from 'react';
import { imageUrl } from './format';

/**
 * Photos uploaded in the admin panel are stored compressed in Firestore, one per document in photos/{id},
 * and referenced from a product as "photo:<id>". Keeping them out of the product documents keeps the
 * product list small; each photo is fetched only when its card renders.
 * A photo never changes after upload (a new upload gets a new id), so it is cached for good.
 */
export const PHOTO_PREFIX = 'photo:';
export const isUploadedPhoto = (src?: string) => Boolean(src?.startsWith(PHOTO_PREFIX));
export const photoId = (src: string) => src.slice(PHOTO_PREFIX.length);

const CACHE = 'nimmi-photos-v1';
const memory = new Map<string, Promise<string>>();

function loadPhoto(id: string): Promise<string> {
  let p = memory.get(id);
  if (!p) {
    p = fromCache(id).then(async (hit) => {
      if (hit) return hit;
      const { fetchPhoto } = await import('./api');
      const data = await fetchPhoto(id);
      toCache(id, data);
      return data;
    });
    p.catch(() => memory.delete(id));
    memory.set(id, p);
  }
  return p;
}

/** The URL to put in <img src>: a file in public/site, a link, or an uploaded photo once it has loaded. */
export function usePhotoSrc(src?: string): string | undefined {
  const uploaded = isUploadedPhoto(src);
  const [data, setData] = useState<{ src: string; url: string } | null>(null);

  useEffect(() => {
    if (!src || !uploaded) return;
    let live = true;
    loadPhoto(photoId(src))
      .then((url) => live && setData({ src, url }))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [src, uploaded]);

  if (!src) return undefined;
  if (!uploaded) return imageUrl(src);
  return data?.src === src ? data.url : undefined;
}

/** The Cache API needs a secure context (https or localhost); without it photos are just refetched. */
const cacheKey = (id: string) => `/__photos/${id}`;

async function fromCache(id: string): Promise<string | null> {
  try {
    const res = await (await caches.open(CACHE)).match(cacheKey(id));
    return res ? await res.text() : null;
  } catch {
    return null;
  }
}

async function toCache(id: string, data: string) {
  try {
    await (await caches.open(CACHE)).put(cacheKey(id), new Response(data));
  } catch {
    // ignore
  }
}

/** Firestore documents max out at 1 MiB; this keeps a photo well under it. */
const MAX_CHARS = 700_000;

/**
 * Shrinks a photo picked from the computer to at most `maxSide` pixels on its longest side and
 * encodes it as WebP (JPEG where the browser can't write WebP), stepping the quality down until it fits.
 */
export async function compressImage(file: File, maxSide = 1000): Promise<string> {
  const bitmap = await loadBitmap(file);
  for (const side of [maxSide, 800, 600]) {
    const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('This browser cannot resize photos.');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const webp = canvas.toDataURL('image/webp', 0.8).startsWith('data:image/webp');
    for (const q of [0.82, 0.72, 0.6]) {
      if (!webp) {
        // JPEG has no transparency; paint cut out photos onto the card colour instead of black.
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#163021';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      const out = canvas.toDataURL(webp ? 'image/webp' : 'image/jpeg', q);
      if (out.length <= MAX_CHARS) return out;
    }
  }
  throw new Error('This photo is too large even after shrinking. Try a smaller one.');
}

function loadBitmap(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file is not a photo this browser can open.'));
    };
    img.src = url;
  });
}
