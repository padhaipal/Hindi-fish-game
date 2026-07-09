// ---------------------------------------------------------------------------
// STROKE-CHART IMAGES
// ---------------------------------------------------------------------------
// Letters whose stroke-order guide (letter + numbered direction arrows) has
// been cropped from the ALfA chart into /public/lekhan/strokes/<id>.png.
// The writing game's Level 1 uses that image (see ChartSlate) when available,
// and falls back to the drawn guide (GuidedSlate) otherwise.
// ---------------------------------------------------------------------------

export const STROKE_IMAGES = new Set<string>([
  // page 1
  "ba", "sa", "pa", "ra", "a", "gha", "ta", "ka", "cha", "la",
]);

export function hasStrokeImage(letterId: string): boolean {
  return STROKE_IMAGES.has(letterId);
}

export function strokeImageSrc(letterId: string): string {
  return `/lekhan/strokes/${letterId}.png`;
}
