// ---------------------------------------------------------------------------
// BLOCKS GAME — BOARD ENGINE (ALfA English)
// ---------------------------------------------------------------------------
// The board is a list of COLUMNS, each a stack of blocks bottom→top (index 0 =
// bottom). Gravity is straight down: removing blocks lets those above fall.
//
// This is a simplified adaptation of the Hindi Blocks engine: instead of
// requiring letters to sit in an adjacent RUN, the child taps the word's letters
// in order anywhere on the board, so the engine only needs board building,
// lookup and gravity. (Copied/simplified here — nothing is imported from the
// Hindi app.)
// ---------------------------------------------------------------------------

export interface Blk {
  id: number;
  char: string; // a single lowercase letter
}
export type Board = Blk[][]; // columns, index 0 = bottom

// Build a board from a column/char grid. Each block gets a unique id.
export function makeBoard(cols: string[][]): Board {
  let id = 0;
  return cols.map((col) => col.map((char) => ({ id: id++, char })));
}

export function isEmpty(board: Board): boolean {
  return board.every((col) => col.length === 0);
}

// Locate a block by id → its column (c) and level (L, 0 = bottom).
export function findBlock(board: Board, id: number): { c: number; L: number } | null {
  for (let c = 0; c < board.length; c++) {
    const L = board[c].findIndex((b) => b.id === id);
    if (L >= 0) return { c, L };
  }
  return null;
}

// Remove the given block ids; blocks above fall straight down (filtering a
// column keeps it bottom-packed, which IS gravity).
export function removeByIds(board: Board, ids: number[]): Board {
  const gone = new Set(ids);
  return board.map((col) => col.filter((b) => !gone.has(b.id)));
}

// Greedily pick the blocks that spell `word`, one distinct block per letter in
// order (used only for the first-word demo hint). Returns null if the word is
// not fully present on the board.
export function spellBlocks(board: Board, word: string): { id: number; c: number; L: number }[] | null {
  const used = new Set<number>();
  const out: { id: number; c: number; L: number }[] = [];
  for (const ch of word) {
    let found: { id: number; c: number; L: number } | null = null;
    for (let c = 0; c < board.length && !found; c++) {
      for (let L = 0; L < board[c].length; L++) {
        const blk = board[c][L];
        if (blk.char === ch && !used.has(blk.id)) {
          found = { id: blk.id, c, L };
          break;
        }
      }
    }
    if (!found) return null;
    used.add(found.id);
    out.push(found);
  }
  return out;
}
