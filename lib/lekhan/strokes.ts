// ---------------------------------------------------------------------------
// LETTER STROKES — the ordered pen strokes for each of the 8 letters.
// ---------------------------------------------------------------------------
// Traced from the PadhaiPal stroke-order charts. Each stroke is a centreline
// polyline in a 0..100 box (x left→right, y top→bottom), drawn in the listed
// order and in the direction first→last point (that's the arrow). The trace
// level RENDERS these directly as thick round pen strokes (not the font), so the
// letter on screen matches the chart, and highlights one stroke at a time:
// red = current, light grey = upcoming, green = completed.
// ---------------------------------------------------------------------------

export type Stroke = [number, number][];

export const LETTER_STROKES: Record<string, Stroke[]> = {
  // र — body hook, then headline
  ra: [
    [[50, 24], [55, 36], [69, 41], [52, 49], [47, 63], [40, 86]],
    [[34, 21], [72, 21]],
  ],
  // प — left U-body, right stem, headline
  pa: [
    [[35, 24], [30, 45], [35, 63], [51, 67], [59, 54], [55, 41]],
    [[79, 21], [79, 87]],
    [[28, 21], [83, 21]],
  ],
  // क — central stem, left loop body, headline
  ka: [
    [[60, 21], [60, 87]],
    [[59, 45], [47, 33], [31, 43], [33, 62], [49, 66], [58, 52]],
    [[26, 21], [80, 21]],
  ],
  // ब — right stem, bowl+belly body, headline
  ba: [
    [[77, 21], [77, 87]],
    [[72, 43], [41, 32], [27, 48], [33, 68], [56, 75], [72, 62], [41, 53]],
    [[24, 21], [81, 21]],
  ],
  // स — S-curl body, small link, right stem, headline
  sa: [
    [[45, 24], [32, 33], [41, 45], [30, 55], [24, 71], [35, 86]],
    [[35, 64], [53, 69]],
    [[75, 21], [75, 87]],
    [[20, 21], [79, 21]],
  ],
  // च — right stem, cup body, headline
  cha: [
    [[70, 21], [70, 87]],
    [[61, 48], [46, 38], [30, 50], [34, 70], [53, 78], [65, 65]],
    [[28, 21], [74, 21]],
  ],
  // त — right stem, top hook + down-curl, headline
  ta: [
    [[68, 21], [68, 87]],
    [[67, 50], [41, 49], [27, 58], [31, 74], [45, 81]],
    [[26, 21], [72, 21]],
  ],
  // ल — body curl + loop, right stem, headline
  la: [
    [[41, 24], [30, 34], [39, 46], [48, 40], [41, 55], [34, 69], [49, 77], [63, 70]],
    [[75, 21], [75, 87]],
    [[26, 21], [79, 21]],
  ],
};

// distance from a point to a polyline (all in the same coordinate space)
export function distToPolyline(px: number, py: number, poly: Stroke): number {
  if (poly.length === 1) return Math.hypot(px - poly[0][0], py - poly[0][1]);
  let best = Infinity;
  for (let i = 0; i < poly.length - 1; i++) {
    const [ax, ay] = poly[i];
    const [bx, by] = poly[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    let t = ((px - ax) * dx + (py - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    if (d < best) best = d;
  }
  return best;
}
