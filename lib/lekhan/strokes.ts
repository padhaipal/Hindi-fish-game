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
