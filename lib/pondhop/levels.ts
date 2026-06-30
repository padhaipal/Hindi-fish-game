// ---------------------------------------------------------------------------
// POND HOP — LEVEL CONFIG
// ---------------------------------------------------------------------------
// A character crosses a river by hopping only on stones that show the TARGET
// letter. Each level uses ONE target letter (a different one per level, in a
// random order per game). Difficulty ramps by using MORE and SMALLER stones.
//
// `targets` is the number of target-letter stones = the number of hops needed
// to cross (the path length). `stones` is the TOTAL number of stones on screen
// (targets + distractors). Stones are laid out in `targets` rows; the child
// hops from the near bank up to the far bank, one row at a time.
// ---------------------------------------------------------------------------

export interface HopLevel {
  stones: number; // total stones on screen
  targets: number; // target-letter stones = rows = hops to cross
  timeSeconds: number; // crossing time before the timer bar runs out
  stoneSize: number; // px — stones get smaller as levels progress
  bg: string; // water background (a different tint per level)
}

export const HOP_LEVELS: HopLevel[] = [
  { stones: 8, targets: 3, timeSeconds: 16, stoneSize: 62, bg: "linear-gradient(#bfefff 0%, #74c8f0 100%)" },
  { stones: 12, targets: 4, timeSeconds: 20, stoneSize: 54, bg: "linear-gradient(#bdeede 0%, #57c2a6 100%)" },
  { stones: 16, targets: 5, timeSeconds: 25, stoneSize: 48, bg: "linear-gradient(#cfe0ff 0%, #7ba6ee 100%)" },
  { stones: 20, targets: 6, timeSeconds: 30, stoneSize: 44, bg: "linear-gradient(#d8d2ff 0%, #9385ee 100%)" },
  { stones: 24, targets: 7, timeSeconds: 35, stoneSize: 40, bg: "linear-gradient(#bfe9ff 0%, #5bb0e8 100%)" },
];

export const TOTAL_HOP_LEVELS = HOP_LEVELS.length;
