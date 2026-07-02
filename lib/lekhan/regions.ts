// ---------------------------------------------------------------------------
// LETTER REGIONS — how each letter is split into ordered writing "strokes".
// ---------------------------------------------------------------------------
// Rather than hand-drawing (often wrong) letter curves, the trace level keeps
// the accurate FONT glyph and highlights it one region at a time, in writing
// order: the letter BODY first, then the vertical STEM (खड़ी पाई), then the top
// HEADLINE (शिरोरेखा) last — the common teaching order.
//
// Regions are decided from a pixel's position within the glyph's bounding box
// (nx, ny in 0..1). The headline is the thin top band; the stem is a vertical
// column (its x-range differs per letter; some letters have none); everything
// else below the headline is the body.
// ---------------------------------------------------------------------------

export type RegionKey = "body" | "stem" | "headline";

export const HEADLINE_MAXY = 0.22; // top band of the glyph = the headline

// Stem x-range (as a fraction of the glyph width), or null if the letter has no
// separate vertical stem (र and त are written without one).
export const LETTER_STEM: Record<string, [number, number] | null> = {
  ba: [0.72, 1.01],
  sa: [0.72, 1.01],
  pa: [0.72, 1.01],
  ra: null,
  ta: null,
  ka: [0.46, 0.68],
  cha: [0.72, 1.01],
  la: [0.72, 1.01],
};

export function regionOrder(letterId: string): RegionKey[] {
  return LETTER_STEM[letterId] ? ["body", "stem", "headline"] : ["body", "headline"];
}

export function regionOfCell(nx: number, ny: number, letterId: string): RegionKey {
  if (ny < HEADLINE_MAXY) return "headline";
  const stem = LETTER_STEM[letterId];
  if (stem && nx >= stem[0] && nx <= stem[1]) return "stem";
  return "body";
}
