// ---------------------------------------------------------------------------
// BLOCKS GAME — GRID ENGINE
// ---------------------------------------------------------------------------
// The board is a list of COLUMNS, each a stack of blocks bottom→top (index 0 =
// bottom). Gravity is straight down: removing a block from a column lets the
// blocks above fall by one (a plain array splice does exactly this).
//
// A word is two HORIZONTALLY adjacent blocks: same level (row), neighbouring
// columns, read left→right. This MUST match the rules used by the offline board
// generator (scripts/generate-boards.mjs), otherwise winnability isn't
// guaranteed — so keep the two in sync.
// ---------------------------------------------------------------------------

export interface Blk {
  id: number; // stable id (for React keys + slide animation)
  letterId: string;
}

export type Board = Blk[][]; // columns, index 0 = bottom

// Build a live board (with stable block ids) from raw letter-id columns.
export function makeBoard(cols: string[][]): Board {
  let id = 0;
  return cols.map((col) => col.map((letterId) => ({ id: id++, letterId })));
}

export function isEmpty(board: Board): boolean {
  return board.every((col) => col.length === 0);
}

export function totalBlocks(board: Board): number {
  return board.reduce((sum, col) => sum + col.length, 0);
}

// Where is block `id`? Returns {c, L} (column, level) or null.
export function findBlock(board: Board, id: number): { c: number; L: number } | null {
  for (let c = 0; c < board.length; c++) {
    const L = board[c].findIndex((b) => b.id === id);
    if (L >= 0) return { c, L };
  }
  return null;
}

// Remove the pair at (c, L) and (c+1, L); blocks above fall straight down.
export function removeAt(board: Board, c: number, L: number): Board {
  return board.map((col, idx) => {
    const next = col.slice();
    if (idx === c || idx === c + 1) next.splice(L, 1);
    return next;
  });
}

// If two blocks are a horizontally-adjacent pair, return them ordered
// left→right (with the left column index + level); otherwise null.
export function adjacentPair(
  board: Board,
  id1: number,
  id2: number
): { left: Blk; right: Blk; c: number; L: number } | null {
  const p1 = findBlock(board, id1);
  const p2 = findBlock(board, id2);
  if (!p1 || !p2) return null;
  if (p1.L !== p2.L) return null; // must be on the same level
  if (Math.abs(p1.c - p2.c) !== 1) return null; // must be neighbours
  const leftPos = p1.c < p2.c ? p1 : p2;
  const rightPos = p1.c < p2.c ? p2 : p1;
  return {
    left: board[leftPos.c][leftPos.L],
    right: board[rightPos.c][rightPos.L],
    c: leftPos.c,
    L: leftPos.L,
  };
}
