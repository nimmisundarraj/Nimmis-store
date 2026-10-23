/**
 * Paints the live parts of the ghee pour (the stream, the pool ripples and the floating motes)
 * on a canvas laid over the still photo. All coordinates are in the photo's 1536 x 1024 frame.
 */

const GEO = {
  w: 1536,
  h: 1024,
  top: 236,
  surf: 516,
  pool: { x: 1046, y: 522, rx: 190, ry: 30 },
  // centre line and half width of the photo's own stream, measured from the original frame: [y, x, halfWidth]
  prof: [
    [220, 1068, 28.5], [226, 1067.3, 25], [232, 1066.6, 22.5], [236, 1066.3, 20.8], [240, 1066, 19.5], [246, 1065.5, 18],
    [252, 1065.5, 16.5], [258, 1065, 15], [264, 1065, 14], [270, 1064.5, 13.2], [280, 1064, 12.3], [292, 1063.5, 11.2],
    [304, 1063, 10.5], [316, 1062.5, 10], [334, 1062, 9.4], [352, 1061, 8.7], [376, 1061, 8.4], [400, 1060.5, 8],
    [430, 1060, 7.6], [454, 1059.5, 8], [472, 1059.5, 8.8], [490, 1059, 10], [516, 1059, 11.5],
  ] as const,
};
const TAU = Math.PI * 2;
/** Stream colours across its width (left to right), sampled from the photo's own stream. */
const STOPS = [0, 0.2, 0.42, 0.68, 0.88, 1];
const BODY = [[252, 228, 64], [254, 240, 72], [254, 244, 112], [253, 232, 46], [252, 212, 12], [226, 165, 6]];
const SHEEN = [255, 252, 232];
const LIP_FADE = 16;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** How fast ripple pulses spread across the pool (photo px per second) and how long each lasts. */
const RIPPLE_V = 46, PULSE_LIFE = 4.5;
/**
 * The brass pot's body below the rim, measured from the photo: its axis, the half width of its
 * outline down the rows ([y, halfWidth]), and where its base ends. The camera looks down on it,
 * so each ring round the pot is an ellipse whose front sits `tilt` of its half width lower than
 * its sides, and the pot leans a touch, lifting its right side by `lean` of its half width. Both
 * were fitted to the grooves and the engraved band, tracked across the photo to within a pixel.
 * The rim's underside, with the shadow it throws on the neck, is a shallower ellipse that stays put.
 */
const POT = {
  cx: 1044, bottom: 846, tilt: 0.29, lean: 0.011,
  rim: { y: 548, dip: 32, rx: 232 },
  prof: [[520, 196], [560, 200], [570, 203], [585, 215], [600, 228], [625, 238], [650, 242], [700, 244], [750, 236], [780, 224], [800, 210], [820, 188], [840, 150], [860, 110]] as const,
  /** The widest turn of the pot the photo shows well, either side of the front, and the cross-fade where copies of it meet. */
  view: (72 * Math.PI) / 180, blend: (24 * Math.PI) / 180,
};
const potRim = (x: number) => {
  const u = Math.min(1, Math.abs(x - POT.cx) / POT.rim.rx);
  return POT.rim.y + POT.rim.dip * Math.sqrt(1 - u * u);
};
/** Spin from a full-width mouse sweep (rad/s), the top speed, and how quickly the spin dies away (1/s). */
const SPIN_GAIN = 6, SPIN_MAX = 8, SPIN_DRAG = 1.6;

const smooth = (e0: number, e1: number, v: number) => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

function potHalfWidth(y: number) {
  const p = POT.prof;
  if (y <= p[0][0]) return p[0][1];
  for (let i = 1; i < p.length; i++) {
    if (y <= p[i][0]) return p[i - 1][1] + ((p[i][1] - p[i - 1][1]) * (y - p[i - 1][0])) / (p[i][0] - p[i - 1][0]);
  }
  return p[p.length - 1][1];
}

/** Three box passes along rows then columns: close enough to a gaussian blur, and works where canvas filters don't. */
function blur(src: Float32Array, W: number, H: number, r: number, chans = 3) {
  let a = src.slice(), b = new Float32Array(src.length);
  const pass = (from: Float32Array, to: Float32Array, horizontal: boolean) => {
    const n = horizontal ? W : H, lines = horizontal ? H : W, step = horizontal ? chans : W * chans;
    for (let l = 0; l < lines; l++) {
      const base = horizontal ? l * W * chans : l * chans;
      for (let ch = 0; ch < chans; ch++) {
        let sum = 0;
        for (let i = -r; i <= r; i++) sum += from[base + Math.min(n - 1, Math.max(0, i)) * step + ch];
        for (let i = 0; i < n; i++) {
          to[base + i * step + ch] = sum / (2 * r + 1);
          sum += from[base + Math.min(n - 1, i + r + 1) * step + ch] - from[base + Math.max(0, i - r) * step + ch];
        }
      }
    }
  };
  for (let k = 0; k < 3; k++) {
    pass(a, b, true);
    pass(b, a, false);
  }
  return a;
}

/** Centre x and half width of the stream at height y. */
function streamAt(y: number): [number, number] {
  const p = GEO.prof;
  if (y <= p[0][0]) return [p[0][1], p[0][2]];
  for (let i = 1; i < p.length; i++) {
    if (y <= p[i][0]) {
      const a = p[i - 1], b = p[i], t = (y - a[0]) / (b[0] - a[0]);
      return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    }
  }
  const last = p[p.length - 1];
  return [last[1], last[2]];
}

type MidPoint = [number, number, number];

export type PourEngine = { start: (delaySeconds?: number) => void; dispose: () => void };

export function createPourEngine(canvas: HTMLCanvasElement, photo: HTMLImageElement): PourEngine | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const G = GEO, L = G.surf - G.top;
  let dpr = 1, k = 1, raf = 0, alive = true, onScreen = true, pourAt = Infinity, landed = -1;
  const motes = Array.from({ length: 16 }, (_, i) => {
    const r = (n: number) => Math.abs((Math.sin(i * 127.1 + n * 311.7) * 43758.5453) % 1);
    const a = r(1), b = r(2), c = r(3);
    return { x: 840 + a * 500, y: 60 + b * 420, r: 0.6 + c * 1.3, sp: 4 + c * 9, ph: a * 6.28, tw: 0.6 + b * 1.4 };
  });

  const size = () => {
    const w = canvas.clientWidth;
    if (!w) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round((w * G.h * dpr) / G.w);
    k = w / G.w;
    surface.src = null;
    pot.ready = false;
  };

  const edges = (t: number, front: number) => {
    const mid: MidPoint[] = [];
    const end = Math.min(front, G.surf);
    // start a few px up inside the photo's own neck of ghee so the top can fade into it
    for (let y = G.top - LIP_FADE; y <= end; y += 2) {
      let [c, hw] = streamAt(y);
      const d = Math.max(0, y - G.top) / L;
      // a faint pulse travelling down the stream, a slow sway and a soft flare where it meets the pool
      hw *= 1 + 0.025 * Math.sin(0.06 * y - 6 * t) + 0.012 * Math.sin(0.17 * y - 10 * t);
      c += 0.9 * d * Math.sin(1.1 * t + 0.013 * y) + 0.35 * Math.sin(2.7 * t + 0.05 * y) * d;
      if (front < G.surf + 40) {
        const f = front - y;
        if (f < 14) hw *= f < 0 ? 0 : 0.55 + 0.75 * Math.sin(Math.PI * Math.min(1, f / 14) * 0.75);
      }
      if (y > G.surf - 20 && front >= G.surf) hw *= 1 + 0.7 * ((y - (G.surf - 20)) / 20) ** 2;
      mid.push([c, y, hw]);
    }
    return mid;
  };

  const outline = (pts: MidPoint[]) => {
    ctx.beginPath();
    pts.forEach(([c, y, hw], i) => (i ? ctx.lineTo(c - hw, y) : ctx.moveTo(c - hw, y)));
    for (let i = pts.length - 1; i >= 0; i--) {
      const [c, y, hw] = pts[i];
      ctx.lineTo(c + hw, y);
    }
    ctx.closePath();
  };

  const lerp = (a: readonly number[], b: readonly number[], f: number) => a.map((v, i) => v + (b[i] - v) * f);
  const rgb = (c: number[]) => `rgb(${c.map(Math.round).join(',')})`;

  const drawStream = (t: number, front: number) => {
    const mid = edges(t, front);
    if (mid.length < 2) return;
    // warm bloom behind the stream
    ctx.save();
    ctx.shadowColor = 'rgba(255,205,40,0.55)';
    ctx.shadowBlur = 22 * k * dpr;
    ctx.fillStyle = '#f9c912';
    // begins a little lower, where the opaque body hides its top edge, so only a soft glow shows above
    outline(mid.filter((p) => p[1] >= G.top + 24));
    ctx.fill();
    ctx.restore();
    // Shade every row inside the one smooth outline, so the cross gradient follows the width
    // without seams. Brighter ghee drifts down the stream as a soft swell in the sheen.
    ctx.save();
    outline(mid);
    ctx.clip();
    for (const [c, y, hw] of mid) {
      const flow = 0.5 + 0.5 * Math.sin(0.045 * y - 8 * t);
      const stops = BODY.map((body, i) =>
        rgb(i === 1 ? lerp(body, SHEEN, 0.55 + 0.45 * flow) : i === 2 ? lerp(body, SHEEN, 0.35 * flow) : body),
      );
      const g = ctx.createLinearGradient(c - hw, 0, c + hw, 0);
      STOPS.forEach((at, i) => g.addColorStop(at, stops[i]));
      const fade = clamp01((y - G.top + LIP_FADE) / (LIP_FADE + 6));
      ctx.globalAlpha = fade * fade * (3 - 2 * fade);
      ctx.fillStyle = g;
      ctx.fillRect(c - hw - 2, y - 1.6, 2 * hw + 4, 3.2);
    }
    ctx.restore();
  };

  /**
   * The pool surface is the photo itself, re-sampled every frame through travelling waves:
   * pixels shift along the ripple and crests catch a little more light, so the photo's own
   * reflections roll outward from where the stream lands. Ripples are separate pulses born at
   * uneven moments, each a little different, and stronger on some sides than others, over a slow
   * cross drift, so no two rings match. Per-pixel geometry is precomputed on resize.
   */
  const pulses: { t0: number; a: number; k: number }[] = [];
  let nextPulse = 0;
  const surface = {
    buf: document.createElement('canvas'),
    X: 0, Y: 0, W: 0, H: 0, s: 1,
    src: null as Uint8ClampedArray | null,
    out: null as ImageData | null,
    r: new Float32Array(0), ux: new Float32Array(0), uy: new Float32Array(0), mask: new Float32Array(0),
    lumpy: new Float32Array(0), driftA: new Float32Array(0), driftB: new Float32Array(0),
  };

  const buildSurface = () => {
    // one sample per CSS pixel is plenty for a soft liquid surface, even on Retina screens
    const P = G.pool, S = surface, s = k, pad = 8;
    S.src = null;
    if (!photo.complete || !photo.naturalWidth) return;
    S.s = s;
    S.X = Math.floor((P.x - P.rx - pad) * s);
    S.Y = Math.floor((P.y - P.ry - pad) * s);
    S.W = Math.ceil((P.x + P.rx + pad) * s) - S.X;
    S.H = Math.ceil((P.y + P.ry + pad) * s) - S.Y;
    if (S.W <= 0 || S.H <= 0) return;
    S.buf.width = S.W;
    S.buf.height = S.H;
    const b = S.buf.getContext('2d', { willReadFrequently: true });
    if (!b) return;
    const f = photo.naturalWidth / G.w;
    b.drawImage(photo, (S.X / s) * f, (S.Y / s) * f, (S.W / s) * f, (S.H / s) * f, 0, 0, S.W, S.H);
    S.src = b.getImageData(0, 0, S.W, S.H).data;
    S.out = b.createImageData(S.W, S.H);
    const n = S.W * S.H, cx = streamAt(G.surf)[0], squash = P.ry / P.rx;
    S.r = new Float32Array(n); S.ux = new Float32Array(n); S.uy = new Float32Array(n); S.mask = new Float32Array(n);
    S.lumpy = new Float32Array(n); S.driftA = new Float32Array(n); S.driftB = new Float32Array(n);
    for (let j = 0, i = 0; j < S.H; j++) {
      for (let x = 0; x < S.W; x++, i++) {
        const px = (S.X + x + 0.5) / s, py = (S.Y + j + 0.5) / s;
        // distances are measured on the level surface, so circles on it look like flat ellipses here
        const dx = px - cx, dy = (py - G.surf) / squash, r = Math.hypot(dx, dy) || 1;
        S.r[i] = r;
        S.ux[i] = dx / r;
        S.uy[i] = (dy / r) * squash;
        const th = Math.atan2(dy, dx);
        S.lumpy[i] = 1 + 0.32 * Math.sin(3 * th + 1.7) + 0.18 * Math.sin(7 * th + 0.4);
        S.driftA[i] = 0.05 * px + 0.11 * py;
        S.driftB[i] = -0.034 * px + 0.16 * py;
        const e = ((px - P.x) / P.rx) ** 2 + ((py - P.y) / P.ry) ** 2;
        S.mask[i] = clamp01((1 - e) / 0.3);
      }
    }
  };

  const drawSurface = (t: number, amp: number) => {
    const S = surface, src = S.src, out = S.out;
    if (!src || !out || amp <= 0) return;
    const o = out.data, W = S.W, H = S.H, s = S.s;
    for (let i = 0, n = W * H; i < n; i++) {
      const m = S.mask[i], q = i * 4;
      if (m <= 0) {
        o[q + 3] = 0;
        continue;
      }
      const r = S.r[i];
      // each pulse is a short train of rings around its travelling radius
      let ring = 0, glint = 0;
      for (const p of pulses) {
        const age = t - p.t0, R = RIPPLE_V * age, w = 9 + 7 * age, dr = r - R;
        if (dr > 3 * w || dr < -3 * w) continue;
        const env = p.a * Math.exp((-dr * dr) / (2 * w * w) - 0.6 * age), ph = p.k * dr;
        ring += env * Math.cos(ph);
        glint += env * Math.sin(ph);
      }
      const near = clamp01((r - 4) / 16) * S.lumpy[i] / Math.sqrt(1 + r / 40);
      const da = Math.cos(S.driftA[i] - 1.3 * t), db = Math.cos(S.driftB[i] - 0.9 * t + 2);
      const d = amp * 3.2 * ring * near * s, drift = amp * (0.5 * da + 0.35 * db) * s;
      let sx = (i % W) + S.ux[i] * d + 0.8 * drift, sy = ((i / W) | 0) + S.uy[i] * d + 0.3 * drift;
      sx = sx < 0 ? 0 : sx > W - 1.001 ? W - 1.001 : sx;
      sy = sy < 0 ? 0 : sy > H - 1.001 ? H - 1.001 : sy;
      const x0 = sx | 0, y0 = sy | 0, fx = sx - x0, fy = sy - y0;
      const a = (y0 * W + x0) * 4, b = a + 4, c = a + W * 4, e = c + 4;
      const lit = 1 + amp * (0.16 * glint * near + 0.02 * (da + db));
      for (let ch = 0; ch < 3; ch++) {
        const top = src[a + ch] + (src[b + ch] - src[a + ch]) * fx;
        const bot = src[c + ch] + (src[e + ch] - src[c + ch]) * fx;
        o[q + ch] = (top + (bot - top) * fy) * lit;
      }
      o[q + 3] = m * 255;
    }
    const b = S.buf.getContext('2d');
    if (!b) return;
    b.putImageData(out, 0, 0);
    ctx.drawImage(S.buf, S.X / s, S.Y / s, W / s, H / s);
  };

  /**
   * The pot turns on its axis as the mouse moves. It is round, so its outline never changes:
   * only the hammered brass and the engraved band travel round it. The photo is split into its
   * soft lighting (a blur of the pot alone) and its fine detail (photo / blur). Every pixel is
   * traced back to the ring round the pot it lies on and its angle on that ring; turning the pot
   * reads the detail from further round the same ring, lit by the unmoved light, so the sun stays
   * put while the brass moves under it. The photo only shows the front, so the surface repeats
   * that front all the way round, the copies cross-fading where they meet.
   */
  const pot = {
    buf: document.createElement('canvas'),
    X: 0, Y: 0, W: 0, H: 0, s: 1,
    low: new Float32Array(0), ratio: new Float32Array(0), out: null as ImageData | null,
    // per pixel: its angle on its ring, the ring's side row and half width, the span of the
    // ring that repeats (centre and period; the bowl and jasmine hide part of the lowest rings)
    th: new Float32Array(0), ring: new Float32Array(0), hw: new Float32Array(0),
    mid: new Float32Array(0), per: new Float32Array(0), mask: new Float32Array(0),
    angle: 0, v: 0, drawn: NaN, fade: 0, ready: false,
  };

  const buildPot = () => {
    const P = pot, s = k;
    P.ready = false;
    if (!photo.complete || !photo.naturalWidth) return;
    P.s = s;
    P.X = Math.floor((POT.cx - 264) * s);
    P.Y = Math.floor((POT.rim.y - 21) * s);
    P.W = Math.ceil((POT.cx + 264) * s) - P.X;
    P.H = Math.ceil((POT.bottom + 24) * s) - P.Y;
    if (P.W <= 0 || P.H <= 0) return;
    P.buf.width = P.W;
    P.buf.height = P.H;
    const b = P.buf.getContext('2d', { willReadFrequently: true });
    if (!b) return;
    const f = photo.naturalWidth / G.w, n = P.W * P.H;
    b.drawImage(photo, (P.X / s) * f, (P.Y / s) * f, (P.W / s) * f, (P.H / s) * f, 0, 0, P.W, P.H);
    const px = b.getImageData(0, 0, P.W, P.H).data;
    // the bare pot: inside its outline, below the rim, clear of the bowl and jasmine in front
    const body = new Float32Array(n), lit = new Float32Array(n * 3);
    for (let j = 0, i = 0; j < P.H; j++) {
      const py = (P.Y + j + 0.5) / s, hw = potHalfWidth(py);
      for (let x = 0; x < P.W; x++, i++) {
        const qx = (P.X + x + 0.5) / s;
        const bowl = qx > 1208 && py > 758, jasmine = qx < 866 && py > 768;
        body[i] = Math.abs(qx - POT.cx) < hw * 0.985 && py > potRim(qx) + 2 && py < POT.bottom + 2 && !bowl && !jasmine ? 1 : 0;
        for (let ch = 0; ch < 3; ch++) lit[i * 3 + ch] = px[i * 4 + ch] * body[i];
      }
    }
    // lighting from the pot alone, so the garden behind it doesn't tint its edges
    const r = Math.max(1, Math.round(9.5 * s)), sumLit = blur(lit, P.W, P.H, r), sumBody = blur(body, P.W, P.H, r, 1);
    P.low = new Float32Array(n * 3);
    P.ratio = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      for (let ch = 0; ch < 3; ch++) {
        const q = i * 3 + ch, l = sumBody[i] > 0.01 ? sumLit[q] / sumBody[i] : px[i * 4 + ch];
        P.low[q] = l;
        P.ratio[q] = Math.min(3, Math.max(0.25, px[i * 4 + ch] / Math.max(1, l)));
      }
    }
    P.out = b.createImageData(P.W, P.H);
    P.th = new Float32Array(n); P.ring = new Float32Array(n); P.hw = new Float32Array(n);
    P.mid = new Float32Array(n); P.per = new Float32Array(n); P.mask = new Float32Array(n);
    for (let j = 0, i = 0; j < P.H; j++) {
      const py = (P.Y + j + 0.5) / s, hwRow = potHalfWidth(py);
      for (let x = 0; x < P.W; x++, i++) {
        const qx = (P.X + x + 0.5) / s, uRow = (qx - POT.cx) / hwRow;
        if (Math.abs(uRow) >= 1) continue;
        const m =
          (1 - smooth(0.94, 0.99, Math.abs(uRow))) *
          smooth(0, 5, py - potRim(qx)) *
          (1 - smooth(POT.bottom - 24, POT.bottom, py)) *
          (1 - smooth(-10, 0, Math.min(qx - 1208, py - 758))) *
          (1 - smooth(-10, 0, Math.min(866 - qx, py - 768)));
        if (m <= 0) continue;
        // which ring is this? the one whose side row, dropped by the dip at this angle, lands here
        let ring = py, hw = hwRow, u = uRow;
        for (let it = 0; it < 6; it++) {
          hw = potHalfWidth(ring);
          u = Math.max(-1, Math.min(1, (qx - POT.cx) / hw));
          ring = py - hw * (POT.tilt * Math.sqrt(1 - u * u) - POT.lean * u);
        }
        // the lowest rings lose their sides behind the bowl and the jasmine, so less of them repeats
        let hi = POT.view + (Math.asin(Math.min(1, (1200 - POT.cx) / hw)) - POT.view) * smooth(722, 752, ring);
        let lo = -POT.view + (Math.asin(Math.max(-1, (872 - POT.cx) / hw)) + POT.view) * smooth(732, 762, ring);
        // the rings just under the rim curl behind it at the sides, so only their front repeats;
        // the very top ones show too little to turn and stay as photographed
        // (a ring at angle t is below the rim where ring + tilt·hw·cos t > rim.y + dip·cos t)
        const front = Math.acos(Math.max(-1, Math.min(1, (POT.rim.y + 3 - ring) / (POT.tilt * hw - POT.rim.dip))));
        hi = Math.min(hi, front);
        lo = Math.max(lo, -front);
        const shown = smooth(0.7, 1, front);
        if (shown <= 0) continue;
        P.th[i] = Math.asin(u);
        P.ring[i] = ring * s - P.Y;
        P.hw[i] = hw * s;
        P.mid[i] = (hi + lo) / 2;
        P.per[i] = hi - lo - POT.blend;
        P.mask[i] = m * shown;
      }
    }
    P.drawn = NaN;
    P.ready = true;
  };

  /** The detail at angle `t` on a ring, read from the photo with bilinear filtering into `into`. */
  const potSample = (t: number, ring: number, hw: number, into: Float32Array) => {
    const P = pot, W = P.W, H = P.H, ratio = P.ratio;
    let sx = POT.cx * P.s - P.X + hw * Math.sin(t);
    let sy = ring + hw * (POT.tilt * Math.cos(t) - POT.lean * Math.sin(t));
    // rings just under the rim curl behind it at the sides; read the brass below the rim instead
    sy = Math.max(sy, potRim((P.X + sx) / P.s) * P.s - P.Y + 3 * P.s) - 0.5;
    sx -= 0.5;
    sx = sx < 0 ? 0 : sx > W - 1.001 ? W - 1.001 : sx;
    sy = sy < 0 ? 0 : sy > H - 1.001 ? H - 1.001 : sy;
    const x0 = sx | 0, y0 = sy | 0, fx = sx - x0, fy = sy - y0;
    const p00 = (y0 * W + x0) * 3, p01 = p00 + 3, p10 = p00 + W * 3, p11 = p10 + 3;
    for (let ch = 0; ch < 3; ch++) {
      const top = ratio[p00 + ch] + (ratio[p01 + ch] - ratio[p00 + ch]) * fx;
      const bot = ratio[p10 + ch] + (ratio[p11 + ch] - ratio[p10 + ch]) * fx;
      into[ch] = top + (bot - top) * fy;
    }
  };

  const drawPot = () => {
    const P = pot;
    if (!P.ready) buildPot();
    const out = P.out;
    if (!P.ready || !out) return;
    if (P.angle !== P.drawn) {
      const o = out.data, low = P.low, a = P.angle, half = POT.blend / 2, A = new Float32Array(3), B = new Float32Array(3);
      for (let i = 0, n = P.W * P.H; i < n; i++) {
        const q = i * 4, m = P.mask[i];
        if (m <= 0) {
          o[q + 3] = 0;
          continue;
        }
        // the turned angle, brought into one copy of the repeating span, centred on its middle
        const per = P.per[i], mid = P.mid[i], ring = P.ring[i], hw = P.hw[i];
        let d = (P.th[i] - a - mid + per / 2) % per;
        if (d < 0) d += per;
        d -= per / 2;
        potSample(d + mid, ring, hw, A);
        // near either end of the copy, fade towards the next copy so the seam never shows
        const over = Math.abs(d) - (per / 2 - half);
        if (over > 0) {
          potSample(d - Math.sign(d) * per + mid, ring, hw, B);
          const w = over / POT.blend;
          for (let ch = 0; ch < 3; ch++) A[ch] += (B[ch] - A[ch]) * w;
        }
        for (let ch = 0; ch < 3; ch++) o[q + ch] = low[i * 3 + ch] * A[ch];
        o[q + 3] = m * 255;
      }
      P.buf.getContext('2d')?.putImageData(out, 0, 0);
      P.drawn = a;
    }
    ctx.save();
    ctx.globalAlpha = P.fade;
    ctx.drawImage(P.buf, P.X / P.s, P.Y / P.s, P.W / P.s, P.H / P.s);
    ctx.restore();
  };

  let lastFrame = 0, lastX: number | null = null, lastMove = 0;
  const turnPot = (t: number) => {
    const dt = Math.min(0.05, Math.max(0, t - lastFrame));
    lastFrame = t;
    if (pot.v) {
      const step = pot.v * dt;
      pot.angle += step;
      // the photo is exact only facing the camera, so ease the turning pot in over its first few degrees
      pot.fade = Math.min(1, pot.fade + Math.abs(step) * 5);
      pot.v *= Math.exp(-SPIN_DRAG * dt);
      if (Math.abs(pot.v) < 0.003) pot.v = 0;
    }
    if (pot.fade > 0) drawPot();
  };
  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const now = performance.now();
    // a long gap means the pointer left and came back somewhere else: don't count the jump
    if (lastX !== null && now - lastMove < 120) {
      const v = pot.v + ((e.clientX - lastX) / Math.max(1, window.innerWidth)) * SPIN_GAIN;
      pot.v = Math.max(-SPIN_MAX, Math.min(SPIN_MAX, v));
    }
    lastX = e.clientX;
    lastMove = now;
    kick();
  };

  const drawPool = (t: number, landedFor: number) => {
    if (landedFor < 0) return;
    if (!surface.src) buildSurface();
    // a new pulse every 0.35-1s, each with its own strength and ring spacing
    if (t >= nextPulse) {
      pulses.push({ t0: t, a: 0.55 + 0.6 * Math.random(), k: 0.2 + 0.12 * Math.random() });
      nextPulse = t + 0.35 + 0.65 * Math.random();
      while (pulses.length && t - pulses[0].t0 > PULSE_LIFE) pulses.shift();
    }
    const u = clamp01(landedFor / 1.6);
    drawSurface(t, u * u * (3 - 2 * u));
    // a soft glow where the stream lands
    const grow = clamp01(landedFor / 0.35), [x, hw] = streamAt(G.surf);
    const w = (2 * hw + 1.5 * Math.sin(t * 5.3)) * grow;
    ctx.save();
    ctx.translate(x, G.surf);
    ctx.scale(1, 0.3);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(1, w));
    g.addColorStop(0, 'rgba(255,244,180,0.85)');
    g.addColorStop(0.5, 'rgba(253,214,60,0.45)');
    g.addColorStop(1, 'rgba(240,170,10,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1, w), 0, TAU);
    ctx.fill();
    ctx.restore();
  };

  const drawLip = (t: number, pour: number) => {
    // the bead of ghee gathering on the ladle lip before it lets go
    const swell = clamp01(pour * 3), [c, hw] = streamAt(G.top), len = 14 + 12 * swell + 1.5 * Math.sin(t * 3);
    const g = ctx.createLinearGradient(c - hw, 0, c + hw, 0);
    g.addColorStop(0, '#fdf384');
    g.addColorStop(0.4, '#fde638');
    g.addColorStop(1, '#e0a008');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(c - hw, G.top - 2);
    ctx.bezierCurveTo(c - hw, G.top + len * 0.6, c - hw * 0.45, G.top + len, c, G.top + len);
    ctx.bezierCurveTo(c + hw * 0.45, G.top + len, c + hw * 0.85, G.top + len * 0.6, c + hw * 0.8, G.top - 2);
    ctx.closePath();
    ctx.fill();
  };

  const drawMotes = (t: number) => {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = 'rgba(255,170,60,0.9)';
    ctx.shadowBlur = 6 * k * dpr;
    for (const m of motes) {
      const y = 60 + ((((m.y - 60 - t * m.sp) % 420) + 420) % 420);
      const x = m.x + 9 * Math.sin(t * 0.3 + m.ph);
      const edge = Math.min(1, (y - 60) / 60, (480 - y) / 60);
      const a = edge * (0.12 + 0.3 * (0.5 + 0.5 * Math.sin(t * m.tw + m.ph)));
      ctx.fillStyle = `rgba(255,186,80,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  };

  const frame = (now: number) => {
    raf = 0;
    if (!alive) return;
    const t = now / 1000;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr * k, 0, 0, dpr * k, 0, 0);
    const since = t - pourAt, fall = clamp01(since / 1);
    const front = since < 0 ? G.top : G.top + (L + 30) * fall * fall;
    if (front >= G.surf && landed < 0) landed = t;
    turnPot(t);
    drawPool(t, landed > 0 ? t - landed : -1);
    drawMotes(t);
    drawLip(t, since < 0 ? 0 : since);
    if (since > 0) drawStream(t, front);
    if (onScreen && !document.hidden) raf = requestAnimationFrame(frame);
  };

  const kick = () => {
    if (!raf && alive && onScreen && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const ro = new ResizeObserver(() => {
    size();
    kick();
  });
  ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    kick();
  });
  io.observe(canvas);
  document.addEventListener('visibilitychange', kick);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  size();

  return {
    start(delay = 0) {
      pourAt = performance.now() / 1000 + delay;
      kick();
    },
    dispose() {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', kick);
      window.removeEventListener('pointermove', onPointerMove);
    },
  };
}
