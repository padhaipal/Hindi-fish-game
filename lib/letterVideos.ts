// ---------------------------------------------------------------------------
// LETTER VIDEOS
// ---------------------------------------------------------------------------
// Short animated clips that reinforce the picture↔letter association (e.g. a
// duck forming ब). The memory game plays one as the reward when a level is won,
// for the letter of the last matched pair (instead of applause). Letters with
// no video fall back to the applause sound, so the game never breaks.
//
// Drop a clip at /public/videos/<letterId>.mp4 and add its id below.
// ---------------------------------------------------------------------------

export const LETTER_VIDEOS = new Set<string>([
  "ba", "sa", "pa", "ra", "ta", "ka", "cha", "la", // all 8 letters
]);

export function hasLetterVideo(id: string): boolean {
  return LETTER_VIDEOS.has(id);
}

export function letterVideoSrc(id: string): string {
  return `/videos/${id}.mp4`;
}
