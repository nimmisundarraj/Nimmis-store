import type { ReactNode } from 'react';
import type { Illustration } from './content';

/** Drawn stand-ins for the dry fruits until their photos arrive: a heap in a wooden bowl. */
export function ProductArt({ art }: { art: Illustration }) {
  return (
    <svg viewBox="0 0 200 150" aria-hidden="true">
      <ellipse cx="100" cy="134" rx="62" ry="7" fill="#7a4a10" opacity=".22" />
      {ILLUSTRATIONS[art]}
      <path d="M36 102h128c-4 20-30 34-64 34S40 122 36 102Z" fill="url(#g-wood)" />
      <ellipse cx="100" cy="102" rx="64" ry="6" fill="#c08a50" />
    </svg>
  );
}

const RAISINS: [number, number][] = [[72, 90], [84, 80], [98, 76], [112, 80], [126, 88], [80, 96], [94, 90], [108, 92], [120, 98], [100, 98], [66, 98], [134, 98]];

function Star({ cx, cy, R, r, rot }: { cx: number; cy: number; R: number; r: number; rot: number }) {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const points = Array.from({ length: 16 }, (_, k) => {
    const a = rad(rot + k * 22.5), rr = k % 2 ? r : R;
    return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  return (
    <>
      <polygon points={points} fill="#7a3a17" stroke="#3e1a08" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx={cx} cy={cy} r={r * 0.5} fill="#4a210b" />
      {Array.from({ length: 8 }, (_, k) => {
        const a = rad(rot + k * 45);
        return <ellipse key={k} cx={(cx + R * 0.62 * Math.cos(a)).toFixed(1)} cy={(cy + R * 0.62 * Math.sin(a)).toFixed(1)} rx="2.2" ry="3" fill="#c98a4a" />;
      })}
    </>
  );
}

const ILLUSTRATIONS: Record<Illustration, ReactNode> = {
  almond: (
    <g fill="url(#g-almond)">
      <path d="M70 92c-8-14 0-30 12-32 4 12 2 26-12 32Z" />
      <path d="M92 86c-6-16 4-30 16-30 2 13-2 26-16 30Z" />
      <path d="M118 90c-4-16 7-29 19-27 0 13-5 25-19 27Z" />
      <path d="M80 100c2-14 16-20 27-15-4 11-14 18-27 15Z" />
      <path d="M106 100c3-13 17-18 27-12-5 10-15 16-27 12Z" />
    </g>
  ),
  pista: (
    <>
      <g transform="rotate(-30 76 86)"><ellipse cx="76" cy="86" rx="11" ry="17" fill="#d9c49a" /><ellipse cx="76" cy="84" rx="6" ry="11" fill="#7fa04a" /></g>
      <g transform="rotate(10 100 80)"><ellipse cx="100" cy="80" rx="11" ry="17" fill="#e2cfa6" /><ellipse cx="100" cy="78" rx="6" ry="11" fill="#8db255" /></g>
      <g transform="rotate(35 124 86)"><ellipse cx="124" cy="86" rx="11" ry="17" fill="#d4bd90" /><ellipse cx="124" cy="84" rx="6" ry="11" fill="#759a43" /></g>
      <ellipse cx="90" cy="96" rx="10" ry="15" fill="#cdb585" transform="rotate(70 90 96)" />
      <ellipse cx="112" cy="97" rx="10" ry="15" fill="#d9c49a" transform="rotate(-65 112 97)" />
    </>
  ),
  raisins: (
    <>
      {RAISINS.map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="7.5" ry="5.5" transform={`rotate(${(i * 37) % 180} ${x} ${y})`} fill="#2b1420" stroke="#4a2433" strokeWidth="1.2" />
      ))}
    </>
  ),
  cashew: (
    <g fill="url(#g-cashew)" stroke="#b88a48" strokeWidth=".6">
      <path d="M62 86c-6-14 4-28 18-26-8 5-10 14-5 22 3 5 1 9-4 9-4 0-7-2-9-5Z" />
      <path d="M84 76c2-15 18-21 29-13-9 1-14 8-13 17 1 6-3 8-7 7-5-1-9-5-9-11Z" />
      <path d="M112 84c-2-15 12-24 25-18-9 3-12 11-9 19 2 5-1 8-5 8-5 0-10-4-11-9Z" />
      <path d="M96 92c8-12 24-10 30 1-8-3-16 0-19 8-2 5-6 5-9 3-4-3-5-8-2-12Z" />
      <path d="M70 96c8-11 23-8 28 3-8-3-15 0-18 7-2 5-6 5-9 3-3-3-4-9-1-13Z" />
      <path d="M120 98c9-10 23-6 27 5-7-4-15-2-18 5-2 5-6 4-9 2-3-3-3-8 0-12Z" />
    </g>
  ),
  anise: (
    <>
      <Star cx={78} cy={82} R={22} r={7} rot={10} />
      <Star cx={122} cy={80} R={20} r={6} rot={-5} />
      <Star cx={100} cy={96} R={21} r={7} rot={20} />
    </>
  ),
};
