// ---------------------------------------------------------------------------
// WORD RECOGNITION (on-device, closed-vocabulary)
// ---------------------------------------------------------------------------
// The word levels have a KNOWN vocabulary (the 12 two-letter words). Rather than
// only checking "did you stay on the template", we recognise WHICH word was
// written and mark it wrong if it isn't the target — so a different or garbled
// word genuinely fails.
//
// Each candidate word is rendered to a canvas (using the font) and reduced to a
// small, bounding-box-normalised, blurred ink-density feature. The child's ink
// is reduced the same way; the nearest candidate wins. No network, no external
// service — it all runs in the browser.
// ---------------------------------------------------------------------------

export const FEAT_GX = 18; // feature grid width
export const FEAT_GY = 12; // feature grid height

// Fit the biggest bold font that leaves a little margin (shared by the slate
// guide/reference and the word templates so they line up).
export function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  w: number,
  h: number
): number {
  let fs = h * 0.72;
  ctx.font = `700 ${fs}px sans-serif`;
  const measured = ctx.measureText(text).width;
  const maxW = w * 0.82;
  if (measured > maxW) fs = (fs * maxW) / measured;
  return Math.round(fs);
}

export interface WordTemplate {
  word: string;
  vec: Float32Array;
}

function blurNormalise(grid: Float32Array): Float32Array {
  const out = new Float32Array(FEAT_GX * FEAT_GY);
  for (let y = 0; y < FEAT_GY; y++) {
    for (let x = 0; x < FEAT_GX; x++) {
      let s = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= FEAT_GX || yy >= FEAT_GY) continue;
          s += grid[yy * FEAT_GX + xx];
          n++;
        }
      }
      out[y * FEAT_GX + x] = s / n;
    }
  }
  let mag = 0;
  for (const v of out) mag += v * v;
  mag = Math.sqrt(mag) || 1;
  for (let i = 0; i < out.length; i++) out[i] /= mag;
  return out;
}

// Reduce an inked region to a normalised feature vector. `alpha(i)` returns the
// alpha (0-255) of pixel index i = y*w + x.
export function featurize(
  alpha: (i: number) => number,
  w: number,
  h: number,
  thr: number
): { vec: Float32Array; count: number } | null {
  let minx = 1e9;
  let miny = 1e9;
  let maxx = -1;
  let maxy = -1;
  let count = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if (alpha(y * w + x) > thr) {
        if (x < minx) minx = x;
        if (x > maxx) maxx = x;
        if (y < miny) miny = y;
        if (y > maxy) maxy = y;
        count++;
      }
    }
  }
  if (count < 3) return null;
  const bw = Math.max(1, maxx - minx);
  const bh = Math.max(1, maxy - miny);
  const grid = new Float32Array(FEAT_GX * FEAT_GY);
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if (alpha(y * w + x) > thr) {
        const gx = Math.min(FEAT_GX - 1, Math.floor(((x - minx) / bw) * FEAT_GX));
        const gy = Math.min(FEAT_GY - 1, Math.floor(((y - miny) / bh) * FEAT_GY));
        grid[gy * FEAT_GX + gx]++;
      }
    }
  }
  return { vec: blurNormalise(grid), count };
}

function distance(a: Float32Array, b: Float32Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return s;
}

// Rank the candidate words by how closely they match the drawn feature.
export function classify(
  vec: Float32Array,
  templates: WordTemplate[]
): { word: string; d: number }[] {
  return templates
    .map((t) => ({ word: t.word, d: distance(vec, t.vec) }))
    .sort((a, b) => a.d - b.d);
}

// Build a feature template for each candidate word by rendering it to a canvas.
export function buildWordTemplates(
  words: string[],
  fitFont: (ctx: CanvasRenderingContext2D, text: string, w: number, h: number) => number,
  w = 360,
  h = 220
): WordTemplate[] {
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const ctx = off.getContext("2d")!;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  return words.map((word) => {
    const fs = fitFont(ctx, word, w, h);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#000";
    ctx.font = `700 ${fs}px sans-serif`;
    ctx.fillText(word, w / 2, h / 2);
    const data = ctx.getImageData(0, 0, w, h).data;
    const f = featurize((i) => data[i * 4 + 3], w, h, 80);
    return { word, vec: f ? f.vec : new Float32Array(FEAT_GX * FEAT_GY) };
  });
}
