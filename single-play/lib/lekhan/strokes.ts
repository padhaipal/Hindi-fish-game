// ---------------------------------------------------------------------------
// LETTER STROKES — the ordered pen strokes for each of the 8 letters.
// ---------------------------------------------------------------------------
// Each stroke is a centreline polyline in a 0..100 box (x left→right, y top→
// bottom), drawn in the order listed and in the direction first→last point (the
// arrow). We DON'T draw these lines — the game shows the accurate FONT glyph and
// assigns every glyph pixel to its NEAREST stroke, so the real letter is split
// into strokes for highlighting/validation. The polylines only need to run
// roughly ALONG each stroke for that nearest-assignment to group pixels right.
//
// Order convention: the distinctive body parts first (left→right), then the
// vertical stem (खड़ी पाई), then the top headline (शिरोरेखा) last.
// ---------------------------------------------------------------------------

export type Stroke = [number, number][];

export const LETTER_STROKES: Record<string, Stroke[]> = {
  // ब : bowl, inner belly, stem, headline
  ba: [
    [[35, 41], [29, 56], [33, 70], [46, 77], [60, 76], [70, 66]],
    [[30, 52], [50, 52]],
    [[72, 37], [72, 78]],
    [[28, 37], [76, 37]],
  ],
  // स : top-left loop, body down to stem, stem, headline
  sa: [
    [[47, 45], [36, 39], [29, 49], [38, 56], [47, 49]],
    [[40, 46], [33, 64], [45, 77], [64, 75]],
    [[70, 37], [70, 78]],
    [[22, 37], [74, 37]],
  ],
  // प : left loop body, stem, headline
  pa: [
    [[34, 41], [28, 58], [34, 72], [50, 72], [55, 60], [50, 50]],
    [[72, 37], [72, 78]],
    [[26, 37], [76, 37]],
  ],
  // र : down-stroke with the right notch, headline
  ra: [
    [[46, 39], [53, 48], [67, 50], [50, 56], [44, 68], [39, 79]],
    [[34, 37], [68, 37]],
  ],
  // त : top curl + vertical, bottom bowl, headline
  ta: [
    [[45, 41], [36, 37], [32, 45], [41, 48], [45, 43], [45, 64]],
    [[31, 64], [41, 77], [62, 77], [71, 64]],
    [[28, 37], [74, 37]],
  ],
  // क : left loop, central stem, right arm, headline
  ka: [
    [[47, 45], [35, 40], [28, 51], [35, 63], [47, 62], [50, 54]],
    [[55, 37], [55, 78]],
    [[55, 55], [66, 48], [74, 56], [69, 66]],
    [[26, 37], [77, 37]],
  ],
  // च : open cup body, stem, headline
  cha: [
    [[42, 43], [30, 53], [33, 68], [47, 76], [63, 71]],
    [[69, 37], [69, 78]],
    [[28, 37], [72, 37]],
  ],
  // ल : body with bottom-left loop, stem, headline
  la: [
    [[42, 43], [32, 49], [38, 58], [47, 54], [41, 64], [35, 74], [49, 78], [63, 73]],
    [[71, 37], [71, 78]],
    [[26, 37], [74, 37]],
  ],

  // --- consonants added from the ALfA stroke chart (body → stem → headline) ---
  // न : left curved body, stem, headline
  na: [
    [[34, 42], [31, 58], [38, 72], [50, 70]],
    [[70, 37], [70, 80]],
    [[26, 37], [74, 37]],
  ],
  // म : left loop body, stem, headline
  ma: [
    [[40, 45], [32, 42], [28, 52], [34, 60], [42, 56], [40, 66], [46, 72]],
    [[70, 37], [70, 80]],
    [[26, 37], [74, 37]],
  ],
  // भ : left body, inner bar, stem, headline
  bha: [
    [[41, 45], [30, 48], [29, 62], [42, 68], [49, 58]],
    [[30, 55], [46, 55]],
    [[70, 37], [70, 80]],
    [[26, 37], [74, 37]],
  ],
  // ग : left hook body, stem, headline
  ga: [
    [[36, 42], [34, 58], [40, 72], [52, 72]],
    [[70, 37], [70, 80]],
    [[26, 37], [74, 37]],
  ],
  // घ : rounded body, stem, headline
  gha: [
    [[42, 42], [30, 46], [27, 58], [34, 71], [48, 74], [57, 65], [51, 54]],
    [[70, 37], [70, 80]],
    [[26, 37], [74, 37]],
  ],
  // ध : rounded body, stem (with foot), headline
  dha: [
    [[42, 42], [30, 46], [27, 58], [34, 71], [48, 74], [57, 65], [51, 54]],
    [[70, 37], [70, 83]],
    [[26, 37], [74, 37]],
  ],
  // व : bowl body, stem, headline
  va: [
    [[43, 44], [32, 48], [29, 61], [37, 72], [51, 73], [58, 62], [51, 52]],
    [[70, 37], [70, 80]],
    [[26, 37], [74, 37]],
  ],
  // ट : hooked body, headline
  tta: [
    [[34, 40], [52, 37], [63, 45], [57, 55], [44, 55], [40, 67], [49, 78], [64, 75]],
    [[30, 37], [70, 37]],
  ],
  // ठ : round body, headline
  ttha: [
    [[50, 44], [38, 48], [36, 61], [46, 71], [60, 66], [62, 53], [50, 44]],
    [[30, 37], [72, 37]],
  ],
  // ड : hooked body, headline
  dda: [
    [[38, 40], [54, 38], [62, 48], [51, 56], [40, 55], [49, 65], [60, 75], [53, 83]],
    [[30, 37], [66, 37]],
  ],
  // थ : round body with inner loop, stem, headline
  tha: [
    [[42, 44], [31, 49], [30, 62], [40, 70], [52, 66], [50, 54], [41, 55]],
    [[70, 37], [70, 80]],
    [[26, 37], [74, 37]],
  ],
  // द : top loop then descending hook, headline
  da: [
    [[40, 41], [53, 40], [53, 52], [41, 54], [53, 59], [61, 71], [52, 81]],
    [[34, 37], [68, 37]],
  ],
  // ज : left hook body, inner bar, stem, headline
  ja: [
    [[38, 44], [30, 50], [36, 59], [45, 54], [40, 64], [46, 73]],
    [[45, 55], [62, 55]],
    [[70, 37], [70, 80]],
    [[26, 37], [74, 37]],
  ],
  // झ : left hook body, inner vertical, stem, headline
  jha: [
    [[36, 45], [29, 51], [34, 59], [42, 55], [38, 64], [44, 73]],
    [[50, 50], [50, 74]],
    [[70, 37], [70, 80]],
    [[26, 37], [74, 37]],
  ],
  // छ : bowl body, right tail, headline
  chha: [
    [[42, 44], [31, 49], [29, 62], [38, 73], [52, 72], [58, 60]],
    [[67, 40], [68, 82]],
    [[28, 37], [72, 37]],
  ],
  // ख : curvy left body, stem, headline
  kha: [
    [[43, 44], [33, 42], [30, 52], [38, 58], [46, 53], [40, 63], [34, 73], [47, 77]],
    [[68, 37], [68, 80]],
    [[26, 37], [74, 37]],
  ],
  // फ : bowl body, right flag, stem, headline
  pha: [
    [[41, 48], [30, 52], [30, 66], [42, 72], [52, 63], [47, 53]],
    [[52, 58], [73, 54]],
    [[70, 37], [70, 80]],
    [[26, 37], [74, 37]],
  ],
  // ह : left curl body, stem, headline
  ha: [
    [[45, 44], [34, 42], [30, 52], [38, 61], [47, 55], [40, 66], [46, 77]],
    [[68, 37], [68, 80]],
    [[26, 37], [72, 37]],
  ],
  // श : top-left loop, body down to stem, stem, headline
  sha: [
    [[36, 46], [29, 42], [25, 50], [31, 57], [40, 52]],
    [[35, 50], [32, 66], [44, 77], [62, 74]],
    [[70, 37], [70, 78]],
    [[24, 37], [74, 37]],
  ],
  // ष : round body, stem, headline
  shha: [
    [[43, 44], [32, 49], [29, 62], [39, 72], [52, 70], [57, 58], [46, 52]],
    [[70, 37], [70, 80]],
    [[26, 37], [74, 37]],
  ],

  // --- vowels (स्वर) ---
  // अ : left loop, mid bar, stem, headline
  a: [
    [[44, 45], [34, 40], [28, 52], [35, 63], [46, 61], [49, 53]],
    [[49, 58], [67, 58]],
    [[67, 37], [67, 80]],
    [[26, 37], [74, 37]],
  ],
  // अं : same body as अ (anusvara dot rides the top band → headline)
  an: [
    [[44, 45], [34, 40], [28, 52], [35, 63], [46, 61], [49, 53]],
    [[49, 58], [67, 58]],
    [[67, 37], [67, 80]],
    [[26, 37], [74, 37]],
  ],
  // आ : left loop, mid bar, inner stem, kaana, headline
  aa: [
    [[38, 45], [29, 40], [23, 52], [30, 63], [40, 61], [43, 53]],
    [[43, 58], [59, 58]],
    [[61, 37], [61, 80]],
    [[78, 37], [78, 80]],
    [[22, 37], [82, 37]],
  ],
  // उ : one curved body, short headline
  u: [
    [[46, 42], [36, 40], [31, 49], [40, 55], [50, 51], [44, 61], [35, 73], [49, 80]],
    [[30, 37], [62, 37]],
  ],
  // ऊ : curved body with a bottom tail, short headline
  uu: [
    [[46, 42], [36, 40], [31, 49], [40, 55], [50, 51], [44, 61], [36, 72], [49, 79]],
    [[50, 66], [64, 73]],
    [[30, 37], [62, 37]],
  ],
  // ए : left hook body, stem, headline
  e: [
    [[38, 45], [30, 54], [37, 66], [49, 67], [47, 54]],
    [[64, 42], [65, 80]],
    [[28, 37], [72, 37]],
  ],
  // ऐ : ए body + top accent stroke, stem, headline
  ai: [
    [[38, 48], [30, 57], [37, 68], [49, 69], [47, 57]],
    [[64, 44], [65, 80]],
    [[52, 27], [44, 41]],
    [[28, 37], [72, 37]],
  ],
  // ई : curved body, right stem with top hook, headline
  ii: [
    [[36, 55], [33, 45], [44, 41], [53, 48], [49, 59], [39, 60], [45, 70], [57, 71]],
    [[62, 41], [66, 37], [66, 62]],
    [[30, 37], [70, 37]],
  ],
  // ऋ : curl body, bottom hook tail, headline
  ri: [
    [[44, 42], [53, 41], [55, 51], [45, 56], [39, 63]],
    [[39, 63], [47, 71], [40, 82]],
    [[30, 37], [62, 37]],
  ],
  // औ : अ body, inner stem, au-matra (top-right), headline
  au: [
    [[40, 46], [30, 41], [24, 53], [31, 64], [42, 62], [45, 54]],
    [[45, 59], [60, 59]],
    [[62, 37], [62, 80]],
    [[74, 22], [82, 32], [76, 40]],
    [[22, 37], [82, 37]],
  ],
};

// distance from point (px,py) to a polyline (all in the same coordinate space)
function distToPolyline(px: number, py: number, poly: Stroke): number {
  let best = Infinity;
  for (let i = 0; i < poly.length - 1; i++) {
    const [ax, ay] = poly[i];
    const [bx, by] = poly[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    let t = ((px - ax) * dx + (py - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + t * dx;
    const cy = ay + t * dy;
    const d = Math.hypot(px - cx, py - cy);
    if (d < best) best = d;
  }
  if (poly.length === 1) best = Math.hypot(px - poly[0][0], py - poly[0][1]);
  return best;
}

// Assign a glyph point (nx,ny in 0..100) to a stroke. The last stroke is the
// headline (शिरोरेखा); it only claims the thin top band, so the tops of the body
// strokes aren't stolen by it. Everything else goes to the nearest body/stem.
export function segmentStroke(nx: number, ny: number, strokes: Stroke[]): number {
  const headline = strokes.length - 1;
  if (strokes.length >= 2 && ny < 15) return headline;
  let best = 0;
  let bestD = Infinity;
  const limit = strokes.length >= 2 ? headline : strokes.length; // exclude headline
  for (let i = 0; i < limit; i++) {
    const d = distToPolyline(nx, ny, strokes[i]);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}
