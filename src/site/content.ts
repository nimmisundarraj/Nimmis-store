/** Photos and video for the site live in /public/site. */
export const asset = (file: string) => `${process.env.PUBLIC_URL}/site/${file}`;

/**
 * The WhatsApp number stays out of the source. Set REACT_APP_WHATSAPP_NUMBER in .env, ideally with the country code.
 * wa.me wants digits only with the country code, so spaces, dashes and "+" are dropped and a bare 10 digit Indian number gets 91.
 */
const WA_DIGITS = (process.env.REACT_APP_WHATSAPP_NUMBER ?? '').replace(/\D/g, '');
const WHATSAPP = WA_DIGITS.length === 10 ? `91${WA_DIGITS}` : WA_DIGITS;

export const waLink = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

/** Every order message ends with this blank address form, so the customer sends everything we need to deliver in one go. */
const DELIVERY_FORM = [
  '',
  'Delivery address:',
  'Name: ',
  'Phone: ',
  'House / flat: ',
  'Street and area: ',
  'City: ',
  'State: ',
  'Pincode: ',
  'Landmark (optional): ',
].join('\n');

/** `detail` is the size and price, e.g. "250 g, ₹320". */
export const orderMsg = (name: string, detail?: string) =>
  `Hi Nimmi's Products! I'd like to order ${name}${detail ? ` (${detail})` : ''}.\n${DELIVERY_FORM}`;

export const GENERAL_ORDER = `Hi Nimmi's Products! I'd like to place an order.\n${DELIVERY_FORM}`;

export const GHEE_SIZES = ['50 ml', '100 ml', '200 ml', '500 ml', '1 L', '2 L'] as const;
export type GheeSize = (typeof GHEE_SIZES)[number];

export const GHEE_IMG: Record<GheeSize, string> = {
  '50 ml': 'ghee-50.webp',
  '100 ml': 'ghee-100.webp',
  '200 ml': 'ghee-200.webp',
  '500 ml': 'ghee-500.webp',
  '1 L': 'ghee-1000.webp',
  '2 L': 'ghee-2000.webp',
};

/**
 * The size gallery. `scale` is the photo's height against its image stage, so the six keep their real
 * order without the small ones vanishing. `offCentre`: the photo frames the jar left of centre, so the gallery nudges it back.
 */
export const SIZE_RANGE: { size: GheeSize; label: string; note: string; scale: number; offCentre?: boolean }[] = [
  { size: '50 ml', label: '50 ml', note: 'A little taste', scale: 0.68 },
  { size: '100 ml', label: '100 ml', note: 'For everyday moments', scale: 0.75 },
  { size: '200 ml', label: '200 ml', note: 'A little more goodness', scale: 0.82 },
  { size: '500 ml', label: '500 ml', note: 'For the family table', scale: 0.9, offCentre: true },
  { size: '1 L', label: '1 litre', note: 'For regular cooking', scale: 0.97, offCentre: true },
  { size: '2 L', label: '2 litres', note: 'For the whole family', scale: 1.04, offCentre: true },
];

/** "2 litres" reads as "your 2 litre ghee" inside the sentence. */
export const sizeOrderMsg = (label?: string) =>
  `Hello Nimmi's, I'm interested in ordering your ${label ? `${label.replace(/s$/, '')} ` : ''}ghee. Please share the price and delivery time.\n${DELIVERY_FORM}`;

export type Illustration = 'almond' | 'pista' | 'raisins' | 'cashew' | 'anise';

export const USES = [
  { ml: 'ബിരിയാണി', title: 'Thalassery biriyani', text: 'Kaima rice fried in ghee before the dum. The smell that brings everyone to the table.' },
  { ml: 'പായസം', title: 'Payasam', text: 'Cashews and raisins fried golden in a spoon of ghee, poured over at the end.' },
  { ml: 'ദോശ', title: 'Ghee roast dosa', text: 'A thin layer brushed on the hot tawa for a crisp, glossy dosa.' },
  { ml: 'നിലവിളക്ക്', title: 'The evening lamp', text: 'In many homes, a little ghee lights the nilavilakku at dusk.' },
];

/** Fill these in once; the founders section, its alt text and signature all read from here. */
export const FOUNDERS = { year: '1994', dad: 'Mr. Sundar Raj', mom: 'Ms. Reena' };
export const FOUNDERS_PORTRAIT = `${process.env.PUBLIC_URL}/images/founders-portrait.webp`;

/** Rows that read these stay hidden while they are empty. */
export const FSSAI_NO = '';
export const SHOP_HOURS = '';

export const MAPS_URL =
  "https://www.google.com/maps/place/Nimmi's+Products/@11.7794398,75.5245453,16z/data=!4m7!3m6!1s0x3ba4270062aa2ad7:0x2ea54246bcb10928!4b1!8m2!3d11.7794398!4d75.5245453!16s%2Fg%2F11ww0b1qxp?hl=en";
/** Google's keyless map embed, searched by name at the shop's coordinates so the shop's own place label shows. */
export const MAP_EMBED =
  'https://maps.google.com/maps?q=Nimmi%27s%20Products%2C%20West%20Ponniam%2C%20Thalassery&ll=11.7794398,75.5245453&z=16&output=embed';
export const INSTAGRAM_URL = 'https://www.instagram.com/nimmis_product/';
export const EMAIL = 'hellonimmisproduct@gmail.com';
