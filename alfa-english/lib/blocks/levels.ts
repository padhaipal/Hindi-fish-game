// ---------------------------------------------------------------------------
// BLOCKS GAME — LEVELS (ALfA English)
// ---------------------------------------------------------------------------
// Five levels of growing board SHAPES. A board is a rows×cols grid with some
// corner cells REMOVED (gaps). `remove` lists the [row, col] cells that are cut
// out, with row 0 at the TOP. `words` is how many whole 3-letter words are
// placed as contiguous straight runs (the rest of the valid cells get random
// filler letters — see words.ts). Each level has its own soft background.
//
//   L1: 3×3  (all 9 cells)                         — 2 words
//   L2: 3×4  (all 12 cells)                        — 3 words
//   L3: 3×5  (all 15 cells)                        — 4 words
//   L4: 4×5  minus top-left + top-right (18 cells) — 4 words
//   L5: 5×5  minus top-left       (24 cells)       — 5 words
// ---------------------------------------------------------------------------

export interface BlockLevel {
  rows: number;
  cols: number;
  remove: [number, number][]; // gap cells [row, col], row 0 = top
  words: number; // whole words placed as straight runs
  bg: string;
}

export const LEVELS: BlockLevel[] = [
  { rows: 3, cols: 3, remove: [], words: 2, bg: "linear-gradient(#e8ffe9 0%, #b8f0c0 55%, #8fe0a0 100%)" },
  { rows: 3, cols: 4, remove: [], words: 3, bg: "linear-gradient(#e9f7ff 0%, #bfe6ff 55%, #93d4f5 100%)" },
  { rows: 3, cols: 5, remove: [], words: 4, bg: "linear-gradient(#fff0e6 0%, #ffd9bf 55%, #ffbf95 100%)" },
  { rows: 4, cols: 5, remove: [[0, 0], [0, 4]], words: 4, bg: "linear-gradient(#f1e9ff 0%, #d9c9ff 55%, #b79bf0 100%)" },
  { rows: 5, cols: 5, remove: [[0, 0]], words: 5, bg: "linear-gradient(#ffe9f1 0%, #ffc9dd 55%, #ff9bbf 100%)" },
];

// The boolean cell mask for a level: true = a real cell, false = a gap.
export function levelMask(lvl: BlockLevel): boolean[][] {
  const mask = Array.from({ length: lvl.rows }, () =>
    Array.from({ length: lvl.cols }, () => true)
  );
  for (const [r, c] of lvl.remove) mask[r][c] = false;
  return mask;
}
