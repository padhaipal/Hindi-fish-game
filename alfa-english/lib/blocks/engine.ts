// ---------------------------------------------------------------------------
// BLOCKS GAME — BOARD ENGINE (ALfA English)
// ---------------------------------------------------------------------------
// The board is a FIXED grid of cells addressed as board[row][col] with row 0 at
// the TOP. A cell is either a letter block { id, char } or `null` — a GAP. A gap
// is either a cell the level's mask removed (a missing corner) or a cell whose
// word has been solved and cleared. There is NO gravity: clearing a solved run
// just turns those cells into gaps; every other block stays exactly where it is.
// That keeps the mixed horizontal/vertical boards always solvable, because the
// words are placed as non-overlapping runs (see words.ts) and clearing one run
// can never disturb another.
//
// A word appears as a straight RUN of adjacent, non-gap blocks, spelled in order:
//   - HORIZONTAL: same row, consecutive columns, read left→right.
//   - VERTICAL:   same column, consecutive rows, read top→bottom.
// (This is an adaptation of the Hindi Blocks engine — nothing is imported from
// the Hindi app.)
// ---------------------------------------------------------------------------

export interface Blk {
  id: number;
  char: string; // a single lowercase letter
}
export type Cell = Blk | null; // null = a gap (masked-out or already cleared)
export type Board = Cell[][]; // board[row][col], row 0 = top

// A run: anchor (row, col) is the LEFT cell (horizontal) or the TOP cell
// (vertical); len is how many blocks long, read in that direction.
export interface Occ {
  row: number;
  col: number;
  o: "h" | "v";
  len: number;
}

// Build a board from a row-major char grid. An empty string ("" ) marks a gap;
// every other cell becomes a block with a unique id.
export function makeBoard(grid: string[][]): Board {
  let id = 0;
  return grid.map((row) => row.map((char) => (char === "" ? null : { id: id++, char })));
}

export function isEmpty(board: Board): boolean {
  return board.every((row) => row.every((cell) => cell === null));
}

// Locate a block by id → its (row, col).
export function findBlock(board: Board, id: number): { row: number; col: number } | null {
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col];
      if (cell && cell.id === id) return { row, col };
    }
  }
  return null;
}

// Clear the given block ids → those cells become gaps. Nothing else moves.
export function removeByIds(board: Board, ids: number[]): Board {
  const gone = new Set(ids);
  return board.map((row) => row.map((cell) => (cell && gone.has(cell.id) ? null : cell)));
}

// All occurrences of a word (given by its characters), horizontal + vertical.
export function occurrences(board: Board, chars: string[]): Occ[] {
  const k = chars.length;
  const out: Occ[] = [];
  const rows = board.length;
  const cols = rows ? board[0].length : 0;

  // horizontal: row r, columns c..c+k-1, read left→right
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c + k <= cols; c++) {
      let ok = true;
      for (let i = 0; i < k; i++) {
        const cell = board[r][c + i];
        if (!cell || cell.char !== chars[i]) { ok = false; break; }
      }
      if (ok) out.push({ row: r, col: c, o: "h", len: k });
    }
  }
  // vertical: col c, rows r..r+k-1, read top→bottom
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r + k <= rows; r++) {
      let ok = true;
      for (let i = 0; i < k; i++) {
        const cell = board[r + i][c];
        if (!cell || cell.char !== chars[i]) { ok = false; break; }
      }
      if (ok) out.push({ row: r, col: c, o: "v", len: k });
    }
  }
  return out;
}

// The block ids of a run, in reading order (for highlighting the demo hint).
export function occBlocks(board: Board, occ: Occ): number[] {
  const ids: number[] = [];
  for (let i = 0; i < occ.len; i++) {
    const cell = occ.o === "h" ? board[occ.row][occ.col + i] : board[occ.row + i][occ.col];
    if (cell) ids.push(cell.id);
  }
  return ids;
}

// Given block ids in TAP order, if they form a straight run read in order
// (left→right or top→bottom) over non-gap cells, return its chars + occurrence;
// else null.
export function runFromIds(board: Board, ids: number[]): { chars: string[]; occ: Occ } | null {
  const pos = ids.map((id) => findBlock(board, id));
  if (pos.some((p) => p === null)) return null;
  const p = pos as { row: number; col: number }[];
  const n = p.length;
  const chars = p.map(({ row, col }) => (board[row][col] as Blk).char);
  if (n === 1) return { chars, occ: { row: p[0].row, col: p[0].col, o: "h", len: 1 } };

  // horizontal: same row, columns increasing by 1 in tap order
  const horiz = p.every((q, i) => q.row === p[0].row && q.col === p[0].col + i);
  if (horiz) return { chars, occ: { row: p[0].row, col: p[0].col, o: "h", len: n } };

  // vertical: same column, rows increasing by 1 (top→bottom) in tap order
  const vert = p.every((q, i) => q.col === p[0].col && q.row === p[0].row + i);
  if (vert) return { chars, occ: { row: p[0].row, col: p[0].col, o: "v", len: n } };

  return null;
}
