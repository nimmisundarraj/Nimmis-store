import { useEffect, useId, useState, type CSSProperties } from 'react';
import { asset } from './content';

/** The gold rule with the brand's cow emblem at its centre. */
export function CowDivider({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <span className={['cow-divider', className].filter(Boolean).join(' ')} style={style} aria-hidden="true">
      <i />
      <img src={asset('cow-emblem-128.webp')} alt="" width={122} height={128} />
      <i />
    </span>
  );
}

/** Gradients shared by the product illustrations and the pot. Render once per page. */
export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <linearGradient id="g-wood" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#b07a42" />
          <stop offset="1" stopColor="#6e3f14" />
        </linearGradient>
        <radialGradient id="g-cashew" cx=".35" cy=".3" r=".9">
          <stop offset="0" stopColor="#fff3d6" />
          <stop offset="1" stopColor="#ddb574" />
        </radialGradient>
        <radialGradient id="g-almond" cx=".35" cy=".3" r=".9">
          <stop offset="0" stopColor="#d08a4f" />
          <stop offset="1" stopColor="#7a3f17" />
        </radialGradient>
        <linearGradient id="g-pot" x1="0" x2="1">
          <stop offset="0" stopColor="#5a3a0a" />
          <stop offset=".35" stopColor="#e0ad52" />
          <stop offset=".6" stopColor="#a87424" />
          <stop offset="1" stopColor="#4a3009" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** WhatsApp-style chat bubble. */
/** WhatsApp's mark as a small 3D badge: a glossy green disc in the app's colours with the white bubble and handset on top. */
export function ChatIcon() {
  const id = useId().replace(/:/g, '');
  return (
    <svg className="wa-icon" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-disc`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#61fd7d" />
          <stop offset="1" stopColor="#1fa83a" />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-glyph`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#e4efe6" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11.5" fill={`url(#${id}-disc)`} />
      {/* darker rim at the bottom so the disc reads as a raised button */}
      <circle cx="12" cy="12" r="11.1" fill="none" stroke="#0f7a2a" strokeOpacity=".35" strokeWidth=".8" />
      {/* WhatsApp's own bubble-and-handset glyph (Simple Icons), centred on the disc */}
      <path
        transform="translate(12 12) scale(.6) translate(-12.03 -12)"
        fill={`url(#${id}-glyph)`}
        style={{ filter: 'drop-shadow(0 .6px .5px rgb(0 60 20 / .45))' }}
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
      />
      <ellipse cx="12" cy="6.4" rx="8" ry="4.6" fill={`url(#${id}-gloss)`} />
    </svg>
  );
}

/** The face declared in site.css for the wordmark. */
const WORDMARK_FONT = '100px "Nimmi Cooper"';

/**
 * True once the wordmark font has loaded. Until then the SVG stays hidden, so the thin fallback
 * serif (stretched to the same width by textLength) never flashes before Cooper arrives.
 */
function useWordmarkFont() {
  const [ready, setReady] = useState(() => {
    try {
      return document.fonts.check(WORDMARK_FONT);
    } catch {
      return true;
    }
  });
  useEffect(() => {
    if (ready) return;
    let alive = true;
    const show = () => alive && setReady(true);
    // a failed or very slow font load still shows the wordmark, in the fallback, after 3s
    const t = window.setTimeout(show, 3000);
    document.fonts.load(WORDMARK_FONT).then(show, show);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [ready]);
  return ready;
}

/** Bronze steps under the letters, top to bottom: the extruded depth of the cast. */
const DEPTH = ['#9a6a26', '#7c521a', '#5f3d10', '#45290a'];

/**
 * "Nimmi's" in Cooper Black as polished gold jewellery: the letters are eroded slightly so they read
 * lighter than the font's single Black weight, a banded gradient reads as mirror reflections, a narrow lit bevel puts a crisp highlight on every
 * edge, and stacked bronze layers give the letters depth. textLength keeps the width fixed even
 * while the font is still loading.
 */
export function GoldWordmark({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  const fontReady = useWordmarkFont();
  return (
    <svg
      className={['gold-wordmark', className].filter(Boolean).join(' ')}
      viewBox="0 0 458 112"
      data-ready={fontReady ? '' : undefined}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <GoldFinish id={id} />
      </defs>
      <text
        x="6"
        y="84"
        fontSize="100"
        textLength="443"
        lengthAdjust="spacingAndGlyphs"
        fill={`url(#${id}-g)`}
        filter={`url(#${id}-f)`}
      >
        Nimmi’s
      </text>
    </svg>
  );
}

/** The wordmark's polished gold: a banded gradient (`#<id>-g`) and the bevel and bronze-depth filter (`#<id>-f`), sized for ~100px type. */
function GoldFinish({ id }: { id: string }) {
  const light = <feDistantLight azimuth={235} elevation={50} />;
  const lift = { type: 'linear', slope: 0.35, intercept: 0.72 } as const;
  return (
    <>
      <linearGradient id={`${id}-g`} x1="0" y1="0" x2=".25" y2="1">
        <stop offset="0" stopColor="#fff4d2" />
        <stop offset=".15" stopColor="#f0cd82" />
        <stop offset=".33" stopColor="#b5843b" />
        <stop offset=".43" stopColor="#563510" />
        <stop offset=".52" stopColor="#9a6824" />
        <stop offset=".64" stopColor="#f0cf86" />
        <stop offset=".72" stopColor="#f9e2a6" />
        <stop offset=".85" stopColor="#c08a3c" />
        <stop offset="1" stopColor="#6a4413" />
      </linearGradient>
      <filter id={`${id}-f`} x="-4%" y="-20%" width="108%" height="160%" colorInterpolationFilters="sRGB">
        {/* thin the shape (alpha only, so the gold keeps its colour); everything below builds on it */}
        <feMorphology in="SourceAlpha" operator="erode" radius={1.2} result="shape" />
        <feComposite in="SourceGraphic" in2="shape" operator="in" result="fill" />
        <feGaussianBlur in="shape" stdDeviation={0.9} result="bump" />
        <feDiffuseLighting in="bump" surfaceScale={2.6} diffuseConstant={1} lightingColor="#fff" result="diffuse">
          {light}
        </feDiffuseLighting>
        {/* lift the shadow side so the edges stay gold instead of going muddy */}
        <feComponentTransfer in="diffuse" result="shade">
          <feFuncR {...lift} />
          <feFuncG {...lift} />
          <feFuncB {...lift} />
        </feComponentTransfer>
        <feBlend in="fill" in2="shade" mode="multiply" result="shaded" />
        <feSpecularLighting in="bump" surfaceScale={2.6} specularConstant={1} specularExponent={40} lightingColor="#fff7e0" result="spec">
          {light}
        </feSpecularLighting>
        <feComposite in="spec" in2="shape" operator="in" result="shine" />
        <feComposite in="shaded" in2="shine" operator="arithmetic" k2={1} k3={1} result="lit" />
        <feComposite in="lit" in2="shape" operator="in" result="gold" />
        {DEPTH.map((c, i) => [
          <feOffset key={`o${i}`} in="shape" dy={1.3 * (i + 1)} result={`o${i}`} />,
          <feFlood key={`f${i}`} floodColor={c} />,
          <feComposite key={`c${i}`} in2={`o${i}`} operator="in" result={`d${i}`} />,
        ])}
        <feGaussianBlur in="shape" stdDeviation={5} />
        <feOffset dy={9} result="drop" />
        <feFlood floodColor="#000" floodOpacity={0.55} />
        <feComposite in2="drop" operator="in" result="cast" />
        <feMerge>
          <feMergeNode in="cast" />
          {DEPTH.map((_, i) => (
            <feMergeNode key={i} in={`d${DEPTH.length - 1 - i}`} />
          ))}
          <feMergeNode in="gold" />
        </feMerge>
      </filter>
    </>
  );
}
