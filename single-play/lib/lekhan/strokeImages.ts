// ---------------------------------------------------------------------------
// STROKE-CHART IMAGES
// ---------------------------------------------------------------------------
// Letters whose stroke-order guide (letter + numbered direction arrows) has
// been cropped from the ALfA chart into /public/lekhan/strokes/<id>.png.
// The writing game's Level 1 uses that image (see ChartSlate) when available,
// and falls back to the drawn guide (GuidedSlate) otherwise.
// ---------------------------------------------------------------------------

export const STROKE_IMAGES = new Set<string>([
  // vowels (ऐ and अं aren't cleanly on the chart -> they use the drawn guide)
  "a", "aa", "ii", "u", "uu", "ri", "e", "au",
  // consonants (all)
  "ka", "kha", "ga", "gha", "cha", "chha", "ja", "jha",
  "tta", "ttha", "dda", "ta", "tha", "da", "dha", "na",
  "pa", "pha", "ba", "bha", "ma", "ya", "ra", "la",
  "va", "sha", "shha", "sa", "ha",
]);

export function hasStrokeImage(letterId: string): boolean {
  return STROKE_IMAGES.has(letterId);
}

export function strokeImageSrc(letterId: string): string {
  return `/lekhan/strokes/${letterId}.png`;
}
