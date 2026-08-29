// ---------------------------------------------------------------------------
// BLOCKS GAME — LEVELS (ALfA English)
// ---------------------------------------------------------------------------
// Five levels of growing grids. Each level fills a full rectangular board with
// N whole words (3 letters each), so cols*rows always equals words*3:
//   Lvl 1: 3x1 (1 word)   Lvl 2: 3x2 (2 words)   Lvl 3: 3x3 (3 words)
//   Lvl 4: 4x3 (4 words)  Lvl 5: 5x3 (5 words — the biggest board).
// Each level carries its own soft background gradient for variety.
// ---------------------------------------------------------------------------

export interface BlockLevel {
  cols: number;
  rows: number;
  words: number; // whole words placed on the board
  bg: string;
}

export const LEVELS: BlockLevel[] = [
  { cols: 3, rows: 1, words: 1, bg: "linear-gradient(#e8ffe9 0%, #b8f0c0 55%, #8fe0a0 100%)" },
  { cols: 3, rows: 2, words: 2, bg: "linear-gradient(#e9f7ff 0%, #bfe6ff 55%, #93d4f5 100%)" },
  { cols: 3, rows: 3, words: 3, bg: "linear-gradient(#fff0e6 0%, #ffd9bf 55%, #ffbf95 100%)" },
  { cols: 4, rows: 3, words: 4, bg: "linear-gradient(#f1e9ff 0%, #d9c9ff 55%, #b79bf0 100%)" },
  { cols: 5, rows: 3, words: 5, bg: "linear-gradient(#ffe9f1 0%, #ffc9dd 55%, #ff9bbf 100%)" },
];
