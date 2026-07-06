// ---------------------------------------------------------------------------
// BLOCKS GAME — GRID ENGINE (variable-length word runs)
// ---------------------------------------------------------------------------
// The board is a list of COLUMNS, each a stack of blocks bottom→top (index 0 =
// bottom). Gravity is straight down: removing blocks lets those above fall.
//
// A word is a straight RUN of 2–4 adjacent blocks:
//   - HORIZONTAL: same row, consecutive columns, read left→right.
//   - VERTICAL:   same column, stacked, read top→bottom.
// These rules MUST match the board generator (scripts/generate-boards.mjs).
// ---------------------------------------------------------------------------

export interface Blk {
  id: number;
  letterId: string;
}
export type Board = Blk[][]; // columns, index 0 = bottom

// A run: anchor (c, L) is the LEFT cell (horizontal) or BOTTOM cell (vertical).
export interface Occ {
  c: number;
  L: number;
  o: "h" | "v";
  len: number;
}

export function makeBoard(cols: string[][]): Board {
  let id = 0;
  return cols.map((col) => col.map((letterId) => ({ id: id++, letterId })));
}

export function isEmpty(board: Board): boolean {
  return board.every((col) => col.length === 0);
}

export function findBlock(board: Board, id: number): { c: number; L: number } | null {
  for (let c = 0; c < board.length; c++) {
    const L = board[c].findIndex((b) => b.id === id);
    if (L >= 0) return { c, L };
  }
  return null;
}

// All occurrences of a word (given by its letter ids), horizontal + vertical.
export function occurrences(board: Board, letters: string[]): Occ[] {
  const k = letters.length;
  const out: Occ[] = [];
  const cols = board.length;
  // horizontal at row L
  for (let c0 = 0; c0 + k <= cols; c0++) {
    const maxL = Math.min(...Array.from({ length: k }, (_, i) => board[c0 + i].length));
    for (let L = 0; L < maxL; L++) {
      let ok = true;
      for (let i = 0; i < k; i++) if (board[c0 + i][L].letterId !== letters[i]) { ok = false; break; }
      if (ok) out.push({ c: c0, L, o: "h", len: k });
    }
  }
  // vertical, read top→bottom
  for (let c = 0; c < cols; c++) {
    for (let L0 = 0; L0 + k <= board[c].length; L0++) {
      let ok = true;
      for (let i = 0; i < k; i++) if (board[c][L0 + k - 1 - i].letterId !== letters[i]) { ok = false; break; }
      if (ok) out.push({ c, L: L0, o: "v", len: k });
    }
  }
  return out;
}

// Remove the run's blocks; blocks above fall straight down.
export function removeOcc(board: Board, occ: Occ): Board {
  return board.map((col, idx) => {
    const next = col.slice();
    if (occ.o === "h") {
      if (idx >= occ.c && idx < occ.c + occ.len) next.splice(occ.L, 1);
    } else if (idx === occ.c) {
      next.splice(occ.L, occ.len);
    }
    return next;
  });
}

// The block ids of a run, in reading order (for highlighting / clearing).
export function occBlocks(board: Board, occ: Occ): number[] {
  const ids: number[] = [];
  if (occ.o === "h") {
    for (let i = 0; i < occ.len; i++) ids.push(board[occ.c + i][occ.L].id);
  } else {
    for (let i = 0; i < occ.len; i++) ids.push(board[occ.c][occ.L + occ.len - 1 - i].id); // top→bottom
  }
  return ids;
}

// Given block ids in TAP order, if they form a straight run read in order
// (left→right or top→bottom), return its letters + occurrence; else null.
export function runFromIds(board: Board, ids: number[]): { letters: string[]; occ: Occ } | null {
  const pos = ids.map((id) => findBlock(board, id));
  if (pos.some((p) => p === null)) return null;
  const p = pos as { c: number; L: number }[];
  const n = p.length;
  const letters = p.map(({ c, L }) => board[c][L].letterId);
  if (n === 1) return { letters, occ: { c: p[0].c, L: p[0].L, o: "h", len: 1 } };

  // horizontal: same row, columns increasing by 1 in tap order
  const horiz = p.every((q, i) => q.L === p[0].L && q.c === p[0].c + i);
  if (horiz) return { letters, occ: { c: p[0].c, L: p[0].L, o: "h", len: n } };

  // vertical: same column, rows decreasing by 1 (top→bottom) in tap order
  const vert = p.every((q, i) => q.c === p[0].c && q.L === p[0].L - i);
  if (vert) return { letters, occ: { c: p[0].c, L: p[n - 1].L, o: "v", len: n } };

  return null;
}
