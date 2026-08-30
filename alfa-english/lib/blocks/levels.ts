// ---------------------------------------------------------------------------
// BLOCKS GAME — LEVELS (ALfA English)
// ---------------------------------------------------------------------------
// Five levels of growing board sizes. A board is now a FULL rows×cols rectangle
// (no removed corners) that is packed almost entirely with whole 3-letter words
// laid down as contiguous straight runs; `words` is how many go on the board and
// any one leftover cell gets a random filler letter (see words.ts). Because the
// board has GRAVITY, the words are generated together with a proven gravity-safe
// solve order and cued in that order. Each level has its own soft background.
//
//   L1: 3×3  (9 cells)   — 2 words  (6 letters + 3 filler)
//   L2: 3×4  (12 cells)  — 3 words  (9 letters + 3 filler)
//   L3: 3×5  (15 cells)  — 4 words  (12 letters + 3 filler)
//   L4: 4×5  (20 cells)  — 6 words  (18 letters + 2 filler)
//   L5: 5×5  (25 cells)  — 8 words  (24 letters + 1 filler)
// ---------------------------------------------------------------------------

export interface BlockLevel {
  rows: number;
  cols: number;
  words: number; // whole words placed as straight runs
  bg: string;
}

export const LEVELS: BlockLevel[] = [
  { rows: 3, cols: 3, words: 2, bg: "linear-gradient(#e8ffe9 0%, #b8f0c0 55%, #8fe0a0 100%)" },
  { rows: 3, cols: 4, words: 3, bg: "linear-gradient(#e9f7ff 0%, #bfe6ff 55%, #93d4f5 100%)" },
  { rows: 3, cols: 5, words: 4, bg: "linear-gradient(#fff0e6 0%, #ffd9bf 55%, #ffbf95 100%)" },
  { rows: 4, cols: 5, words: 6, bg: "linear-gradient(#f1e9ff 0%, #d9c9ff 55%, #b79bf0 100%)" },
  { rows: 5, cols: 5, words: 8, bg: "linear-gradient(#ffe9f1 0%, #ffc9dd 55%, #ff9bbf 100%)" },
];
