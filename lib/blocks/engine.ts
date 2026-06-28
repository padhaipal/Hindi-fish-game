// ---------------------------------------------------------------------------
// BLOCKS GAME — GRID ENGINE
// ---------------------------------------------------------------------------
// The board is a list of COLUMNS, each a stack of blocks bottom→top (index 0 =
// bottom). Gravity is straight down: removing a block lets the blocks above it
// fall (a plain array splice does exactly this).
//
// A word is two ADJACENT blocks that spell it:
//   - HORIZONTAL: same row, neighbouring columns, read left→right.
//   - VERTICAL:   same column, stacked, read top→bottom.
// (A full 5-wide grid can't be cleared with horizontal pairs alone, so vertical
// pairs are allowed too.) These rules MUST match the offline board generator
// (scripts/generate-boards.mjs) or winnability isn't guaranteed — keep in sync.
// ---------------------------------------------------------------------------

export interface Blk {
  id: number; // stable id (for React keys + slide animation)
  letterId: string;
}

export type Board = Blk[][]; // columns, index 0 = bottom

// An adjacent pair on the board: (c, L) is the anchor, `o` the orientation.
//   "h" -> blocks at (c, L) and (c+1, L)
//   "v" -> blocks at (c, L) [bottom] and (c, L+1) [top]
export interface Occ {
  c: number;
  L: number;
  o: "h" | "v";
}

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

// All occurrences of a word (by letter ids), horizontal + vertical.
export function occurrences(board: Board, letters: [string, string]): Occ[] {
  const out: Occ[] = [];
  // horizontal: (c,L) & (c+1,L), read left→right
  for (let c = 0; c < board.length - 1; c++) {
    const h = Math.min(board[c].length, board[c + 1].length);
    for (let L = 0; L < h; L++) {
      if (board[c][L].letterId === letters[0] && board[c + 1][L].letterId === letters[1]) {
        out.push({ c, L, o: "h" });
      }
    }
  }
  // vertical: (c,L+1)=top & (c,L)=bottom, read top→bottom
  for (let c = 0; c < board.length; c++) {
    for (let L = 0; L < board[c].length - 1; L++) {
      if (board[c][L + 1].letterId === letters[0] && board[c][L].letterId === letters[1]) {
        out.push({ c, L, o: "v" });
      }
    }
  }
  return out;
}

// Remove the pair described by `occ`; blocks above fall straight down.
export function removeOcc(board: Board, occ: Occ): Board {
  return board.map((col, idx) => {
    const next = col.slice();
    if (occ.o === "h") {
      if (idx === occ.c || idx === occ.c + 1) next.splice(occ.L, 1);
    } else if (idx === occ.c) {
      next.splice(occ.L, 2); // the stacked pair
    }
    return next;
  });
}

// The two block ids of an occurrence (e.g. to highlight them in the demo).
export function occBlocks(board: Board, occ: Occ): [number, number] {
  if (occ.o === "h") {
    return [board[occ.c][occ.L].id, board[occ.c + 1][occ.L].id];
  }
  return [board[occ.c][occ.L].id, board[occ.c][occ.L + 1].id];
}

// If two blocks form an adjacent pair (horizontal or vertical), return the
// letters in reading order plus the occurrence; otherwise null.
export function adjacentPair(
  board: Board,
  id1: number,
  id2: number
): { letters: [string, string]; occ: Occ } | null {
  const p1 = findBlock(board, id1);
  const p2 = findBlock(board, id2);
  if (!p1 || !p2) return null;

  // horizontal: same row, neighbouring columns → read left→right
  if (p1.L === p2.L && Math.abs(p1.c - p2.c) === 1) {
    const left = p1.c < p2.c ? p1 : p2;
    const right = p1.c < p2.c ? p2 : p1;
    return {
      letters: [board[left.c][left.L].letterId, board[right.c][right.L].letterId],
      occ: { c: left.c, L: left.L, o: "h" },
    };
  }
  // vertical: same column, stacked → read top→bottom
  if (p1.c === p2.c && Math.abs(p1.L - p2.L) === 1) {
    const top = p1.L > p2.L ? p1 : p2;
    const bottom = p1.L > p2.L ? p2 : p1;
    return {
      letters: [board[top.c][top.L].letterId, board[bottom.c][bottom.L].letterId],
      occ: { c: bottom.c, L: bottom.L, o: "v" },
    };
  }
  return null;
}
