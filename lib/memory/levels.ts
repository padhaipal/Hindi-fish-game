// ---------------------------------------------------------------------------
// MEMORY GAME — LEVELS
// ---------------------------------------------------------------------------
// Match each PICTURE card with its LETTER card. Levels grow the grid; each has
// its own background colour. A "move" is one turn (flipping two cards). You get
// a generous `cols * rows` moves (= 2x the number of pairs) to clear the board.
//
//   Lvl 1: 3x2  (6 cards,  3 pairs,  6 moves)
//   Lvl 2: 4x2  (8 cards,  4 pairs,  8 moves)
//   Lvl 3: 4x3  (12 cards, 6 pairs, 12 moves)
//   Lvl 4: 4x4  (16 cards, 8 pairs, 16 moves — all 8 letters)
// ---------------------------------------------------------------------------

export interface MemoryLevel {
  cols: number;
  rows: number;
  bg: string; // CSS background for this level
}

export const MEMORY_LEVELS: MemoryLevel[] = [
  { cols: 3, rows: 2, bg: "linear-gradient(#e8ffe9 0%, #b8f0c0 55%, #8fe0a0 100%)" },
  { cols: 4, rows: 2, bg: "linear-gradient(#e9f7ff 0%, #bfe6ff 55%, #93d4f5 100%)" },
  { cols: 4, rows: 3, bg: "linear-gradient(#f1e9ff 0%, #d6c2ff 55%, #b79bf0 100%)" },
  { cols: 4, rows: 4, bg: "linear-gradient(#fff0db 0%, #ffd9a8 55%, #ffc078 100%)" },
];
