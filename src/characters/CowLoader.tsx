import { useEffect, useState, type CSSProperties } from 'react';
import { Character } from './Character';
import { useReducedMotion } from './hooks';

type Emblem = {
  /** The emblem's outer ornament band alone; it spins once as the cow turns into the emblem. */
  ring: string;
  /** Everything inside the band, with an empty ghee drop for the cow's head. */
  centre: string;
  /** Alpha mask in the drop's shape (all layers share one canvas); keeps the head inside the drop. */
  mask: string;
  /** The emblem's own flat cow on the same canvas. When given, the head turns into it after a shake. */
  morphTo?: string;
};

type Props = {
  /** Set to true when the page (or the 3D jar) is ready; the loader then fades out. */
  done: boolean;
  /** Keep the loader up at least this long so it doesn't flash, in ms. */
  minDuration?: number;
  label?: string;
  /** Show the cow's head shaking inside the brand emblem instead of the cow walking. */
  emblem?: Emblem;
};

/** When the shaking head turns into the emblem's cow, in ms: as the first shake settles. */
const MORPH_AT = 900;

/** Full-screen loading screen: the cow walking across, or her head shaking inside the brand emblem. */
export function CowLoader({ done, minDuration = 900, label = 'Warming the ghee…', emblem }: Props) {
  const [minPassed, setMinPassed] = useState(false);
  const [gone, setGone] = useState(false);
  const reduce = useReducedMotion();
  const [morphed, setMorphed] = useState(false);
  const morphTo = emblem?.morphTo;

  useEffect(() => {
    const t = window.setTimeout(() => setMinPassed(true), minDuration);
    return () => window.clearTimeout(t);
  }, [minDuration]);

  useEffect(() => {
    if (!morphTo) return;
    const t = window.setTimeout(() => setMorphed(true), reduce ? 0 : MORPH_AT);
    return () => window.clearTimeout(t);
  }, [morphTo, reduce]);

  const leaving = done && minPassed;
  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(() => setGone(true), 700);
    return () => window.clearTimeout(t);
  }, [leaving]);

  if (gone) return null;
  const dropMask = emblem && ({ WebkitMaskImage: `url(${emblem.mask})`, maskImage: `url(${emblem.mask})` } as CSSProperties);
  return (
    <div className="cow-loader" data-leaving={leaving ? '' : undefined} role="status" aria-live="polite">
      {emblem ? (
        <div className="cow-loader__emblem" data-phase={morphed ? 'emblem' : 'shake'}>
          <img className="cow-loader__ring" src={emblem.ring} alt="" />
          <img className="cow-loader__centre" src={emblem.centre} alt="" />
          <div className="cow-loader__drop" style={dropMask || undefined}>
            <div className="cow-loader__head">
              <Character name="cow-peek" alt="" />
            </div>
          </div>
          {morphTo && <img className="cow-loader__flat" src={morphTo} alt="" />}
        </div>
      ) : (
        <div className="cow-loader__track">
          <div className="cow-loader__cow">
            <Character name="cow-loading" alt="" />
          </div>
        </div>
      )}
      <p className="cow-loader__label">{label}</p>
    </div>
  );
}
