// ---------------------------------------------------------------------------
// BLOCKS GAME — BOARD ENGINE (ALfA English)
// ---------------------------------------------------------------------------
// The board is a list of COLUMNS, each a stack of blocks bottom→top (index 0 =
// bottom). Gravity is straight down: removing blocks lets those above fall.
//
// A word must appear as a straight RUN of adjacent blocks and be spelled in
// order:
//   - HORIZONTAL: same row, consecutive columns, read left→right.
//   - VERTICAL:   same column, stacked, read top→bottom.
// These rules match the board generator in words.ts. (This is an adaptation of
// the Hindi Blocks engine — nothing is imported from the Hindi app.)
// ---------------------------------------------------------------------------

export interface Blk {
  id: number;
  char: string; // a single lowercase letter
}
export type Board = Blk[][]; // columns, index 0 = bottom

// A run: anchor (c, L) is the LEFT cell (horizontal) or BOTTOM cell (vertical).
export interface Occ {
  c: number;
  L: number;
  o: "h" | "v";
  len: number;
}

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

// All occurrences of a word (given by its characters), horizontal + vertical.
export function occurrences(board: Board, chars: string[]): Occ[] {
  const k = chars.length;
  const out: Occ[] = [];
  const cols = board.length;
  // horizontal at row L: consecutive columns, read left→right
  for (let c0 = 0; c0 + k <= cols; c0++) {
    const maxL = Math.min(...Array.from({ length: k }, (_, i) => board[c0 + i].length));
    for (let L = 0; L < maxL; L++) {
      let ok = true;
      for (let i = 0; i < k; i++) if (board[c0 + i][L].char !== chars[i]) { ok = false; break; }
      if (ok) out.push({ c: c0, L, o: "h", len: k });
    }
  }
  // vertical in a column, read top→bottom
  for (let c = 0; c < cols; c++) {
    for (let L0 = 0; L0 + k <= board[c].length; L0++) {
      let ok = true;
      for (let i = 0; i < k; i++) if (board[c][L0 + k - 1 - i].char !== chars[i]) { ok = false; break; }
      if (ok) out.push({ c, L: L0, o: "v", len: k });
    }
  }
  return out;
}

// The block ids of a run, in reading order (for highlighting the demo hint).
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
// (left→right or top→bottom), return its chars + occurrence; else null.
export function runFromIds(board: Board, ids: number[]): { chars: string[]; occ: Occ } | null {
  const pos = ids.map((id) => findBlock(board, id));
  if (pos.some((p) => p === null)) return null;
  const p = pos as { c: number; L: number }[];
  const n = p.length;
  const chars = p.map(({ c, L }) => board[c][L].char);
  if (n === 1) return { chars, occ: { c: p[0].c, L: p[0].L, o: "h", len: 1 } };

  // horizontal: same row, columns increasing by 1 in tap order
  const horiz = p.every((q, i) => q.L === p[0].L && q.c === p[0].c + i);
  if (horiz) return { chars, occ: { c: p[0].c, L: p[0].L, o: "h", len: n } };

  // vertical: same column, rows decreasing by 1 (top→bottom) in tap order
  const vert = p.every((q, i) => q.c === p[0].c && q.L === p[0].L - i);
  if (vert) return { chars, occ: { c: p[0].c, L: p[n - 1].L, o: "v", len: n } };

  return null;
}
