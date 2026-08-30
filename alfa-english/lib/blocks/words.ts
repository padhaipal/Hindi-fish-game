// ---------------------------------------------------------------------------
// BLOCKS GAME — WORD POOL & GRAVITY-SAFE BOARD GENERATOR (ALfA English)
// ---------------------------------------------------------------------------
// A curated set of short, decodable 3-letter CVC words drawn from the shared
// CVC_WORDS list (so the pictures match the rest of the app).
//
// The generator packs a FULL rows×cols rectangle almost entirely with those
// words, each laid as a contiguous straight run — a MIX of horizontal (left→
// right) and vertical (top→bottom) where possible — plus at most a couple of
// random filler letters. The board now has GRAVITY (clearing a word drops the
// blocks above it, per column), which can re-align the other words. So a board
// is only accepted together with a proven GRAVITY-SAFE SOLVE ORDER:
//
//   findOrder() searches over orderings of the placed words such that, at each
//   step, the next word is CURRENTLY present as exactly one contiguous straight
//   run — remove it, apply gravity, and recurse — until every word is cleared.
//   Requiring EXACTLY ONE occurrence at each step makes the player's removal
//   deterministic (they can only tap that one run), so the real game reproduces
//   the simulated sequence cell-for-cell and the cued word is always spellable.
//
// buildSolvableBoard() retries random packings until one yields a full-clear
// order, preferring a mix of horizontal & vertical runs. The game then cues the
// words in the returned order. (Adapted from the Hindi Blocks engine — nothing
// is imported from the Hindi app.)
// ---------------------------------------------------------------------------

import { CVC_WORDS, type CvcWord } from "@/lib/lessons";

const WORD_LEN = 3; // every CVC word is 3 letters

// The words used in this game (all have a clear emoji in the shared CVC_WORDS).
const USE = [
  "cat", "dog", "fox", "hen", "bat",
  "bag", "jet", "jam", "bed", "cap",
  "box", "sun", "bus", "cup", "nut",
];

export const BLOCK_WORDS: CvcWord[] = Array.from(new Set(USE))
  .map((w) => CVC_WORDS.find((c) => c.word === w))
  .filter((w): w is CvcWord => Boolean(w));

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const FILLER = "abcdefghijklmnoprstuvwy".split(""); // no q/x/z — friendlier fillers

function randFiller(): string {
  return FILLER[Math.floor(Math.random() * FILLER.length)];
}

// Pick `n` distinct random words for a board.
export function pickWords(n: number): CvcWord[] {
  return shuffle(BLOCK_WORDS).slice(0, n);
}

// ---------------------------------------------------------------------------
// PACKING — fit K non-overlapping straight 3-runs into the rectangle
// ---------------------------------------------------------------------------
// A slot is one straight WORD_LEN run of cells; which word sits in it is decided
// later, so packing only needs a set of K mutually non-overlapping slots.

interface Slot {
  row: number; // anchor: left cell (h) or top cell (v)
  col: number;
  o: "h" | "v";
  cells: number[]; // flat cell indices (row * cols + col) the run covers
}

function allSlots(rows: number, cols: number): Slot[] {
  const slots: Slot[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c + WORD_LEN <= cols; c++) {
      const cells: number[] = [];
      for (let i = 0; i < WORD_LEN; i++) cells.push(r * cols + (c + i));
      slots.push({ row: r, col: c, o: "h", cells });
    }
  }
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r + WORD_LEN <= rows; r++) {
      const cells: number[] = [];
      for (let i = 0; i < WORD_LEN; i++) cells.push((r + i) * cols + c);
      slots.push({ row: r, col: c, o: "v", cells });
    }
  }
  return slots;
}

// Randomised backtracking search for K mutually non-overlapping slots.
function findPacking(rows: number, cols: number, k: number): Slot[] | null {
  const slots = allSlots(rows, cols);
  const occupied = new Array<boolean>(rows * cols).fill(false);
  const chosen: Slot[] = [];

  const rec = (need: number): boolean => {
    if (need === 0) return true;
    const free = shuffle(slots.filter((s) => s.cells.every((k2) => !occupied[k2])));
    for (const s of free) {
      for (const k2 of s.cells) occupied[k2] = true;
      chosen.push(s);
      if (rec(need - 1)) return true;
      chosen.pop();
      for (const k2 of s.cells) occupied[k2] = false;
    }
    return false;
  };

  return rec(k) ? chosen.slice() : null;
}

// ---------------------------------------------------------------------------
// CHAR-GRID SIMULATION — used to prove a gravity-safe solve order
// ---------------------------------------------------------------------------
// A char grid mirrors the board: "" is a gap, otherwise a single letter. These
// helpers must stay in lockstep with engine.ts (occurrences + applyGravity).

type CharGrid = string[][];

// Per-column gravity on a char grid (mirrors engine.applyGravity).
function gravityGrid(grid: CharGrid): CharGrid {
  const rows = grid.length;
  const cols = rows ? grid[0].length : 0;
  const out: CharGrid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => "")
  );
  for (let c = 0; c < cols; c++) {
    let write = rows - 1;
    for (let r = rows - 1; r >= 0; r--) {
      if (grid[r][c] !== "") {
        out[write][c] = grid[r][c];
        write--;
      }
    }
  }
  return out;
}

interface GridOcc {
  row: number;
  col: number;
  o: "h" | "v";
}

// Every horizontal (left→right) / vertical (top→bottom) occurrence of `word`.
function occurrencesInGrid(grid: CharGrid, word: string): GridOcc[] {
  const rows = grid.length;
  const cols = rows ? grid[0].length : 0;
  const k = word.length;
  const out: GridOcc[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c + k <= cols; c++) {
      let ok = true;
      for (let i = 0; i < k; i++) if (grid[r][c + i] !== word[i]) { ok = false; break; }
      if (ok) out.push({ row: r, col: c, o: "h" });
    }
  }
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r + k <= rows; r++) {
      let ok = true;
      for (let i = 0; i < k; i++) if (grid[r + i][c] !== word[i]) { ok = false; break; }
      if (ok) out.push({ row: r, col: c, o: "v" });
    }
  }
  return out;
}

// Clear an occurrence's cells (→ "") on a copy of the grid.
function clearOcc(grid: CharGrid, occ: GridOcc, len: number): CharGrid {
  const out = grid.map((row) => row.slice());
  for (let i = 0; i < len; i++) {
    const r = occ.o === "v" ? occ.row + i : occ.row;
    const c = occ.o === "h" ? occ.col + i : occ.col;
    out[r][c] = "";
  }
  return out;
}

// DFS for a full-clear order: at each step pick a still-unsolved word that has
// EXACTLY ONE occurrence (so its removal is unambiguous), remove it, drop the
// board with gravity, and recurse. Returns the word order or null.
function findOrder(grid: CharGrid, words: string[]): string[] | null {
  if (words.length === 0) return [];
  for (const w of shuffle(words)) {
    const occs = occurrencesInGrid(grid, w);
    if (occs.length !== 1) continue; // 0 = not spellable now; >1 = ambiguous — skip
    const dropped = gravityGrid(clearOcc(grid, occs[0], w.length));
    const rest = findOrder(dropped, words.filter((x) => x !== w));
    if (rest) return [w, ...rest];
  }
  return null;
}

// ---------------------------------------------------------------------------
// BOARD BUILD
// ---------------------------------------------------------------------------

// Assign shuffled words to a packing's slots and paint them onto a char grid;
// every other cell (the one or two leftovers) gets a random filler letter.
function paint(rows: number, cols: number, packing: Slot[], words: string[]): CharGrid {
  const grid: CharGrid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => randFiller())
  );
  const order = shuffle(words);
  packing.forEach((slot, si) => {
    const word = order[si];
    for (let i = 0; i < WORD_LEN; i++) {
      const r = slot.o === "v" ? slot.row + i : slot.row;
      const c = slot.o === "h" ? slot.col + i : slot.col;
      grid[r][c] = word[i];
    }
  });
  return grid;
}

function isMixed(packing: Slot[]): boolean {
  return packing.some((s) => s.o === "h") && packing.some((s) => s.o === "v");
}

export interface SolvableBoard {
  grid: string[][]; // row-major char grid, "" = gap (there are none at start)
  order: string[]; // the guaranteed gravity-safe order to cue the words in
}

// Generate a full rows×cols board packed with `words`, together with a proven
// gravity-safe solve order. Retries random packings; prefers a horizontal+
// vertical MIX but accepts a single-orientation board if that is the only solvable
// one found. `words` must be distinct (see pickWords).
export function buildSolvableBoard(
  rows: number,
  cols: number,
  words: string[]
): SolvableBoard {
  const k = words.length;
  let fallback: SolvableBoard | null = null;

  for (let attempt = 0; attempt < 6000; attempt++) {
    const packing = findPacking(rows, cols, k);
    if (!packing) continue;
    const grid = paint(rows, cols, packing, words);
    const order = findOrder(grid, words);
    if (!order) continue;
    if (isMixed(packing)) return { grid, order };
    if (!fallback) fallback = { grid, order };
  }

  if (fallback) return fallback;
  throw new Error("no solvable board found"); // unreachable for the sized levels
}
