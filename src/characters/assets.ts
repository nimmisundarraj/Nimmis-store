/**
 * Character art lives in /public/characters.
 *
 * Drop a finished WebP in with the name below (e.g. public/characters/amma-hero.webp) and the
 * site uses it automatically. Until then the illustrated placeholder in
 * /public/characters/placeholders is shown. No code change needed when art arrives.
 */

export type CharacterName =
  | 'amma-hero'
  | 'amma-hero-jar'
  | 'achan-hero'
  | 'achan-stir'
  | 'amma-strain'
  | 'amma-seal'
  | 'parents-story'
  | 'parents-wave'
  | 'cow-peek'
  | 'cow-peek-excited'
  | 'cow-peek-happy'
  | 'cow-peek-side'
  | 'cow-excited'
  | 'cow-happy'
  | 'cow-loading'
  | 'cow-404'
  | 'cow-peek-sleepy'
  | 'cow-peek-confused'
  | 'cow-stand'
  | 'cow-walk'
  | 'achan-stand'
  | 'amma-stand'
  | `cow-offer-${ProductKey}`;

export type ProductKey = 'ghee' | 'dates' | 'almonds' | 'pista' | 'raisins' | 'cashew' | 'anise';

const BASE = `${process.env.PUBLIC_URL}/characters/`;

/**
 * When a pose has no finished art yet, try the closest finished pose before falling back to
 * the placeholder, so real and placeholder styles never mix on screen once a family of poses
 * has started arriving.
 */
const STAND_INS: Partial<Record<CharacterName, CharacterName[]>> = {
  'amma-hero-jar': ['amma-hero'],
  'amma-seal': ['amma-strain', 'amma-stand'],
  // Until the dedicated section poses exist, use views cut from the approved parent sheet.
  'achan-stir': ['achan-stand'],
  'amma-strain': ['amma-stand'],
  'parents-wave': ['parents-story'],
  'cow-peek-excited': ['cow-peek'],
  'cow-peek-happy': ['cow-peek'],
  // Until the dedicated full-body cow poses exist, use poses cut from the approved model sheet.
  'cow-excited': ['cow-peek-excited'],
  'cow-happy': ['cow-peek-happy'],
  'cow-loading': ['cow-walk'],
  'cow-404': ['cow-peek-confused'],
};
const standInsFor = (name: CharacterName): CharacterName[] =>
  STAND_INS[name] ?? (name.startsWith('cow-offer-') ? ['cow-stand'] : []);

/** Placeholder file to use for a pose that has no placeholder of its own. */
const PLACEHOLDER_ALIAS: Partial<Record<CharacterName, CharacterName>> = {
  'amma-hero-jar': 'amma-hero',
  'amma-seal': 'amma-strain',
  'cow-peek-sleepy': 'cow-peek',
  'cow-peek-confused': 'cow-404',
  'cow-stand': 'cow-excited',
  'cow-walk': 'cow-loading',
  'achan-stand': 'achan-stir',
  'amma-stand': 'amma-strain',
};

/** Ordered list of URLs to try for a character pose. */
export function characterSources(name: CharacterName): string[] {
  const real = [name, ...standInsFor(name)].map((n) => `${BASE}${n}.webp`);
  const placeholder = `${BASE}placeholders/${PLACEHOLDER_ALIAS[name] ?? name}.svg`;
  return [...real, placeholder];
}

export const PRODUCT_LABELS: Record<ProductKey, string> = {
  ghee: 'Pure Ghee',
  dates: 'Dates',
  almonds: 'California Almonds',
  pista: 'Pista',
  raisins: 'Black Raisins',
  cashew: 'Cashew JHA',
  anise: 'Star Anise',
};
