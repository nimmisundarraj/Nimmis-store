import { useEffect, useMemo, useState, type ImgHTMLAttributes } from 'react';
import { characterSources, type CharacterName } from './assets';

/** URLs that already failed once this session, so other instances skip them. */
const failed = new Set<string>();

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  name: CharacterName;
  /** Empty string for decorative art (the default), a description otherwise. */
  alt?: string;
};

/**
 * Shows a character pose: the finished WebP if it exists, otherwise the illustrated placeholder.
 */
export function Character({ name, alt = '', className, ...rest }: Props) {
  const sources = useMemo(() => characterSources(name), [name]);
  const firstUsable = () => Math.max(0, sources.findIndex((s) => !failed.has(s)));
  const [index, setIndex] = useState(firstUsable);

  // Reset when the pose changes (e.g. cow-peek -> cow-peek-excited).
  useEffect(() => setIndex(firstUsable()), [sources]); // eslint-disable-line react-hooks/exhaustive-deps

  const src = sources[index];
  return (
    <img
      {...rest}
      src={src}
      alt={alt}
      className={['character', className].filter(Boolean).join(' ')}
      draggable={false}
      decoding="async"
      data-placeholder={src.endsWith('.svg') ? '' : undefined}
      onError={() => {
        failed.add(src);
        if (index < sources.length - 1) setIndex(index + 1);
      }}
    />
  );
}

/** Warm the browser cache for poses that will be swapped in on interaction. */
export function preloadCharacters(names: CharacterName[]) {
  const tryLoad = (list: string[]) => {
    const [first, ...rest] = list;
    if (!first) return;
    const img = new Image();
    img.onerror = () => {
      failed.add(first);
      tryLoad(rest);
    };
    img.src = first;
  };
  for (const n of names) tryLoad(characterSources(n).filter((s) => !failed.has(s)));
}
